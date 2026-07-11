import React, { useMemo, useState, useCallback } from 'react';
import './OwnerBarChart.scss';

const CHART_TOP = 20;
const CHART_LEFT = 55;
const CHART_PAD_RIGHT = 16;
const CHART_PAD_BOTTOM = 36;

/** Số điểm tối đa vẫn hiện đủ nhãn trục X */
const FULL_LABEL_LIMIT = 10;

/**
 * Bước nhảy nhãn trục X để tránh đè chữ.
 * Luôn hiện điểm đầu/cuối.
 */
function getLabelStep(count) {
  if (count <= FULL_LABEL_LIMIT) return 1;
  if (count <= 16) return 2;
  if (count <= 22) return 3;
  if (count <= 31) return 5;
  return Math.ceil(count / 8);
}

function shouldShowAxisLabel(index, count, step) {
  if (step <= 1) return true;
  if (index === 0 || index === count - 1) return true;
  return index % step === 0;
}

/**
 * Biểu đồ cột SVG dùng chung — tooltip hiện số chính xác khi hover.
 */
const OwnerBarChart = ({
  data = [],
  formatTick,
  formatExact,
  fixedMax,
  emptyText = 'Chưa có dữ liệu',
}) => {
  const [tooltip, setTooltip] = useState(null);

  const maxValue = useMemo(() => {
    if (fixedMax != null) return fixedMax;
    const m = Math.max(0, ...data.map((d) => Number(d.value) || 0));
    if (m <= 0) return 1;
    const mag = 10 ** Math.floor(Math.log10(m));
    return Math.ceil(m / mag) * mag;
  }, [data, fixedMax]);

  const yTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => (maxValue * i) / steps);
  }, [maxValue]);

  const layout = useMemo(() => {
    const n = Math.max(data.length, 1);
    const slot = Math.max(18, Math.min(48, n <= 12 ? 36 : n <= 20 ? 26 : 20));
    const chartWidth = Math.max(340, n * slot);
    const svgWidth = CHART_LEFT + chartWidth + CHART_PAD_RIGHT;
    const chartBottom = 210;
    const chartHeight = chartBottom - CHART_TOP;
    const svgHeight = chartBottom + CHART_PAD_BOTTOM;
    const labelStep = getLabelStep(n);
    const rotateLabels = n > FULL_LABEL_LIMIT;

    return {
      n,
      slot,
      chartWidth,
      svgWidth,
      chartBottom,
      chartHeight,
      svgHeight,
      labelStep,
      rotateLabels,
      barWidth: Math.min(slot * 0.62, 32),
    };
  }, [data.length]);

  const yForValue = useCallback(
    (value) =>
      layout.chartBottom -
      (Math.min(value, maxValue) / maxValue) * layout.chartHeight,
    [maxValue, layout]
  );

  if (!data.length) {
    return <p className="owner-bar-chart__empty">{emptyText}</p>;
  }

  const {
    n,
    slot,
    chartWidth,
    svgWidth,
    chartBottom,
    svgHeight,
    labelStep,
    rotateLabels,
    barWidth,
  } = layout;

  return (
    <div className="owner-bar-chart">
      <div className="owner-bar-chart__canvas">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="owner-bar-chart__svg"
          style={{ minWidth: Math.max(420, svgWidth) }}
          preserveAspectRatio="xMidYMid meet"
        >
          {yTicks.map((tick) => (
            <line
              key={`g-${tick}`}
              x1={CHART_LEFT}
              y1={yForValue(tick)}
              x2={CHART_LEFT + chartWidth}
              y2={yForValue(tick)}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          ))}

          {yTicks.map((tick) => (
            <text
              key={`yl-${tick}`}
              x={CHART_LEFT - 8}
              y={yForValue(tick) + 4}
              className="owner-bar-chart__axis"
              textAnchor="end"
            >
              {formatTick(tick)}
            </text>
          ))}

          {data.map((d, index) => {
            const value = Number(d.value) || 0;
            const centerX = CHART_LEFT + slot * index + slot / 2;
            const barTop = yForValue(value);
            const barHeight = Math.max(0, chartBottom - barTop);
            const showLabelOnBar = n <= FULL_LABEL_LIMIT && value > 0;
            const showAxis = shouldShowAxisLabel(index, n, labelStep);

            return (
              <g key={d.key || `${d.label}-${index}`}>
                <rect
                  x={centerX - barWidth / 2}
                  y={value > 0 ? barTop : chartBottom - 1}
                  width={barWidth}
                  height={value > 0 ? barHeight : 1}
                  className="owner-bar-chart__bar"
                  rx="3"
                  onMouseEnter={(e) => {
                    const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!svgRect) return;
                    setTooltip({
                      label: d.key && d.key !== d.label ? `${d.label} (${d.key})` : d.label,
                      exact: formatExact(value),
                      x: (centerX / svgWidth) * svgRect.width,
                      y: (barTop / svgHeight) * svgRect.height - 8,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
                {showLabelOnBar && (
                  <text
                    x={centerX}
                    y={barTop - 4}
                    className="owner-bar-chart__bar-label"
                    textAnchor="middle"
                  >
                    {formatTick(value)}
                  </text>
                )}
                {showAxis && (
                  <text
                    x={centerX}
                    y={chartBottom + (rotateLabels ? 10 : 16)}
                    className={`owner-bar-chart__axis${rotateLabels ? ' owner-bar-chart__axis--tilted' : ''}`}
                    textAnchor={rotateLabels ? 'end' : 'middle'}
                    transform={
                      rotateLabels
                        ? `rotate(-40 ${centerX} ${chartBottom + 10})`
                        : undefined
                    }
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {tooltip && (
          <div
            className="owner-bar-chart__tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
            role="tooltip"
          >
            <strong>{tooltip.label}</strong>
            <span>{tooltip.exact}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBarChart;
