import React from 'react';
import './RoomOccupancyChart.scss';

const CHART_BOTTOM = 220;
const CHART_TOP = 20;
const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP;

const yForPercent = (pct) => CHART_BOTTOM - (pct / 100) * CHART_HEIGHT;

const clampPercent = (value) =>
  Math.min(100, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));

/**
 * RoomOccupancyChart Component
 * Displays room occupancy rate (%) as a bar chart
 * @param {Array} data - Array of { day, value } objects — value is 0–100 (%)
 */
const RoomOccupancyChart = ({ data = [], title = 'Công suất phòng' }) => {
  const chartData = (data.length > 0 ? data : []).map((d) => ({
    day: d.day,
    value: clampPercent(d.value),
  }));

  const formatValue = (value) => `${Math.round(value)}%`;
  const yTicks = [0, 25, 50, 75, 100];

  if (chartData.length === 0) {
    return (
      <div className="room-occupancy-chart">
        <h3 className="chart-title">{title}</h3>
        <p className="room-occupancy-chart__empty">Chưa có dữ liệu công suất</p>
      </div>
    );
  }

  return (
    <div className="room-occupancy-chart">
      <h3 className="chart-title">{title}</h3>
      <p className="room-occupancy-chart__subtitle">
        Phòng có khách / tổng phòng hoạt động · 7 ngày qua
      </p>
      <div className="chart-container">
        <svg viewBox="0 0 450 250" className="chart-svg" preserveAspectRatio="xMidYMid meet">
          {yTicks.map((pct) => (
            <line
              key={pct}
              x1="50"
              y1={yForPercent(pct)}
              x2="400"
              y2={yForPercent(pct)}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          ))}

          {yTicks.map((pct) => (
            <text
              key={`label-${pct}`}
              x="45"
              y={yForPercent(pct) + 4}
              className="axis-label"
              textAnchor="end"
            >
              {formatValue(pct)}
            </text>
          ))}

          {chartData.map((d, index) => {
            const x = 50 + (index / chartData.length) * 350;
            const barTop = yForPercent(d.value);
            const barHeight = CHART_BOTTOM - barTop;
            const width = (350 / chartData.length) * 0.7;
            const centerX = x + (350 / chartData.length) / 2;

            return (
              <g key={`${d.day}-${index}`}>
                {d.value > 0 && (
                  <rect
                    x={centerX - width / 2}
                    y={barTop}
                    width={width}
                    height={barHeight}
                    className="chart-bar"
                    rx="4"
                  />
                )}
                {d.value > 0 && (
                  <text
                    x={centerX}
                    y={barTop - 5}
                    className="data-label"
                    textAnchor="middle"
                  >
                    {formatValue(d.value)}
                  </text>
                )}
              </g>
            );
          })}

          {chartData.map((d, index) => {
            const x = 50 + (index / chartData.length) * 350;
            const centerX = x + (350 / chartData.length) / 2;
            return (
              <text
                key={`axis-${d.day}-${index}`}
                x={centerX}
                y="240"
                className="axis-label"
                textAnchor="middle"
              >
                {d.day}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default RoomOccupancyChart;
