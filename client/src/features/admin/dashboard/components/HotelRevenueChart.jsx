import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/shared/utils';
import './HotelRevenueChart.scss';

const DEFAULT_PAGE_SIZE = 5;

const formatCompact = (value) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
};

/**
 * Xếp hạng doanh thu theo khách sạn — thanh ngang + phân trang.
 * @param {{ hotelId?: string, hotelName: string, revenue: number, bookingCount?: number }[]} data
 */
const HotelRevenueChart = ({
  data = [],
  periodLabel = '',
  loading = false,
  pageSize = DEFAULT_PAGE_SIZE,
  viewAllTo,
  viewAllLabel = 'Mở trang đặt phòng',
}) => {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [data.length, periodLabel, pageSize]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = data.slice((safePage - 1) * pageSize, safePage * pageSize);
  const maxValue = Math.max(...data.map((d) => d.revenue), 1);

  if (loading) {
    return (
      <div className="hotel-revenue-chart hotel-revenue-chart--loading">
        <p>Đang tải dữ liệu…</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="hotel-revenue-chart hotel-revenue-chart--empty">
        <p>Chưa có doanh thu trong kỳ {periodLabel || 'đã chọn'}.</p>
      </div>
    );
  }

  return (
    <div className="hotel-revenue-chart">
      <ul
        className="hotel-revenue-chart__bars"
        aria-label={`Xếp hạng doanh thu theo khách sạn — ${periodLabel}`}
      >
        {pageData.map((item, index) => {
          const rank = (safePage - 1) * pageSize + index + 1;
          const widthPct = Math.max((item.revenue / maxValue) * 100, 2);
          return (
            <li
              key={item.hotelId || `${item.hotelName}-${rank}`}
              className="hotel-revenue-chart__row"
            >
              <span className="hotel-revenue-chart__rank" aria-hidden>
                {rank}
              </span>
              <span className="hotel-revenue-chart__label" title={item.hotelName}>
                {item.hotelName}
              </span>
              <div className="hotel-revenue-chart__track">
                <div
                  className="hotel-revenue-chart__bar"
                  style={{ width: `${widthPct}%` }}
                  title={formatCurrency(item.revenue)}
                />
              </div>
              <span className="hotel-revenue-chart__bookings">
                {item.bookingCount ?? 0} đơn
              </span>
              <span className="hotel-revenue-chart__value" title={formatCurrency(item.revenue)}>
                {formatCompact(item.revenue)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="hotel-revenue-chart__footer">
        {data.length > pageSize && (
          <div className="hotel-revenue-chart__pagination">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Trước
            </button>
            <span>
              Trang {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Sau
            </button>
          </div>
        )}
        {viewAllTo && (
          <Link to={viewAllTo} className="hotel-revenue-chart__view-all">
            {viewAllLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default HotelRevenueChart;
