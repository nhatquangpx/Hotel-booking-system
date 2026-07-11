import React from 'react';
import OwnerBarChart from './OwnerBarChart';
import ChartPeriodToolbar from './ChartPeriodToolbar';
import './RevenueChart.scss';

const formatTick = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString('vi-VN');
};

const formatExact = (value) =>
  `${Math.round(Number(value) || 0).toLocaleString('vi-VN')} VNĐ`;

/**
 * Biểu đồ cột doanh thu — filter tuần/tháng/năm + điều hướng kỳ.
 */
const RevenueChart = ({
  data = [],
  title = 'Doanh thu',
  period = 'week',
  offset = 0,
  periodLabel = '',
  canGoNext = false,
  loading = false,
  onPeriodChange,
  onOffsetChange,
}) => {
  const series = (data || []).map((d) => ({
    key: d.key || d.day,
    label: d.label || d.day,
    value: d.value,
  }));

  return (
    <div className="revenue-chart owner-chart-card">
      <div className="owner-chart-card__header">
        <h3 className="chart-title">{title}</h3>
        <p className="owner-chart-card__subtitle">
          Tiền thu được theo từng đêm khách ở (chỉ đơn đã thanh toán)
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

      {/* Giữ chỗ cùng chiều cao với filter loại phòng bên biểu đồ phải */}
      <div className="owner-chart-card__filters" aria-hidden="true" />

      <div className="owner-chart-card__body">
        {loading ? (
          <p className="owner-chart-card__loading">Đang tải…</p>
        ) : (
          <OwnerBarChart
            data={series}
            formatTick={formatTick}
            formatExact={formatExact}
            emptyText="Chưa có doanh thu trong kỳ"
          />
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
