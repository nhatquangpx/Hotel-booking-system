const { VNPay, ProductCode, VnpLocale, dateFormat, ignoreLogger } = require("vnpay");
const Booking = require("../../models/Booking");
const Hotel = require("../../models/Hotel");
const PaymentTransaction = require("../../models/PaymentTransaction");
const {
  notifyPaymentSuccessful,
  notifyGuestBookingConfirmed,
  notifyAdminHighValueBooking,
} = require("../notifications");
const { sendReceiptEmail, sendCheckInReminderIfNeeded } = require("../emails");
const { resolveEffectiveQrConfig } = require("./qrConfig");
const { isVnpayConfigComplete } = require("../hotels/paymentConfig");
const { getClientIp } = require("../../lib/http/requestIp");
const { refIdsMatch } = require("../../lib/ids/mongooseIds");
const { ServiceError } = require("../../lib/http/serviceError");
const { getBookingFinalAmount } = require("../bookings/bookingAmount");
const { isPendingHoldExpired } = require("../../lib/booking/pendingHold");
const { cancelPendingBookingDueToExpiry } = require("../bookings/pendingExpiry");
const { checkRoomAvailability, refreshRoomBookingStatus } = require("../bookings/core");
const { computePendingExpiresAt } = require("../../lib/booking/pendingHoldConfig");

const DEFAULT_SANDBOX_HOST = "https://sandbox.vnpayment.vn";

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
    if (!existed) return transactionRef;
  }

  throw new ServiceError(500, "Không thể tạo transactionRef duy nhất, vui lòng thử lại");
};

const isDuplicateKeyError = (error) =>
  error && (error.code === 11000 || String(error.message || "").includes("E11000"));

const createPaymentTransactionWithRetry = async (booking, payload, maxRetries = 3) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      const transactionRef = await generateUniqueTransactionRef(booking._id);
      return await PaymentTransaction.create({
        ...payload,
        booking: booking._id,
        transactionRef,
      });
    } catch (error) {
      lastError = error;
      if (!isDuplicateKeyError(error)) throw error;
    }
  }

  throw lastError || new ServiceError(500, "Không thể tạo giao dịch thanh toán duy nhất");
};

const resolveProofImageUrl = (file) => {
  if (!file) return null;

  const candidate = file.path || file.secure_url || file.url || "";
  if (/^https?:\/\//i.test(candidate)) return candidate;

  if (file.filename) return `/uploads/payment-proofs/${file.filename}`;

  const normalizedPath = String(candidate).replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) return normalizedPath.slice(uploadsIndex);

  return null;
};

async function rejectIfPendingHoldExpired(booking) {
  if (!isPendingHoldExpired(booking)) return booking;
  await cancelPendingBookingDueToExpiry(booking);
  throw new ServiceError(
    400,
    "Đơn đã quá thời hạn giữ phòng chưa thanh toán và đã bị hủy. Vui lòng đặt phòng mới."
  );
}

async function createVNPayPaymentUrl({ bookingId, userId, req }) {
  if (!bookingId) throw new ServiceError(400, "Vui lòng cung cấp bookingId");

  const booking = await Booking.findById(bookingId)
    .populate("hotel", "name " + Hotel.PAYMENT_CONFIG_SELECT)
    .populate("room", "roomNumber type");

  if (!booking) throw new ServiceError(404, "Không tìm thấy đơn đặt phòng");
  if (!refIdsMatch(booking.guest, userId)) {
    throw new ServiceError(403, "Bạn không có quyền thanh toán đơn đặt phòng này");
  }
  if (booking.paymentStatus === "paid") {
    throw new ServiceError(400, "Đơn đặt phòng đã được thanh toán");
  }
  if (booking.paymentMethod !== "vnpay") {
    throw new ServiceError(400, "Phương thức thanh toán không phải VNPay");
  }

  await rejectIfPendingHoldExpired(booking);

  const clientIp = getClientIp(req);
  const paymentTransaction = await createPaymentTransactionWithRetry(booking, {
    amount: getBookingFinalAmount(booking),
    paymentMethod: "vnpay",
    status: "pending",
    clientIp,
  });
  const transactionRef = paymentTransaction.transactionRef;

  booking.vnpTransactionRef = transactionRef;
  await booking.save();

  const merchantConfig = booking.hotel?.paymentConfig?.vnpay || {};
  if (!isVnpayConfigComplete(merchantConfig)) {
    throw new ServiceError(
      400,
      "Khách sạn chưa cấu hình VNPay merchant (TMN Code/Secure Secret). Vui lòng chọn thanh toán QR."
    );
  }

  const vnpay = getVNPayInstance(merchantConfig);
  const holdExpiresAt = booking.pendingExpiresAt
    ? new Date(booking.pendingExpiresAt)
    : computePendingExpiresAt();
  const orderInfo = `Thanh toan dat phong ${booking.hotel?.name || "Hotel"} - Phong ${booking.room?.roomNumber || "N/A"}`;

  const vnpayResponse = await vnpay.buildPaymentUrl({
    vnp_Amount: getBookingFinalAmount(booking),
    vnp_IpAddr: clientIp,
    vnp_TxnRef: transactionRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(new Date()),
    vnp_ExpireDate: dateFormat(holdExpiresAt),
  });

  return {
    status: 200,
    body: {
      paymentUrl: vnpayResponse,
      bookingId: booking._id,
      transactionRef,
    },
  };
}

async function confirmQrPayment({ bookingId, userId, req }) {
  if (!bookingId) throw new ServiceError(400, "Vui lòng cung cấp bookingId");

  const booking = await Booking.findById(bookingId).populate("hotel", Hotel.PAYMENT_CONFIG_SELECT);
  if (!booking) throw new ServiceError(404, "Không tìm thấy đơn đặt phòng");
  if (!refIdsMatch(booking.guest, userId)) {
    throw new ServiceError(403, "Bạn không có quyền xác nhận đơn đặt phòng này");
  }
  if (booking.paymentMethod !== "qr_code") {
    throw new ServiceError(400, "Đơn đặt phòng này không sử dụng thanh toán QR");
  }
  if (booking.paymentStatus === "paid") {
    throw new ServiceError(400, "Đơn đặt phòng đã được thanh toán");
  }
  if (booking.paymentStatus === "cancelled") {
    throw new ServiceError(400, "Đơn đặt phòng đã bị hủy");
  }

  await rejectIfPendingHoldExpired(booking);

  const qr = resolveEffectiveQrConfig(booking.hotel?.paymentConfig?.qr || {});
  if (!qr.isConfigured) {
    throw new ServiceError(
      400,
      "Khách sạn chưa cấu hình đủ thanh toán QR (thiếu tên chủ TK/số TK/ngân hàng/ảnh QR). Không thể ghi nhận chuyển khoản."
    );
  }

  const proofImageUrl = resolveProofImageUrl(req.file);
  if (booking.qrPaymentReportedAt) {
    if (!booking.qrPaymentProofUrl && !proofImageUrl) {
      throw new ServiceError(
        400,
        "Bạn cần tải lên ảnh minh chứng chuyển khoản để hoàn tất xác nhận thanh toán."
      );
    }

    let needSave = false;
    if (proofImageUrl) {
      booking.qrPaymentProofUrl = proofImageUrl;
      needSave = true;
    }
    if (needSave) await booking.save();

    return {
      status: 200,
      body: {
        message: "Bạn đã báo thanh toán trước đó, vui lòng chờ khách sạn xác nhận",
        qrPaymentReportedAt: booking.qrPaymentReportedAt,
        qrPaymentProofUrl: booking.qrPaymentProofUrl || null,
      },
    };
  }

  if (!proofImageUrl) {
    throw new ServiceError(
      400,
      "Vui lòng tải lên ảnh minh chứng chuyển khoản trước khi xác nhận thanh toán."
    );
  }

  const clientIp = getClientIp(req);
  booking.qrPaymentReportedAt = new Date();
  booking.qrPaymentProofUrl = proofImageUrl;
  booking.ownerPaymentRejectionReason = undefined;
  booking.ownerQrRejectionType = undefined;
  await booking.save();

  await createPaymentTransactionWithRetry(booking, {
    amount: getBookingFinalAmount(booking),
    paymentMethod: "qr_code",
    status: "pending",
    clientIp,
    proofImageUrl: booking.qrPaymentProofUrl || undefined,
  });

  return {
    status: 200,
    body: {
      message: "Đã ghi nhận bạn đã chuyển khoản. Vui lòng chờ khách sạn xác nhận.",
      qrPaymentReportedAt: booking.qrPaymentReportedAt,
      qrPaymentProofUrl: booking.qrPaymentProofUrl || null,
    },
  };
}

async function handleVnpayRefundRequired({ booking, paymentResult, paymentTransaction, reason }) {
  paymentTransaction.status = "success";
  paymentTransaction.errorMessage = reason;
  await paymentTransaction.save();

  console.error(
    `VNPay thanh toán thành công nhưng không thể xác nhận booking ${booking._id}: ${reason}`
  );

  return {
    redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent(reason)}&refundPending=1&bookingId=${booking._id}`,
  };
}

async function handleVnpaySuccess(booking, paymentResult, paymentTransaction) {
  const freshBooking = await Booking.findById(booking._id);
  if (!freshBooking) {
    return {
      redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent("Không tìm thấy đơn đặt phòng")}`,
    };
  }

  if (freshBooking.paymentStatus === "paid") {
    return {
      redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?vnp_ResponseCode=00&bookingId=${booking._id}`,
    };
  }

  if (freshBooking.paymentStatus === "cancelled") {
    return handleVnpayRefundRequired({
      booking: freshBooking,
      paymentResult,
      paymentTransaction,
      reason:
        "Đơn đã bị hủy trước khi thanh toán hoàn tất. Vui lòng liên hệ khách sạn hoặc hỗ trợ để được hoàn tiền thủ công nếu đã bị trừ tiền.",
    });
  }

  if (freshBooking.paymentStatus !== "pending") {
    return handleVnpayRefundRequired({
      booking: freshBooking,
      paymentResult,
      paymentTransaction,
      reason: "Trạng thái đơn không hợp lệ để xác nhận thanh toán. Vui lòng liên hệ khách sạn hoặc hỗ trợ để được hoàn tiền thủ công nếu đã bị trừ tiền.",
    });
  }

  const roomAvailable = await checkRoomAvailability(
    freshBooking.room,
    freshBooking.checkInDate,
    freshBooking.checkOutDate,
    freshBooking._id
  );

  if (!roomAvailable) {
    return handleVnpayRefundRequired({
      booking: freshBooking,
      paymentResult,
      paymentTransaction,
      reason:
        "Phòng không còn trống cho khoảng ngày đã chọn. Vui lòng liên hệ khách sạn hoặc hỗ trợ để được hoàn tiền thủ công nếu đã bị trừ tiền, hoặc đặt phòng khác.",
    });
  }

  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, paymentStatus: "pending" },
    {
      paymentStatus: "paid",
      vnpTransactionRef: paymentResult.vnp_TxnRef,
      $unset: { pendingExpiresAt: "" },
    },
    { new: true }
  );

  if (!updatedBooking) {
    const latest = await Booking.findById(booking._id);
    if (latest?.paymentStatus === "paid") {
      return {
        redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?vnp_ResponseCode=00&bookingId=${booking._id}`,
      };
    }
    return handleVnpayRefundRequired({
      booking: latest || freshBooking,
      paymentResult,
      paymentTransaction,
      reason:
        "Không thể cập nhật trạng thái đơn. Vui lòng liên hệ khách sạn hoặc hỗ trợ để được hoàn tiền thủ công nếu đã bị trừ tiền.",
    });
  }

  await refreshRoomBookingStatus(updatedBooking.room);

  console.log(`Đã cập nhật booking ${booking._id} thành paid sau khi thanh toán VNPay thành công`);

  const populatedBooking = await Booking.findById(updatedBooking._id)
    .populate("guest", "name email phone")
    .populate("hotel", "name address contactInfo")
    .populate("room", "roomNumber type price maxPeople");

  if (populatedBooking?.guest?.email) {
    sendReceiptEmail(populatedBooking, "vnpay", paymentResult.vnp_TxnRef)
      .then((success) => {
        if (success) console.log(`Đã gửi email hóa đơn cho booking ${booking._id}`);
        else console.error(`Không thể gửi email hóa đơn cho booking ${booking._id}`);
      })
      .catch((err) => console.error("Lỗi khi gửi email hóa đơn:", err));

    sendCheckInReminderIfNeeded(populatedBooking).catch((err) =>
      console.error("Lỗi khi gửi email nhắc nhở check-in:", err)
    );
  }

  notifyPaymentSuccessful(booking._id).catch((err) =>
    console.error("Lỗi khi tạo thông báo thanh toán thành công cho owner:", err)
  );
  notifyGuestBookingConfirmed(booking._id).catch((err) =>
    console.error("Lỗi khi tạo thông báo xác nhận đặt phòng cho guest:", err)
  );

  if (getBookingFinalAmount(booking) >= 10000000) {
    notifyAdminHighValueBooking(booking._id, 10000000).catch((err) =>
      console.error("Lỗi khi tạo thông báo đặt phòng giá trị cao cho admin:", err)
    );
  }

  return {
    redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?vnp_ResponseCode=00&bookingId=${booking._id}`,
  };
}

async function vnpayCallback({ query }) {
  const callbackTmnCode = String(query?.vnp_TmnCode || "").trim();
  if (!callbackTmnCode) {
    console.error("VNPay callback thiếu vnp_TmnCode, từ chối xử lý callback.");
    throw new ServiceError(400, "Callback VNPay không hợp lệ: thiếu vnp_TmnCode.");
  }

  const hotel = await Hotel.findOne({
    "paymentConfig.vnpay.tmnCode": callbackTmnCode,
  }).select(Hotel.PAYMENT_CONFIG_SELECT);

  if (!hotel?.paymentConfig?.vnpay?.secureSecret) {
    console.error(`VNPay callback dùng TMN code không ánh xạ merchant khách sạn: ${callbackTmnCode}`);
    throw new ServiceError(400, "Callback VNPay không hợp lệ: TMN code không được cấu hình.");
  }

  const merchantConfig = {
    tmnCode: hotel.paymentConfig.vnpay.tmnCode,
    secureSecret: hotel.paymentConfig.vnpay.secureSecret,
  };
  const vnpay = getVNPayInstance(merchantConfig);
  const paymentResult = await vnpay.verifyReturnUrl(query);

  const paymentTransaction = await PaymentTransaction.findOne({
    transactionRef: paymentResult.vnp_TxnRef,
  });

  if (!paymentTransaction) {
    console.error(`Không tìm thấy payment transaction với transactionRef: ${paymentResult.vnp_TxnRef}`);
    return {
      redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent("Không tìm thấy giao dịch thanh toán")}`,
    };
  }

  const booking = await Booking.findById(paymentTransaction.booking);
  if (!booking) {
    console.error(`Không tìm thấy booking cho transaction ${paymentResult.vnp_TxnRef}`);
    return {
      redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent("Không tìm thấy đơn đặt phòng")}`,
    };
  }

  paymentTransaction.vnpResponseCode = paymentResult.vnp_ResponseCode;
  paymentTransaction.vnpTransactionStatus = paymentResult.vnp_TransactionStatus;
  paymentTransaction.vnpBankCode = paymentResult.vnp_BankCode;
  paymentTransaction.vnpCardType = paymentResult.vnp_CardType;
  paymentTransaction.vnpTxnRef = paymentResult.vnp_TxnRef;
  paymentTransaction.vnpAmount = paymentResult.vnp_Amount;
  paymentTransaction.vnpOrderInfo = paymentResult.vnp_OrderInfo;
  paymentTransaction.vnpRawData = paymentResult;

  if (paymentResult.vnp_ResponseCode === "00") {
    paymentTransaction.status = "success";
    await paymentTransaction.save();
    return handleVnpaySuccess(booking, paymentResult, paymentTransaction);
  }

  paymentTransaction.status = "failed";
  paymentTransaction.errorMessage = `VNPay response code: ${paymentResult.vnp_ResponseCode}`;
  await paymentTransaction.save();

  console.log(
    `Thanh toán VNPay thất bại cho booking ${booking._id}, responseCode: ${paymentResult.vnp_ResponseCode}`
  );

  return {
    redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?vnp_ResponseCode=${paymentResult.vnp_ResponseCode}&bookingId=${booking._id}&message=${encodeURIComponent("Thanh toán thất bại")}`,
  };
}

async function vnpayCallbackWithErrorRecovery({ query }, error) {
  console.error("Lỗi khi xử lý VNPay callback:", error);

  try {
    const transactionRef = query.vnp_TxnRef;
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

  return {
    redirect: `${process.env.FRONTEND_URL}/payment/vnpay-return?message=${encodeURIComponent("Lỗi xử lý thanh toán")}`,
  };
}

async function getPaymentTransactions({ userId, bookingId, status }) {
  const userBookings = await Booking.find({ guest: userId }).select("_id");
  const bookingIds = userBookings.map((b) => b._id);
  const query = { booking: { $in: bookingIds } };

  if (bookingId) query.booking = bookingId;
  if (status) query.status = status;

  const transactions = await PaymentTransaction.find(query)
    .populate({
      path: "booking",
      populate: [
        { path: "hotel", select: "name" },
        { path: "room", select: "roomNumber type" },
        { path: "guest", select: "name email" },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(100);

  return { status: 200, body: transactions };
}

async function getPaymentTransactionById({ id, userId }) {
  const transaction = await PaymentTransaction.findById(id).populate({
    path: "booking",
    populate: [
      { path: "hotel", select: "name address" },
      { path: "room", select: "roomNumber type price" },
      { path: "guest", select: "name email phone" },
    ],
  });

  if (!transaction) throw new ServiceError(404, "Không tìm thấy giao dịch thanh toán");

  const booking = transaction.booking;
  if (!booking || !refIdsMatch(booking.guest, userId)) {
    throw new ServiceError(403, "Bạn không có quyền xem giao dịch này");
  }

  return { status: 200, body: transaction };
}

module.exports = {
  createVNPayPaymentUrl,
  confirmQrPayment,
  vnpayCallback,
  vnpayCallbackWithErrorRecovery,
  getPaymentTransactions,
  getPaymentTransactionById,
};
