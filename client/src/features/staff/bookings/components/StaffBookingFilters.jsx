import { FaSearch, FaHistory, FaCalendarDay } from 'react-icons/fa';

const StaffBookingFilters = ({
  searchQuery,
  onSearchChange,
  showTodayOnly,
  onToggleToday,
  todayBookingsCount,
  showPastBookings,
  onTogglePast,
  statusFilter,
  onStatusFilterChange,
  methodFilter,
  onMethodFilterChange,
  proofFilter,
  onProofFilterChange,
}) => (
  <>
    <div className="booking-search-bar">
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Tìm theo tên khách, SĐT hoặc mã đơn..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        className={`booking-quick-filter today-check-toggle ${showTodayOnly ? 'active' : ''}`}
        onClick={onToggleToday}
        aria-pressed={showTodayOnly}
      >
        <FaCalendarDay />
        <span>
          {showTodayOnly ? 'Bỏ lọc hôm nay' : 'Hôm nay check-in/out'}
          {!showTodayOnly && todayBookingsCount > 0 ? ` (${todayBookingsCount})` : ''}
        </span>
      </button>
      <button
        type="button"
        className={`booking-quick-filter past-bookings-toggle ${showPastBookings ? 'active' : ''}`}
        onClick={onTogglePast}
        disabled={showTodayOnly}
        title={showTodayOnly ? 'Tắt lọc hôm nay để dùng hiện/ẩn đơn quá khứ' : undefined}
      >
        <FaHistory />
        <span>{showPastBookings ? 'Ẩn đơn quá khứ' : 'Hiện đơn quá khứ'}</span>
      </button>
    </div>

    <div className="booking-filters">
      <div className="filter-group">
        <label htmlFor="staff-statusFilter">Trạng thái</label>
        <select id="staff-statusFilter" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="paid">Đã xác nhận</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="staff-methodFilter">Phương thức</label>
        <select id="staff-methodFilter" value={methodFilter} onChange={(e) => onMethodFilterChange(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="qr_code">QR chuyển khoản</option>
          <option value="vnpay">VNPay</option>
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="staff-proofFilter">Minh chứng QR</label>
        <select id="staff-proofFilter" value={proofFilter} onChange={(e) => onProofFilterChange(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="proof_submitted">Đã gửi minh chứng</option>
          <option value="proof_missing">Chưa gửi minh chứng</option>
        </select>
      </div>
    </div>
  </>
);

export default StaffBookingFilters;
