import './BookingSearch.scss';

/** Ngày trả phòng tối thiểu (YYYY-MM-DD) để đủ ít nhất 1 đêm (cùng quy ước server). */
function minCheckOutOneNightAfter(checkInISO) {
  if (!checkInISO) return null;
  const d = new Date(`${checkInISO}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Booking Search Component
 * Form tìm phòng trống theo ngày nhận phòng và trả phòng
 * @param {number} refundMinDaysBeforeCheckIn — X ngày trước check-in: ngưỡng hoàn tiền cho đơn đã thanh toán (thông tin chính sách)
 */
const BookingSearch = ({
  bookingDates,
  onDateChange,
  onSearch,
  loading,
  refundMinDaysBeforeCheckIn = 2,
  disabled = false,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const checkOutMinFromCheckIn = bookingDates.checkInDate
    ? minCheckOutOneNightAfter(bookingDates.checkInDate)
    : null;
  const checkOutMin = [today, bookingDates.checkInDate, checkOutMinFromCheckIn].filter(Boolean).sort().pop();

  return (
    <div className={`booking-search${disabled ? ' booking-search--disabled' : ''}`}>
      <h2>Tìm phòng trống</h2>
      {disabled ? (
        <p className="booking-search__disabled-note" role="status">
          Khách sạn hiện không nhận đặt phòng mới. Bạn vẫn có thể xem thông tin và đánh giá bên dưới.
        </p>
      ) : null}
        <div className="booking-search__hint">
        <p>
          <strong>Đặt phòng:</strong> ngày trả phòng phải sau ngày nhận phòng (tối thiểu một đêm).
        </p>
        <p>
          <strong>Hoàn tiền khi hủy (chỉ khi đã thanh toán):</strong> nếu sau này bạn đã thanh toán (QR hoặc VNPay) và
          cần hủy, để được hoàn theo quy định khách sạn thường phải còn ít nhất{' '}
          <strong>{refundMinDaysBeforeCheckIn}</strong> ngày (theo lịch) trước ngày nhận phòng — tiền hoàn chuyển thủ
          công vào STK bạn cung cấp khi hủy.
        </p>
        <p>
          <strong>Chưa thanh toán:</strong> con số ngày trên <strong>không</strong> phải điều kiện hoàn tiền (không có
          tiền đã thu để hoàn); bạn vẫn có thể hủy đơn theo luồng hệ thống khi được phép.
        </p>
      </div>
      <div className="date-picker">
        <div className="date-field">
          <label htmlFor="checkInDate">Ngày nhận phòng</label>
          <input
            type="date"
            id="checkInDate"
            name="checkInDate"
            value={bookingDates.checkInDate}
            onChange={onDateChange}
            min={today}
            disabled={disabled}
          />
        </div>
        <div className="date-field">
          <label htmlFor="checkOutDate">Ngày trả phòng</label>
          <input
            type="date"
            id="checkOutDate"
            name="checkOutDate"
            value={bookingDates.checkOutDate}
            onChange={onDateChange}
            min={checkOutMin || today}
            disabled={disabled}
          />
        </div>
        <button 
          onClick={onSearch}
          disabled={disabled || !bookingDates.checkInDate || !bookingDates.checkOutDate || loading}
          className="search-btn"
        >
          {loading ? 'Đang tìm...' : 'Tìm phòng'}
        </button>
      </div>
    </div>
  );
};

export default BookingSearch;
