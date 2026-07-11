/** Ngưỡng phát hiện hủy đơn liên tục (guest-initiated). */
module.exports = {
  /** Số lần khách tự hủy trong cửa sổ để tạo cờ cho admin */
  THRESHOLD: 3,
  /** Độ dài cửa sổ tính (ngày) */
  WINDOW_DAYS: 7,
  /** Số ngày cấm mặc định khi admin chọn tạm thời */
  DEFAULT_SANCTION_DAYS: 7,
  /** Các lựa chọn ngày cấm trên UI */
  SANCTION_DAY_OPTIONS: [3, 7, 14, 30],
};
