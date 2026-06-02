import React from 'react';
import { FaHotel, FaChevronDown } from 'react-icons/fa';
import { useOwnerHotel } from '../context/OwnerHotelContext';
import { getHotelStatusLabel } from '@/shared/utils/hotelStatus';
import './OwnerHotelSelect.scss';

/**
 * Chọn khách sạn dùng chung cho mọi trang owner (header).
 */
const OwnerHotelSelect = () => {
  const { hotels, loading, selectedHotelId, setSelectedHotelId } = useOwnerHotel();

  if (loading) {
    return (
      <div className="owner-hotel-select owner-hotel-select--loading" aria-live="polite" aria-busy="true">
        <span className="owner-hotel-select__icon-wrap" aria-hidden>
          <FaHotel className="owner-hotel-select__icon" />
        </span>
        <div className="owner-hotel-select__loading-text">
          <span className="owner-hotel-select__hint">Khách sạn</span>
          <span className="owner-hotel-select__skeleton-line" />
        </div>
      </div>
    );
  }

  if (!hotels.length) {
    return (
      <div className="owner-hotel-select owner-hotel-select--empty" role="status">
        <span className="owner-hotel-select__icon-wrap owner-hotel-select__icon-wrap--muted" aria-hidden>
          <FaHotel className="owner-hotel-select__icon" />
        </span>
        <span className="owner-hotel-select__empty-msg">Chưa có khách sạn</span>
      </div>
    );
  }

  const formatHotelOptionLabel = (h) => {
    const status = h.status || 'active';
    if (status === 'active') return h.name;
    return `${h.name} — ${getHotelStatusLabel(status)}`;
  };

  if (hotels.length === 1) {
    const single = hotels[0];
    return (
      <div
        className="owner-hotel-select owner-hotel-select--single"
        title={formatHotelOptionLabel(single)}
      >
        <span className="owner-hotel-select__icon-wrap" aria-hidden>
          <FaHotel className="owner-hotel-select__icon" />
        </span>
        <div className="owner-hotel-select__text">
          <span className="owner-hotel-select__hint">Đang quản lý</span>
          <span className="owner-hotel-select__name">{formatHotelOptionLabel(single)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-hotel-select owner-hotel-select--multi">
      <span className="owner-hotel-select__icon-wrap" aria-hidden>
        <FaHotel className="owner-hotel-select__icon" />
      </span>
      <label className="owner-hotel-select__field">
        <span className="owner-hotel-select__hint">Chọn khách sạn</span>
        <div className="owner-hotel-select__select-wrap">
          <select
            className="owner-hotel-select__control"
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            aria-label="Chọn khách sạn đang quản lý"
          >
            {hotels.map((h) => (
              <option key={h._id} value={h._id}>
                {formatHotelOptionLabel(h)}
              </option>
            ))}
          </select>
          <FaChevronDown className="owner-hotel-select__chevron" aria-hidden />
        </div>
      </label>
    </div>
  );
};

export default OwnerHotelSelect;
