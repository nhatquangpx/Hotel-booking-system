import React, { useEffect, useRef, useState } from 'react';
import './PriceSuggestionChart.scss';

/**
 * So sánh giá hiện tại (đêm TB) vs giá đề xuất theo từng ngày
 * @param {Array<{ date: string, weekdayLabel: string, avgCurrentNightly: number, suggestedNightly: number }>} daily
 */
const PriceSuggestionChart = ({ daily = [], title = 'Giá hiện tại vs giá đề xuất (đêm)' }) => {
  const chartRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    const el = chartRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setChartWidth(Math.max(320, Math.floor(entry.contentRect.width)));
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  if (!daily.length) {
    return (
      <div className="price-suggestion-chart price-suggestion-chart--empty">
        <h3 className="chart-title">{title}</h3>
        <p className="empty-msg">Chưa có dữ liệu để hiển thị biểu đồ.</p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...daily.flatMap((d) => [d.avgCurrentNightly || 0, d.suggestedNightly || 0]),
    1
  );
  const chartHeight = 280;
  const rightPad = 12;
  const leftPad = 58;
  const bottomPad = 52;
  const svgWidth = chartWidth || 1200;
  const plotWidth = Math.max(svgWidth - leftPad - rightPad, 1);
  const slotWidth = plotWidth / daily.length;
  const barWidth = Math.max(4, Math.min(18, slotWidth * 0.32));
  const gap = Math.max(2, Math.min(8, slotWidth * 0.1));
  const pairWidth = barWidth * 2 + gap;
  const svgHeight = chartHeight + bottomPad;

  const barY = (value) => {
    const h = (value / maxVal) * chartHeight;
    return chartHeight - h;
  };

  const formatShort = (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return String(v);
  };

  return (
    <div className="price-suggestion-chart">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-scroll" ref={chartRef}>
        <svg
          width={svgWidth}
          height={svgHeight}
          className="chart-svg"
          role="img"
          aria-label={title}
        >
          <text x="8" y="16" className="legend legend--current">
            ■ Hiện tại
          </text>
          <text x="100" y="16" className="legend legend--suggested">
            ■ Đề xuất
          </text>

          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = t * chartHeight + 24;
            const val = Math.round(maxVal * (1 - t));
            return (
              <g key={t}>
                <line
                  x1={leftPad}
                  y1={y}
                  x2={svgWidth - rightPad}
                  y2={y}
                  stroke="#e8e8e8"
                  strokeWidth="1"
                />
                <text x="4" y={y + 4} className="axis-label" textAnchor="start">
                  {formatShort(val)}
                </text>
              </g>
            );
          })}

          {daily.map((d, index) => {
            const gx = leftPad + index * slotWidth;
            const centerX = gx + slotWidth / 2;
            const x1 = centerX - pairWidth / 2;
            const x2 = x1 + barWidth + gap;
            const yCur = barY(d.avgCurrentNightly || 0) + 24;
            const ySug = barY(d.suggestedNightly || 0) + 24;
            const hCur = chartHeight + 24 - yCur;
            const hSug = chartHeight + 24 - ySug;
            return (
              <g key={d.date}>
                <rect
                  x={x1}
                  y={yCur}
                  width={barWidth}
                  height={Math.max(hCur, 0)}
                  className="bar bar--current"
                  rx="2"
                />
                <rect
                  x={x2}
                  y={ySug}
                  width={barWidth}
                  height={Math.max(hSug, 0)}
                  className="bar bar--suggested"
                  rx="2"
                />
                <text
                  x={centerX}
                  y={chartHeight + 38}
                  className="x-label"
                  textAnchor="middle"
                >
                  {d.weekdayLabel}
                </text>
                <text
                  x={centerX}
                  y={chartHeight + 52}
                  className="x-sublabel"
                  textAnchor="middle"
                >
                  {d.date.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default PriceSuggestionChart;
