function isVnpayConfigComplete(vnpay) {
  return Boolean(
    String(vnpay?.tmnCode || "").trim() && String(vnpay?.secureSecret || "").trim()
  );
}

module.exports = {
  isVnpayConfigComplete
};
