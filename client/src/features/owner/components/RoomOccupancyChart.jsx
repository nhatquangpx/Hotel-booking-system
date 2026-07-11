import React from 'react';
import OwnerBarChart from './OwnerBarChart';
import ChartPeriodToolbar from './ChartPeriodToolbar';
import { ROOM_TYPE_OPTIONS } from '@/constants/roomTypes';
import './RoomOccupancyChart.scss';

const formatTick = (value) => `${Math.round(Number(value) || 0)}%`;
const formatExact = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')}%`;

/**
 * Biểu đồ cột tỷ lệ phòng có khách — filter kỳ + loại phòng.
 */
const RoomOccupancyChart = ({
  data = [],
  title = 'Tỷ lệ phòng có khách',
  period = 'week',
  offset = 0,
  periodLabel = '',
  canGoNext = false,
  roomType = '',
  roomTypeLabel = 'Tất cả loại phòng',
  loading = false,
  onPeriodChange,
  onOffsetChange,
  onRoomTypeChange,
}) => {
  const series = (data || []).map((d) => ({
    key: d.key || d.day,
    label: d.label || d.day,
    value: Math.min(100, Math.max(0, Number(d.value) || 0)),
  }));

  return (
    <div className="room-occupancy-chart owner-chart-card">
      <div className="owner-chart-card__header">
        <h3 className="chart-title">{title}</h3>
        <p className="owner-chart-card__subtitle">
          Tỷ lệ phòng có khách (%): số đêm đã bán ÷ số phòng · {roomTypeLabel}
        </p>
      </div>

      <div className="owner-chart-card__toolbar">
        <ChartPeriodToolbar
          period={period}
          offset={offset}
          label={periodLabel}
          canGoNext={canGoNext}
          disabled={loading}
          onPeriodChange={onPeriodChange}
          onOffsetChange={onOffsetChange}
        />
      </div>

      <div className="owner-chart-card__filters">
        <label className="room-occupancy-chart__type">
          <span>Loại phòng</span>
          <select
            value={roomType}
            disabled={loading}
            onChange={(e) => onRoomTypeChange?.(e.target.value)}
          >
            <option value="">Tất cả loại phòng</option>
            {ROOM_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="owner-chart-card__body">
        {loading ? (
          <p className="owner-chart-card__loading">Đang tải…</p>
        ) : (
          <OwnerBarChart
            data={series}
            formatTick={formatTick}
            formatExact={formatExact}
            fixedMax={100}
            emptyText="Chưa có dữ liệu tỷ lệ phòng có khách trong kỳ"
          />
        )}
      </div>
    </div>
  );
};

export default RoomOccupancyChart;
