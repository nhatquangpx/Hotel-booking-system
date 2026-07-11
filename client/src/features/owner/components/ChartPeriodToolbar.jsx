import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './ChartPeriodToolbar.scss';

export const CHART_PERIOD_OPTIONS = [
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
];

/**
 * Toolbar chọn tuần/tháng/năm + nút lùi/tiến kỳ (một hàng cố định).
 */
const ChartPeriodToolbar = ({
  period,
  onPeriodChange,
  offset,
  onOffsetChange,
  label,
  canGoNext = false,
  disabled = false,
}) => {
  return (
    <div className="chart-period-toolbar">
      <div className="chart-period-toolbar__periods" role="group" aria-label="Chọn kỳ">
        {CHART_PERIOD_OPTIONS.map(({ value, label: optLabel }) => (
          <button
            key={value}
            type="button"
            className={`chart-period-toolbar__period${period === value ? ' is-active' : ''}`}
            disabled={disabled}
            onClick={() => {
              if (period !== value) onPeriodChange(value);
            }}
          >
            {optLabel}
          </button>
        ))}
      </div>

      <div className="chart-period-toolbar__nav">
        <button
          type="button"
          className="chart-period-toolbar__nav-btn"
          aria-label="Kỳ trước"
          disabled={disabled}
          onClick={() => onOffsetChange(offset + 1)}
        >
          <FaChevronLeft aria-hidden />
        </button>
        <span className="chart-period-toolbar__label" title={label}>
          {label || '—'}
        </span>
        <button
          type="button"
          className="chart-period-toolbar__nav-btn"
          aria-label="Kỳ sau"
          disabled={disabled || !canGoNext}
          onClick={() => onOffsetChange(Math.max(0, offset - 1))}
        >
          <FaChevronRight aria-hidden />
        </button>
      </div>
    </div>
  );
};

export default ChartPeriodToolbar;
