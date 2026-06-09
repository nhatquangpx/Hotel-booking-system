/** Trạng thái đơn QR sau khi chủ KS yêu cầu tải lại minh chứng (invalid_proof). */
export const needsQrProofResubmit = (booking) =>
  booking?.paymentStatus === 'pending' &&
  booking?.ownerQrRejectionType === 'invalid_proof' &&
  !booking?.qrPaymentReportedAt;

/** Đơn bị hủy do thanh toán QR chưa thành công (payment_not_successful). */
export const isQrPaymentRejectedCancelled = (booking) =>
  booking?.paymentStatus === 'cancelled' &&
  booking?.ownerQrRejectionType === 'payment_not_successful';
