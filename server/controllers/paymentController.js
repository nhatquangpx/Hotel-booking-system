const { VNPay, ProductCode, VnpLocale, dateFormat, ignoreLogger} = require("vnpay");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const PaymentTransaction = require("../models/PaymentTransaction");
const { 
  notifyPaymentSuccessful,
  notifyGuestBookingConfirmed,
  notifyAdminHighValueBooking
} = require("../services/notifications");
const { sendReceiptEmail, sendCheckInReminderIfNeeded } = require("../services/emails");
const { resolveEffectiveQrConfig } = require("../utils/paymentQrConfig");
const { isVnpayConfigComplete } = require("../utils/hotelPaymentConfig");
const { getClientIp } = require("../utils/requestIp");
const { refIdsMatch } = require("../utils/mongooseIds");

const DEFAULT_SANDBOX_HOST = "https://sandbox.vnpayment.vn";

// Helper function để khởi tạo VNPay instance
const getVNPayInstance = (merchantConfig = {}) => {
    const vnpayHost = (process.env.VNPAY_HOST || DEFAULT_SANDBOX_HOST).replace(/\/$/, "");
    const testMode = process.env.VNPAY_TEST_MODE !== "false";
    const tmnCode = merchantConfig.tmnCode || process.env.VNPAY_TMN_CODE;
    const secureSecret = merchantConfig.secureSecret || process.env.VNPAY_SECURE_SECRET;

    return new VNPay({
        tmnCode,
        secureSecret,
        vnpayHost,
        testMode,
        hashAlgorithm: "SHA512",
        loggerFn: ignoreLogger,
    });
};

const generateUniqueTransactionRef = async (bookingId) => {
    const bookingSuffix = String(bookingId).slice(-6);

    for (let i = 0; i < 5; i += 1) {
        const timePart = Date.now().toString().slice(-10);
        const randomPart = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");
        const transactionRef = `${bookingSuffix}${timePart}${randomPart}`.slice(0, 20);

        const existed = await PaymentTransaction.exists({ transactionRef });
        if (!existed) {
            return transactionRef;
        }
    }

    throw new Error("Không thể tạo transactionRef duy nhất, vui lòng thử lại");
};

const isDuplicateKeyError = (error) => {
    return error && (error.code === 11000 || String(error.message || "").includes("E11000"));
};

const createPaymentTransactionWithRetry = async (booking, payload, maxRetries = 3) => {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        try {
            const transactionRef = await generateUniqueTransactionRef(booking._id);
            return await PaymentTransaction.create({
                ...payload,
                booking: booking._id,
                transactionRef
            });
        } catch (error) {
            lastError = error;
            if (!isDuplicateKeyError(error)) {
                throw error;
            }
        }
    }

    throw lastError || new Error("Không thể tạo giao dịch thanh toán duy nhất");
};

const resolveProofImageUrl = (file) => {
    if (!file) return null;

    const candidate = file.path || file.secure_url || file.url || "";
    if (/^https?:\/\//i.test(candidate)) {
        return candidate;
    }

    if (file.filename) {
        return `/uploads/payment-proofs/${file.filename}`;
    }

    const normalizedPath = String(candidate).replace(/\\/g, "/");
    const uploadsIndex = normalizedPath.lastIndexOf("/uploads/");
    if (uploadsIndex >= 0) {
        return normalizedPath.slice(uploadsIndex);
    }

    return null;
};

// Tạo payment URL cho booking
exports.createVNPayPaymentUrl = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id;

        if (!bookingId) {
            return res.status(400).json({ message: "Vui lòng cung cấp bookingId" });
        }

        // Tìm booking và kiểm tra quyền
        const booking = await Booking.findById(bookingId)
            .populate("hotel", "name " + Hotel.PAYMENT_CONFIG_SELECT)
            .populate('room', 'roomNumber type');

        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
        }

        // Kiểm tra quyền: chỉ guest của booking mới được thanh toán
        if (!refIdsMatch(booking.guest, userId)) {
            return res.status(403).json({ message: "Bạn không có quyền thanh toán đơn đặt phòng này" });
        }

        // Kiểm tra booking đã được thanh toán chưa
        if (booking.paymentStatus === "paid") {
            return res.status(400).json({ message: "Đơn đặt phòng đã được thanh toán" });
        }

        // Kiểm tra payment method
        if (booking.paymentMethod !== "vnpay") {
            return res.status(400).json({ message: "Phương thức thanh toán không phải VNPay" });
        }

        const clientIp = getClientIp(req);

        // Tạo payment transaction record
        const paymentTransaction = await createPaymentTransactionWithRetry(booking, {
            amount: booking.totalAmount,
            paymentMethod: "vnpay",
            status: "pending",
            clientIp: clientIp
        });
        const transactionRef = paymentTransaction.transactionRef;

        // Lưu transaction reference vào booking
        booking.vnpTransactionRef = transactionRef;
        await booking.save();

        const merchantConfig = booking.hotel?.paymentConfig?.vnpay || {};
        if (!isVnpayConfigComplete(merchantConfig)) {
            return res.status(400).json({
                message: "Khách sạn chưa cấu hình VNPay merchant (TMN Code/Secure Secret). Vui lòng chọn thanh toán QR."
            });
        }

        // Khởi tạo VNPay theo merchant của khách sạn
        const vnpay = getVNPayInstance(merchantConfig);

        // Tính ngày hết hạn (24 giờ từ bây giờ)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Tạo order info
        const orderInfo = `Thanh toan dat phong ${booking.hotel?.name || 'Hotel'} - Phong ${booking.room?.roomNumber || 'N/A'}`;

        // Build payment URL
        const returnUrl = process.env.VNPAY_RETURN_URL;
        
        const vnpayResponse = await vnpay.buildPaymentUrl({
            vnp_Amount: booking.totalAmount,
            vnp_IpAddr: clientIp,
            vnp_TxnRef: transactionRef,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: returnUrl, // URL của server để nhận callback
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date()),
            vnp_ExpireDate: dateFormat(tomorrow),
        });

        return res.status(200).json({
            paymentUrl: vnpayResponse,
            bookingId: booking._id,
            transactionRef: transactionRef
        });
    } catch (error) {
        console.error("Lỗi khi tạo VNPay payment URL:", error);
        return res.status(500).json({ message: "Lỗi khi tạo payment URL", error: error.message });
    }
};

exports.confirmQrPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id;

        if (!bookingId) {
            return res.status(400).json({ message: "Vui lòng cung cấp bookingId" });
        }

        const booking = await Booking.findById(bookingId).populate("hotel", Hotel.PAYMENT_CONFIG_SELECT);
        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
        }

        if (!refIdsMatch(booking.guest, userId)) {
            return res.status(403).json({ message: "Bạn không có quyền xác nhận đơn đặt phòng này" });
        }

        if (booking.paymentMethod !== "qr_code") {
            return res.status(400).json({ message: "Đơn đặt phòng này không sử dụng thanh toán QR" });
        }

        if (booking.paymentStatus === "paid") {
            return res.status(400).json({ message: "Đơn đặt phòng đã được thanh toán" });
        }

        if (booking.paymentStatus === "cancelled") {
            return res.status(400).json({ message: "Đơn đặt phòng đã bị hủy" });
        }

        const qr = resolveEffectiveQrConfig(booking.hotel?.paymentConfig?.qr || {});
        if (!qr.isConfigured) {
            return res.status(400).json({
                message: "Khách sạn chưa cấu hình đủ thanh toán QR (thiếu tên chủ TK/số TK/ngân hàng/ảnh QR). Không thể ghi nhận chuyển khoản."
            });
        }

        const proofImageUrl = resolveProofImageUrl(req.file);
        if (booking.qrPaymentReportedAt) {
            // Nếu đã báo thanh toán nhưng chưa có minh chứng thì bắt buộc phải nộp
            if (!booking.qrPaymentProofUrl && !proofImageUrl) {
                return res.status(400).json({
                    message: "Bạn cần tải lên ảnh minh chứng chuyển khoản để hoàn tất xác nhận thanh toán."
                });
            }

            // Cho phép guest cập nhật minh chứng sau lần báo đầu tiên
            let needSave = false;
            if (proofImageUrl) {
                booking.qrPaymentProofUrl = proofImageUrl;
                needSave = true;
            }
            if (needSave) {
                await booking.save();
            }
            return res.status(200).json({
                message: "Bạn đã báo thanh toán trước đó, vui lòng chờ khách sạn xác nhận",
                qrPaymentReportedAt: booking.qrPaymentReportedAt,
                qrPaymentProofUrl: booking.qrPaymentProofUrl || null
            });
        }

        if (!proofImageUrl) {
            return res.status(400).json({
                message: "Vui lòng tải lên ảnh minh chứng chuyển khoản trước khi xác nhận thanh toán."
            });
        }

        const clientIp = getClientIp(req);

        booking.qrPaymentReportedAt = new Date();
        booking.qrPaymentProofUrl = proofImageUrl;
        booking.ownerPaymentRejectedAt = undefined;
        booking.ownerPaymentRejectionReason = undefined;
        booking.ownerQrRejectionType = undefined;
        await booking.save();

        await createPaymentTransactionWithRetry(booking, {
            amount: booking.totalAmount,
            paymentMethod: "qr_code",
            status: "pending",
            clientIp,
            proofImageUrl: booking.qrPaymentProofUrl || undefined
        });

        return res.status(200).json({
            message: "Đã ghi nhận bạn đã chuyển khoản. Vui lòng chờ khách sạn xác nhận.",
            qrPaymentReportedAt: booking.qrPaymentReportedAt,
            qrPaymentProofUrl: booking.qrPaymentProofUrl || null
        });
    } catch (error) {
        console.error("Lỗi khi xác nhận thanh toán QR:", error);
        return res.status(500).json({ message: "Lỗi khi xác nhận thanh toán QR", error: error.message });
    }
};

// Xử lý callback từ VNPay
exports.vnpayCallback = async (req, res) => {
    try {
        const callbackTmnCode = String(req.query?.vnp_TmnCode || "").trim();
        if (!callbackTmnCode) {
            console.error("VNPay callback thiếu vnp_TmnCode, từ chối xử lý callback.");
            return res.status(400).json({ message: "Callback VNPay không hợp lệ: thiếu vnp_TmnCode." });
        }

        const hotel = await Hotel.findOne({
            "paymentConfig.vnpay.tmnCode": callbackTmnCode
        }).select(Hotel.PAYMENT_CONFIG_SELECT);
        if (!hotel?.paymentConfig?.vnpay?.secureSecret) {
            console.error(`VNPay callback dùng TMN code không ánh xạ merchant khách sạn: ${callbackTmnCode}`);
            return res.status(400).json({ message: "Callback VNPay không hợp lệ: TMN code không được cấu hình." });
        }

        const merchantConfig = {
            tmnCode: hotel.paymentConfig.vnpay.tmnCode,
            secureSecret: hotel.paymentConfig.vnpay.secureSecret
        };
        const vnpay = getVNPayInstance(merchantConfig);
        
        // Verify payment từ VNPay
        const paymentResult = await vnpay.verifyReturnUrl(req.query);

        // Tìm payment transaction theo transaction reference
        const paymentTransaction = await PaymentTransaction.findOne({ 
            transactionRef: paymentResult.vnp_TxnRef 
        });

        if (!paymentTransaction) {
            console.error(`Không tìm thấy payment transaction với transactionRef: ${paymentResult.vnp_TxnRef}`);
            return res.redirect(`${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent('Không tìm thấy giao dịch thanh toán')}`);
        }

        // Lấy booking từ database để đảm bảo có dữ liệu mới nhất
        const booking = await Booking.findById(paymentTransaction.booking);
        if (!booking) {
            console.error(`Không tìm thấy booking cho transaction ${paymentResult.vnp_TxnRef}`);
            return res.redirect(`${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent('Không tìm thấy đơn đặt phòng')}`);
        }

        // Cập nhật payment transaction với thông tin từ VNPay callback
        paymentTransaction.vnpResponseCode = paymentResult.vnp_ResponseCode;
        paymentTransaction.vnpTransactionStatus = paymentResult.vnp_TransactionStatus;
        paymentTransaction.vnpBankCode = paymentResult.vnp_BankCode;
        paymentTransaction.vnpCardType = paymentResult.vnp_CardType;
        paymentTransaction.vnpTxnRef = paymentResult.vnp_TxnRef;
        paymentTransaction.vnpAmount = paymentResult.vnp_Amount;
        paymentTransaction.vnpOrderInfo = paymentResult.vnp_OrderInfo;
        paymentTransaction.vnpRawData = paymentResult;

        // Kiểm tra response code
        // vnp_ResponseCode = '00' nghĩa là thành công
        if (paymentResult.vnp_ResponseCode === '00') {
            // Cập nhật transaction status thành success
            paymentTransaction.status = "success";
            await paymentTransaction.save();

            // Cập nhật booking status thành paid
            const updatedBooking = await Booking.findByIdAndUpdate(
                booking._id,
                { 
                    paymentStatus: "paid",
                    vnpTransactionRef: paymentResult.vnp_TxnRef
                },
                { new: true }
            );

            if (!updatedBooking) {
                console.error(`Không thể cập nhật booking ${booking._id}`);
                return res.redirect(`${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent('Lỗi cập nhật trạng thái đặt phòng')}`);
            }

            console.log(`Đã cập nhật booking ${booking._id} thành paid sau khi thanh toán VNPay thành công`);

            // Populate booking với đầy đủ thông tin để gửi email hóa đơn
            const populatedBooking = await Booking.findById(updatedBooking._id)
                .populate('guest', 'name email phone')
                .populate('hotel', 'name address contactInfo')
                .populate('room', 'roomNumber type price maxPeople');

            // Gửi email hóa đơn điện tử
            if (populatedBooking && populatedBooking.guest && populatedBooking.guest.email) {
                sendReceiptEmail(
                    populatedBooking,
                    'vnpay',
                    paymentResult.vnp_TxnRef
                ).then(success => {
                    if (success) {
                        console.log(`Đã gửi email hóa đơn cho booking ${booking._id}`);
                    } else {
                        console.error(`Không thể gửi email hóa đơn cho booking ${booking._id}`);
                    }
                }).catch(err => {
                    console.error('Lỗi khi gửi email hóa đơn:', err);
                });

                // Gửi email nhắc nhở check-in ngay nếu checkInDate là 1-2 ngày sau
                sendCheckInReminderIfNeeded(populatedBooking).catch(err => {
                    console.error('Lỗi khi gửi email nhắc nhở check-in:', err);
                });
            }

            // Tạo thông báo cho owner
            notifyPaymentSuccessful(booking._id).catch(err => {
              console.error('Lỗi khi tạo thông báo thanh toán thành công cho owner:', err);
            });

            // Tạo thông báo cho guest
            notifyGuestBookingConfirmed(booking._id).catch(err => {
              console.error('Lỗi khi tạo thông báo xác nhận đặt phòng cho guest:', err);
            });

            // Notify admins about high-value booking (threshold: 10 million VND)
            if (booking.totalAmount >= 10000000) {
              notifyAdminHighValueBooking(booking._id, 10000000).catch(err => {
                console.error('Lỗi khi tạo thông báo đặt phòng giá trị cao cho admin:', err);
              });
            }

            // Redirect về trang callback với thông tin thành công
            return res.redirect(`${process.env.FRONTEND_URL}/payment/vnpay-return?vnp_ResponseCode=00&bookingId=${booking._id}`);
        } else {
            // Thanh toán thất bại
            paymentTransaction.status = "failed";
            paymentTransaction.errorMessage = `VNPay response code: ${paymentResult.vnp_ResponseCode}`;
            await paymentTransaction.save();

            console.log(`Thanh toán VNPay thất bại cho booking ${booking._id}, responseCode: ${paymentResult.vnp_ResponseCode}`);
            
            // Giữ nguyên paymentStatus là pending
            // Redirect về trang callback với thông tin thất bại
            return res.redirect(`${process.env.FRONTEND_URL}/payment/vnpay-return?vnp_ResponseCode=${paymentResult.vnp_ResponseCode}&bookingId=${booking._id}&message=${encodeURIComponent('Thanh toán thất bại')}`);
        }
    } catch (error) {
        console.error("Lỗi khi xử lý VNPay callback:", error);
        
        // Cố gắng lưu lỗi vào transaction nếu có transactionRef
        try {
            const transactionRef = req.query.vnp_TxnRef;
            if (transactionRef) {
                const paymentTransaction = await PaymentTransaction.findOne({ transactionRef });
                if (paymentTransaction) {
                    paymentTransaction.status = "failed";
                    paymentTransaction.errorMessage = error.message;
                    await paymentTransaction.save();
                }
            }
        } catch (saveError) {
            console.error("Lỗi khi lưu error vào transaction:", saveError);
        }
        
        return res.redirect(`${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent('Lỗi xử lý thanh toán')}`);
    }
};

// Lấy danh sách payment transactions của guest (route: authenticate + isGuest)
exports.getPaymentTransactions = async (req, res) => {
    try {
        const { bookingId, status } = req.query;
        const userId = req.user.id;

        const userBookings = await Booking.find({ guest: userId }).select('_id');
        const bookingIds = userBookings.map(b => b._id);
        const query = { booking: { $in: bookingIds } };

        // Filter theo bookingId nếu có
        if (bookingId) {
            query.booking = bookingId;
        }

        // Filter theo status nếu có
        if (status) {
            query.status = status;
        }

        const transactions = await PaymentTransaction.find(query)
            .populate({
                path: 'booking',
                populate: [
                    { path: 'hotel', select: 'name' },
                    { path: 'room', select: 'roomNumber type' },
                    { path: 'guest', select: 'name email' }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(100); // Giới hạn 100 records

        return res.status(200).json(transactions);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách payment transactions:", error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách giao dịch", error: error.message });
    }
};

// Lấy chi tiết một payment transaction
exports.getPaymentTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const transaction = await PaymentTransaction.findById(id)
            .populate({
                path: 'booking',
                populate: [
                    { path: 'hotel', select: 'name address' },
                    { path: 'room', select: 'roomNumber type price' },
                    { path: 'guest', select: 'name email phone' }
                ]
            });

        if (!transaction) {
            return res.status(404).json({ message: "Không tìm thấy giao dịch thanh toán" });
        }

        const booking = transaction.booking;
        if (!booking || !refIdsMatch(booking.guest, userId)) {
            return res.status(403).json({ message: "Bạn không có quyền xem giao dịch này" });
        }

        return res.status(200).json(transaction);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết payment transaction:", error);
        return res.status(500).json({ message: "Lỗi khi lấy chi tiết giao dịch", error: error.message });
    }
};

