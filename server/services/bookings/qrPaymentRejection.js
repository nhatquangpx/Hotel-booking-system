const QR_REJECTION_MESSAGES = {
  invalid_proof: "Minh chứng không hợp lệ",
  payment_not_successful: "Thanh toán chưa thành công",
};

const getQrRejectionMessage = (type) => QR_REJECTION_MESSAGES[type] || "";

module.exports = {
  QR_REJECTION_MESSAGES,
  getQrRejectionMessage,
};
