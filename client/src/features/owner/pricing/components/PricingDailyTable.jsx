import React from 'react';
import { formatCurrency } from '@/shared/utils';

/**
 * Bảng chi tiết giá động theo từng ngày trong kỳ.
 */
const PricingDailyTable = ({
  typeLabel,
  daily,
  onApplyDay,
  applyingDate,
  applyDisabled,
}) => {
  if (!daily?.length) return null;

  return (
    <div className="table-wrap pricing-table-section">
      <div className="pricing-table-section__head">
        <div>
          <h2 className="table-title">Chi tiết theo ngày</h2>
          <p className="pricing-table-section__sub">
            Loại <strong>{typeLabel}</strong> · {daily.length} ngày trong kỳ · nhấn{' '}
            <strong>Áp dụng</strong> trên từng dòng để gán giá đề xuất của ngày đó cho mọi phòng cùng loại
          </p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="detail-table">
          <colgroup>
            <col className="detail-table__col detail-table__col--date" />
            <col className="detail-table__col detail-table__col--occ" />
            <col className="detail-table__col detail-table__col--book" />
            <col className="detail-table__col detail-table__col--price" />
            <col className="detail-table__col detail-table__col--suggested" />
            <col className="detail-table__col detail-table__col--delta" />
            <col className="detail-table__col detail-table__col--factors" />
            <col className="detail-table__col detail-table__col--explain" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Ngày</th>
              <th scope="col">Lấp đầy</th>
              <th scope="col">Đã đặt / Tổng</th>
              <th scope="col">Giá TB hiện tại</th>
              <th scope="col">Giá đề xuất</th>
              <th scope="col">Chênh lệch cả kỳ</th>
              <th scope="col">Hệ số</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((row) => {
              const occPct = Math.round((row.occupancyRate || 0) * 100);
              const occBand =
                occPct <= 25 ? 'occ-pill--low' : occPct <= 75 ? 'occ-pill--mid' : 'occ-pill--high';
              const isApplying = applyingDate === row.date;
              const periodDelta =
                row.estimatedPeriodDeltaIfApply ??
                row.estimatedDailyDeltaRevenue ??
                row.estimatedDeltaRevenue ??
                0;
              const deltaClass =
                periodDelta > 0 ? 'cell-delta--up' : periodDelta < 0 ? 'cell-delta--down' : 'cell-delta--flat';
              const formatDelta = (value) => {
                if (value === 0) return '0';
                return `${value > 0 ? '+' : ''}${formatCurrency(value)}`;
              };
              return (
                <tr key={row.date}>
                  <td className="cell-date">
                    <span className="date-badge">{row.weekdayLabel}</span>
                    <span className="date-iso">{row.date}</span>
                  </td>
                  <td className="cell-occ">
                    <span className={`occ-pill ${occBand}`}>{occPct}%</span>
                  </td>
                  <td className="cell-booking">
                    <span className="booking-num">{row.occupiedRooms}</span>
                    <span className="booking-sep">/</span>
                    <span className="booking-total">{row.totalRooms}</span>
                  </td>
                  <td className="cell-price cell-price--muted">{formatCurrency(row.avgCurrentNightly)}</td>
                  <td className="cell-price cell-price--suggested">
                    <span className="cell-price__box cell-price__box--suggested">
                      {formatCurrency(row.suggestedNightly)}
                    </span>
                  </td>
                  <td className={`cell-delta ${deltaClass}`}>
                    <span className="cell-delta__total">{formatDelta(periodDelta)}</span>
                  </td>
                  <td className="cell-factors">
                    <div className="factors-inner" role="group" aria-label="Hệ số occ / mùa / thứ">
                      <span className="factor-chip factor-chip--occ" title="Hệ số lấp đầy">
                        {row.factors.occupancy}
                      </span>
                      <span className="factor-chip factor-chip--sea" title="Hệ số mùa / lễ">
                        {row.factors.season}
                      </span>
                      <span className="factor-chip factor-chip--wd" title="Hệ số thứ trong tuần">
                        {row.factors.historicalWeekday}
                      </span>
                    </div>
                  </td>
                  <td className="factor-detail-cell">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="row-action-btn row-action-btn--apply"
                        disabled={applyDisabled || isApplying}
                        onClick={() => onApplyDay?.(row)}
                        title={`Áp dụng ${formatCurrency(row.suggestedNightly)} cho mọi phòng ${typeLabel}`}
                      >
                        {isApplying ? 'Đang áp...' : 'Áp dụng'}
                      </button>
                      {row.factorBreakdown ? (
                        <div className="factor-detail-wrap">
                          <details className="factor-details">
                            <summary className="row-action-btn row-action-btn--detail">
                              <span className="factor-details__label factor-details__label--open">Ẩn bớt</span>
                              <span className="factor-details__label factor-details__label--closed">
                                Xem chi tiết
                              </span>
                            </summary>
                            <div className="factor-detail-lines">
                              <p>
                                <strong>Lấp đầy:</strong> {row.factorBreakdown.occupancy.detail}
                              </p>
                              <p>
                                <strong>Mùa / lễ:</strong> {row.factorBreakdown.season.detail}
                              </p>
                              <p>
                                <strong>Thứ trong tuần:</strong> {row.factorBreakdown.historicalWeekday.detail}
                              </p>
                              <p className="factor-formula">{row.factorBreakdown.formula}</p>
                            </div>
                          </details>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PricingDailyTable;
