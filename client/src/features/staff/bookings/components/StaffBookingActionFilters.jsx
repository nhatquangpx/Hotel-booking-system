import { FaSearch } from 'react-icons/fa';

const StaffBookingActionFilters = ({ search, onSearchChange, type, onTypeChange }) => (
  <div className="staff-booking-action-filters">
    <div className="booking-action-filter booking-action-filter--search">
      <label htmlFor="staff-action-search" className="sr-only">
        Tìm kiếm
      </label>
      <FaSearch className="booking-action-filter__icon" aria-hidden />
      <input
        id="staff-action-search"
        type="text"
        placeholder="Tìm tên, SĐT, mã đơn, phòng..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
    <div className="booking-action-filter">
      <label htmlFor="staff-action-type">Loại</label>
      <select
        id="staff-action-type"
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        <option value="all">Tất cả</option>
        <option value="checkin">Chỉ check-in</option>
        <option value="checkout">Check-out (hôm nay & quá hạn)</option>
        <option value="overstay">Chỉ check-out quá hạn</option>
      </select>
    </div>
  </div>
);

export default StaffBookingActionFilters;
