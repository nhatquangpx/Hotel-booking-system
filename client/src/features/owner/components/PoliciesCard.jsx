import React from 'react';
import './PoliciesCard.scss';

/**
 * PoliciesCard Component
 * Displays hotel policies and regulations
 * @param {string|Array} policies - Policies text or array of policy strings
 */
const PoliciesCard = ({ policies }) => {
  const policiesText = Array.isArray(policies) 
    ? policies.join('. ') 
    : policies || 'Vui lòng xuất trình CCCD/CMND khi check-in. Không hút thuốc trong phòng. Không mang thú cưng. Thanh toán khi check-out.';

  return (
    <div className="policies-card">
      <h3 className="policies-title">Chính sách & Quy định</h3>
      <p className="policies-text">{policiesText}</p>
    </div>
  );
};

export default PoliciesCard;

