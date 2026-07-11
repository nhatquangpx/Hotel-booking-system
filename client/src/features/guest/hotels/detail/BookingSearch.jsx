import './BookingSearch.scss';

/** Ngày trả phòng tối thiểu (YYYY-MM-DD) để đủ ít nhất 1 đêm (cùng quy ước server). */
function minCheckOutOneNightAfter(checkInISO) {
  if (!checkInISO) return null;
  const d = new Date(`${checkInISO}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatStaySummary(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const start = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return `${nights} đêm · ${checkIn} → ${checkOut}`;
}

/**
 * Booking Search Component
 * Form tìm phòng trống theo ngày nhận phòng và trả phòng
 */
const BookingSearch = ({
  bookingDates,
  onDateChange,
  onSearch,
  loading,
  disabled = false,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const checkOutMinFromCheckIn = bookingDates.checkInDate
    ? minCheckOutOneNightAfter(bookingDates.checkInDate)
    : null;
  const checkOutMin = [today, bookingDates.checkInDate, checkOutMinFromCheckIn]
    .filter(Boolean)
    .sort()
    .pop();
  const staySummary = formatStaySummary(bookingDates.checkInDate, bookingDates.checkOutDate);
  const canSearch = Boolean(bookingDates.checkInDate && bookingDates.checkOutDate);

  return (
    <div className={`booking-search${disabled ? ' booking-search--disabled' : ''}`}>
      <div className="booking-search__header">
        <h2>Đặt phòng ngay</h2>
        <p>Kiểm tra phòng còn trống</p>
      </div>

      <div className="booking-search__body">
        {disabled ? (
          <p className="booking-search__disabled-note" role="status">
            Khách sạn hiện không nhận đặt phòng mới. Bạn vẫn có thể xem thông tin và đánh giá bên
            dưới.
          </p>
        ) : null}

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
        </div>

        {staySummary ? <div className="booking-search__summary">{staySummary}</div> : null}

        <button
          type="button"
          onClick={onSearch}
          disabled={disabled || !canSearch || loading}
          className={`search-btn${canSearch ? ' search-btn--ready' : ''}`}
        >
          {loading
            ? 'Đang tìm...'
            : canSearch
              ? 'Tìm phòng trống'
              : 'Chọn ngày để tìm phòng'}
        </button>
      </div>
    </div>
  );
};

export default BookingSearch;
