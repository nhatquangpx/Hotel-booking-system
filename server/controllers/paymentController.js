const paymentService = require("../services/payments");
const { runService } = require("../lib/http/controllerHelper");

exports.createVNPayPaymentUrl = (req, res) =>
  runService(res, () =>
    paymentService.createVNPayPaymentUrl({
      bookingId: req.body.bookingId,
      userId: req.user.id,
      req,
    })
  );

exports.confirmQrPayment = (req, res) =>
  runService(res, () =>
    paymentService.confirmQrPayment({
      bookingId: req.body.bookingId,
      userId: req.user.id,
      req,
    })
  );

exports.vnpayCallback = async (req, res) => {
  try {
    const result = await paymentService.vnpayCallback({ query: req.query });
    if (result?.redirect) return res.redirect(result.redirect);
    const status = result?.status ?? 200;
    return res.status(status).json(result?.body ?? result);
  } catch (error) {
    const result = await paymentService.vnpayCallbackWithErrorRecovery(
      { query: req.query },
      error
    );
    if (result?.redirect) return res.redirect(result.redirect);
    return res.status(500).json({ message: error.message || "Lỗi xử lý thanh toán" });
  }
};

exports.getPaymentTransactions = (req, res) =>
  runService(res, () =>
    paymentService.getPaymentTransactions({
      userId: req.user.id,
      bookingId: req.query.bookingId,
      status: req.query.status,
    })
  );

exports.getPaymentTransactionById = (req, res) =>
  runService(res, () =>
    paymentService.getPaymentTransactionById({
      id: req.params.id,
      userId: req.user.id,
    })
  );
