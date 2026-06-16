import React from 'react';
import ViewListIcon from '@mui/icons-material/ViewList';
import HotelIcon from '@mui/icons-material/Hotel';
import { VIEW_MODES } from '../utils/bookingListHelpers';

const VIEW_OPTIONS = [
  { value: VIEW_MODES.LIST, label: 'Danh sách', Icon: ViewListIcon },
  { value: VIEW_MODES.HOTEL, label: 'Theo khách sạn', Icon: HotelIcon },
];

const BookingViewModeSelector = ({ value, onChange }) => (
  <div className="view-mode-selector" role="tablist" aria-label="Chế độ hiển thị đặt phòng">
    {VIEW_OPTIONS.map(({ value: mode, label, Icon }) => {
      const isActive = value === mode;
      return (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`view-mode-option${isActive ? ' is-active' : ''}`}
          onClick={() => onChange(mode)}
        >
          <span className="view-mode-option__icon" aria-hidden>
            <Icon fontSize="small" />
          </span>
          <span className="view-mode-option__label">{label}</span>
        </button>
      );
    })}
  </div>
);

export default BookingViewModeSelector;
