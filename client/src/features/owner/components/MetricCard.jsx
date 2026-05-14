import React from 'react';
import { Link } from 'react-router-dom';
import './MetricCard.scss';

/**
 * MetricCard Component
 * Reusable card component for displaying metrics
 * @param {string} title - Title of the metric
 * @param {string|number} value - Value to display
 * @param {ReactNode} icon - Icon component
 * @param {string} iconColor - Color class for icon background
 * @param {string} className - Additional CSS class
 * @param {string} [to] - Nếu có: thẻ là liên kết tới route này
 */
const MetricCard = ({
  title,
  value,
  icon: Icon,
  iconColor = 'default',
  className = '',
  to,
}) => {
  const rootClass = `metric-card ${iconColor} ${className}${to ? ' metric-card--link' : ''}`.trim();
  const inner = (
    <>
      <div className="metric-icon">
        {Icon && <Icon />}
      </div>
      <div className="metric-content">
        <div className="metric-value">{value}</div>
        <div className="metric-title">{title}</div>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={rootClass}>
        {inner}
      </Link>
    );
  }

  return <div className={rootClass}>{inner}</div>;
};

export default MetricCard;

