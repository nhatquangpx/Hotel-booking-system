import React from 'react';
import './RevenueChart.scss';

/**
 * RevenueChart Component
 * Displays weekly revenue as a line chart
 * @param {Array} data - Array of { day, value } objects
 */
const RevenueChart = ({ data = [], title = 'Doanh thu tuần này' }) => {
  // Default data if none provided
  const defaultData = [
    { day: 'T2', value: 4500000 },
    { day: 'T3', value: 5200000 },
    { day: 'T4', value: 3800000 },
    { day: 'T5', value: 6100000 },
    { day: 'T6', value: 7200000 },
    { day: 'T7', value: 8500000 },
    { day: 'CN', value: 7800000 },
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(d => d.value), 10000000);
  const minValue = 0;

  const getYPosition = (value) => {
    const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
    return 100 - percentage; // Invert for SVG coordinates
  };

  const points = chartData.map((d, index) => {
    const x = (index / (chartData.length - 1)) * 100;
    const y = getYPosition(d.value);
    return `${x},${y}`;
  }).join(' ');

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('vi-VN');
  };

  return (
    <div className="revenue-chart">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <svg viewBox="0 0 400 200" className="chart-svg">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y * 2}
              x2="400"
              y2={y * 2}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          ))}
          
          {/* Y-axis labels */}
          {[0, 2500000, 5000000, 7500000, 10000000].map((value, index) => {
            const y = 200 - (index * 50);
            return (
              <text
                key={value}
                x="0"
                y={y}
                className="axis-label"
                textAnchor="start"
              >
                {formatValue(value)}
              </text>
            );
          })}

          {/* Line path */}
          <polyline
            points={points}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="3"
            className="chart-line"
          />

          {/* Data points */}
          {chartData.map((d, index) => {
            const x = (index / (chartData.length - 1)) * 400;
            const y = getYPosition(d.value) * 2;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#D4AF37"
                  className="data-point"
                />
                <text
                  x={x}
                  y={y - 10}
                  className="data-label"
                  textAnchor="middle"
                >
                  {formatValue(d.value)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {chartData.map((d, index) => {
            const x = (index / (chartData.length - 1)) * 400;
            return (
              <text
                key={index}
                x={x}
                y="195"
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

export default RevenueChart;

