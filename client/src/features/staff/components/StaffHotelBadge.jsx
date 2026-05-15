import React from 'react';
import { FaHotel } from 'react-icons/fa';
import { useStaffHotel } from '../context/StaffHotelContext';
import '@/features/owner/components/OwnerHotelSelect.scss';

const StaffHotelBadge = () => {
  const { hotel, loading, error } = useStaffHotel();

  if (loading) {
    return (
      <div className="owner-hotel-select owner-hotel-select--loading" aria-live="polite">
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

  if (error || !hotel) {
    return (
      <div className="owner-hotel-select owner-hotel-select--empty" role="status">
        <span className="owner-hotel-select__icon-wrap owner-hotel-select__icon-wrap--muted" aria-hidden>
          <FaHotel className="owner-hotel-select__icon" />
        </span>
        <span className="owner-hotel-select__empty-msg">
          {error || 'Chưa gán khách sạn'}
        </span>
      </div>
    );
  }

  return (
    <div className="owner-hotel-select owner-hotel-select--single" title={hotel.name}>
      <span className="owner-hotel-select__icon-wrap" aria-hidden>
        <FaHotel className="owner-hotel-select__icon" />
      </span>
      <div className="owner-hotel-select__text">
        <span className="owner-hotel-select__hint">Đang làm việc tại</span>
        <span className="owner-hotel-select__name">{hotel.name}</span>
      </div>
    </div>
  );
};

export default StaffHotelBadge;
