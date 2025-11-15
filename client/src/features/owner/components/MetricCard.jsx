import React from 'react';
import './MetricCard.scss';

/**
 * MetricCard Component
 * Reusable card component for displaying metrics
 * @param {string} title - Title of the metric
 * @param {string|number} value - Value to display
 * @param {ReactNode} icon - Icon component
 * @param {string} iconColor - Color class for icon background
 * @param {string} className - Additional CSS class
 */
const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'default',
  className = '' 
}) => {
  return (
    <div className={`metric-card ${iconColor} ${className}`}>
      <div className="metric-icon">
        {Icon && <Icon />}
      </div>
      <div className="metric-content">
        <div className="metric-value">{value}</div>
        <div className="metric-title">{title}</div>
      </div>
    </div>
  );
};

export default MetricCard;

