import React from 'react';

export const READ_FILTERS = {
  ALL: '',
  UNREAD: 'false',
  READ: 'true',
};

export const REPLIED_FILTERS = {
  ALL: '',
  NOT_REPLIED: 'false',
  REPLIED: 'true',
};

export const READ_FILTER_OPTIONS = [
  { value: READ_FILTERS.ALL, label: 'Tất cả' },
  { value: READ_FILTERS.UNREAD, label: 'Chưa đọc' },
  { value: READ_FILTERS.READ, label: 'Đã đọc' },
];

export const REPLIED_FILTER_OPTIONS = [
  { value: REPLIED_FILTERS.ALL, label: 'Tất cả' },
  { value: REPLIED_FILTERS.NOT_REPLIED, label: 'Chưa phản hồi' },
  { value: REPLIED_FILTERS.REPLIED, label: 'Đã phản hồi' },
];

const ContactFilterSelector = ({ options, value, onChange, ariaLabel }) => (
  <div className="view-mode-selector" role="tablist" aria-label={ariaLabel}>
    {options.map(({ value: filterValue, label }) => {
      const isActive = value === filterValue;
      return (
        <button
          key={filterValue || 'all'}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`view-mode-option${isActive ? ' is-active' : ''}`}
          onClick={() => onChange(filterValue)}
        >
          <span className="view-mode-option__label">{label}</span>
        </button>
      );
    })}
  </div>
);

export default ContactFilterSelector;
