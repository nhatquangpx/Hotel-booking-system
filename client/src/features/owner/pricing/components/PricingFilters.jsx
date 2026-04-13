import React from 'react';

/**
 * Bộ lọc: khách sạn, loại phòng, số ngày, làm mới, popover hướng dẫn.
 */
const PricingFilters = ({
  hotels,
  hotelId,
  onHotelIdChange,
  roomTypes,
  selectedRoomType,
  onRoomTypeChange,
  days,
  onDaysChange,
  loading,
  onRefresh,
}) => {
  return (
    <div className="filters">
      <label className="filter-field">
        <span>Khách sạn</span>
        <select
          value={hotelId}
          onChange={(e) => onHotelIdChange(e.target.value)}
          disabled={!hotels.length}
        >
          {hotels.length === 0 ? (
            <option value="">Chưa có khách sạn</option>
          ) : (
            hotels.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))
          )}
        </select>
      </label>
      <label className="filter-field">
        <span>Loại phòng</span>
        <select
          value={selectedRoomType}
          onChange={(e) => onRoomTypeChange(e.target.value)}
          disabled={!roomTypes.length}
        >
          {roomTypes.length === 0 ? (
            <option value="">—</option>
          ) : (
            roomTypes.map((rt) => (
              <option key={rt.type} value={rt.type}>
                {rt.typeLabel} ({rt.roomCount} phòng)
              </option>
            ))
          )}
        </select>
      </label>
      <label className="filter-field">
        <span>Số ngày hiển thị</span>
        <select value={days} onChange={(e) => onDaysChange(Number(e.target.value))}>
          <option value={7}>7 ngày</option>
          <option value={14}>14 ngày</option>
          <option value={30}>30 ngày</option>
        </select>
      </label>
      <button type="button" className="btn-refresh" onClick={onRefresh} disabled={loading}>
        Làm mới
      </button>
      <div className="guide-hover-wrap">
        <button
          type="button"
          className="guide-toggle"
          aria-label="Hướng dẫn sử dụng tính năng giá động"
        >
          ?
        </button>
        <div className="pricing-guide-popover" role="tooltip">
          <h3>Cách hoạt động giá động</h3>
          <ul>
            <li>Hệ thống tính riêng theo từng loại phòng, không áp một giá cho toàn khách sạn.</li>
            <li>Giá gợi ý dựa trên: tỷ lệ lấp đầy, yếu tố mùa vụ và lịch sử bán theo thứ trong tuần.</li>
            <li>Mục tiêu là tối ưu doanh thu ước tính trong kỳ bạn chọn (7/14/30 ngày).</li>
            <li>
              Bảng có cột giải thích từng hệ số (hover mở &quot;Xem&quot;). Nút &quot;Áp dụng gợi ý&quot; gán một giá đêm
              chung cho loại phòng theo trung bình kỳ.
            </li>
            <li>
              Hệ thống ghi nhớ <strong>thời điểm và mức giá</strong> lần áp dụng gợi ý gần nhất theo từng loại phòng
              (ô nhắc bên dưới) — để bạn đối chiếu trước khi áp dụng tiếp, vì sau mỗi lần đổi giá TB, lần tính sau sẽ
              dựa trên giá mới.
            </li>
            <li>Luôn có thể tinh chỉnh từng phòng tại sơ đồ phòng nếu bạn cần giá khác nhau.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingFilters;
