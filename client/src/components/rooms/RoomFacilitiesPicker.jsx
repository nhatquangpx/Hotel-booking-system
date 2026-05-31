import React, { useEffect, useRef, useState } from 'react';
import { ROOM_FACILITY_OPTIONS } from '@/constants/roomFacilities';
import './RoomFacilitiesPicker.scss';

/**
 * Chọn tiện nghi phòng: tag đã chọn + dropdown tìm kiếm (giống form owner).
 */
const RoomFacilitiesPicker = ({ facilities = [], onChange, className = '' }) => {
  const wrapperRef = useRef(null);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleToggleFacility = (facility) => {
    if (facilities.includes(facility)) {
      onChange(facilities.filter((f) => f !== facility));
    } else {
      onChange([...facilities, facility]);
    }
  };

  const handleRemoveFacility = (facility) => {
    onChange(facilities.filter((f) => f !== facility));
  };

  const availableFacilities = ROOM_FACILITY_OPTIONS.filter(
    (facility) =>
      !facilities.includes(facility) &&
      facility.toLowerCase().includes(facilitySearch.toLowerCase())
  );

  return (
    <div className={`room-facilities-picker ${className}`.trim()}>
      <label className="room-facilities-picker__label">Tiện nghi phòng</label>
      <div className="room-facilities-picker__tags">
        {facilities.map((facility) => (
          <div key={facility} className="facility-tag">
            {facility}
            <button type="button" onClick={() => handleRemoveFacility(facility)} aria-label={`Xóa ${facility}`}>
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="facility-dropdown-wrapper" ref={wrapperRef}>
        <div
          className="facility-dropdown-trigger"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          role="presentation"
        >
          <input
            type="text"
            placeholder="Tìm kiếm và chọn tiện nghi..."
            value={facilitySearch}
            onChange={(e) => {
              setFacilitySearch(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
          />
          <span className="dropdown-arrow">▼</span>
        </div>
        {isDropdownOpen && (
          <div className="facility-dropdown-menu">
            {availableFacilities.length > 0 ? (
              availableFacilities.map((facility) => (
                <label key={facility} className="facility-option">
                  <input
                    type="checkbox"
                    checked={facilities.includes(facility)}
                    onChange={() => handleToggleFacility(facility)}
                  />
                  <span>{facility}</span>
                </label>
              ))
            ) : (
              <div className="facility-dropdown-empty">
                {facilitySearch ? 'Không tìm thấy tiện nghi' : 'Đã chọn tất cả tiện nghi'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomFacilitiesPicker;
