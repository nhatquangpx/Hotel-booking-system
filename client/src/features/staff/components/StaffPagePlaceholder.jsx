import React from 'react';
import './StaffPagePlaceholder.scss';

/**
 * Khung trang tạm — nội dung chi tiết sẽ bổ sung sau
 */
const StaffPagePlaceholder = ({ title, description }) => (
  <div className="staff-page-placeholder">
    <h2 className="staff-page-placeholder__title">{title}</h2>
    {description && (
      <p className="staff-page-placeholder__desc">{description}</p>
    )}
    <div className="staff-page-placeholder__box">
      <span>Nội dung đang được phát triển</span>
    </div>
  </div>
);

export default StaffPagePlaceholder;
