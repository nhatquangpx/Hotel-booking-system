import './BookingSearch.scss';

/**
 * Booking Search Component
 * Form tìm phòng trống theo ngày nhận phòng và trả phòng
 */
const BookingSearch = ({ bookingDates, onDateChange, onSearch, loading }) => {
  return (
    <div className="booking-search">
      <h2>Tìm phòng trống</h2>
      <div className="date-picker">
        <div className="date-field">
          <label htmlFor="checkInDate">Ngày nhận phòng</label>
          <input
            type="date"
            id="checkInDate"
            name="checkInDate"
            value={bookingDates.checkInDate}
            onChange={onDateChange}
            min={new Date().toISOString().split('T')[0]}
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
            min={bookingDates.checkInDate || new Date().toISOString().split('T')[0]}
          />
        </div>
        <button 
          onClick={onSearch}
          disabled={!bookingDates.checkInDate || !bookingDates.checkOutDate || loading}
          className="search-btn"
        >
          {loading ? 'Đang tìm...' : 'Tìm phòng'}
        </button>
      </div>
    </div>
  );
};

export default BookingSearch;

