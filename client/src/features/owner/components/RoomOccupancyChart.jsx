import React from 'react';
import './RoomOccupancyChart.scss';

/**
 * RoomOccupancyChart Component
 * Displays room occupancy as a bar chart
 * @param {Array} data - Array of { day, value } objects
 */
const RoomOccupancyChart = ({ data = [], title = 'Công suất phòng' }) => {
  // Default data if none provided
  const defaultData = [
    { day: 'T2', value: 6000000 },
    { day: 'T3', value: 7000000 },
    { day: 'T4', value: 6500000 },
    { day: 'T5', value: 8000000 },
    { day: 'T6', value: 9000000 },
    { day: 'T7', value: 9500000 },
    { day: 'CN', value: 8500000 },
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(d => d.value), 10000000);
  const minValue = 0;

  const getBarHeight = (value) => {
    const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
    return percentage;
  };

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('vi-VN');
  };

  const barWidth = 100 / chartData.length;

  return (
    <div className="room-occupancy-chart">
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

          {/* Bars */}
          {chartData.map((d, index) => {
            const x = (index / chartData.length) * 400;
            const barHeight = getBarHeight(d.value) * 2;
            const y = 200 - barHeight;
            const width = (400 / chartData.length) * 0.7;
            const centerX = x + (400 / chartData.length) / 2;

            return (
              <g key={index}>
                <rect
                  x={centerX - width / 2}
                  y={y}
                  width={width}
                  height={barHeight}
                  fill="#D4AF37"
                  className="chart-bar"
                  rx="4"
                />
                <text
                  x={centerX}
                  y={y - 5}
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
            const x = (index / chartData.length) * 400;
            const centerX = x + (400 / chartData.length) / 2;
            return (
              <text
                key={index}
                x={centerX}
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

export default RoomOccupancyChart;

