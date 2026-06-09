/** Lựa chọn lý do xử lý minh chứng QR (modal chủ khách sạn). */
export const QR_REJECTION_OPTIONS = [
  {
    value: 'invalid_proof',
    label: 'Minh chứng không hợp lệ',
    description: 'Đã có biến động số dư — yêu cầu khách tải lại minh chứng. Đơn vẫn giữ.',
  },
  {
    value: 'payment_not_successful',
    label: 'Thanh toán chưa thành công',
    description: 'Không có biến động số dư — hủy đơn và báo khách đặt phòng mới.',
  },
];
