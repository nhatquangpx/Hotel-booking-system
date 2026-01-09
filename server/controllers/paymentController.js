const { VNPay, ProductCode, VnpLocale, dateFormat, ignoreLogger} = require("vnpay");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const PaymentTransaction = require("../models/PaymentTransaction");

// Helper function để khởi tạo VNPay instance
const getVNPayInstance = () => {
    return new VNPay({
        tmnCode: process.env.VNPAY_TMN_CODE,
        secureSecret: process.env.VNPAY_SECURE_SECRET,
        vnpayHost: process.env.VNPAY_HOST,
        testMode: true,
        hashAlgorithm: 'SHA512',
        loggerFn: ignoreLogger,
    });
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
            .populate('hotel', 'name')
            .populate('room', 'roomNumber type');

        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
        }

        // Kiểm tra quyền: chỉ guest của booking mới được thanh toán
        if (booking.guest.toString() !== userId) {
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

        // Tạo transaction reference từ booking ID và timestamp
        const transactionRef = `${booking._id.toString().slice(-12)}${Date.now()}`.slice(0, 20);

        // Lấy IP address từ request
        const clientIp = req.ip || 
                        req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        '127.0.0.1';

        // Tạo payment transaction record
        const paymentTransaction = new PaymentTransaction({
            booking: booking._id,
            transactionRef: transactionRef,
            amount: booking.totalAmount,
            paymentMethod: "vnpay",
            status: "pending",
            clientIp: clientIp
        });
        await paymentTransaction.save();

        // Lưu transaction reference vào booking
        booking.vnpTransactionRef = transactionRef;
        await booking.save();

        // Khởi tạo VNPay
        const vnpay = getVNPayInstance();

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

// Xử lý callback từ VNPay
exports.vnpayCallback = async (req, res) => {
    try {
        const vnpay = getVNPayInstance();
        
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

// Lấy danh sách payment transactions (cho admin hoặc guest xem transactions của mình)
exports.getPaymentTransactions = async (req, res) => {
    try {
        const { bookingId, status } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = {};

        // Nếu là guest, chỉ xem transactions của bookings của mình
        if (userRole !== "admin") {
            const userBookings = await Booking.find({ guest: userId }).select('_id');
            const bookingIds = userBookings.map(b => b._id);
            query.booking = { $in: bookingIds };
        }

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
        const userRole = req.user.role;

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

        // Kiểm tra quyền: admin hoặc guest của booking
        if (userRole !== "admin") {
            const booking = transaction.booking;
            if (!booking || booking.guest.toString() !== userId) {
                return res.status(403).json({ message: "Bạn không có quyền xem giao dịch này" });
            }
        }

        return res.status(200).json(transaction);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết payment transaction:", error);
        return res.status(500).json({ message: "Lỗi khi lấy chi tiết giao dịch", error: error.message });
    }
};

