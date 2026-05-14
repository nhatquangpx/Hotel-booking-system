import React, { useState } from 'react';
import { FaChevronDown, FaInfoCircle } from 'react-icons/fa';
import './OwnerGuideCollapsible.scss';

/**
 * Hướng dẫn owner — mặc định thu gọn, bấm để mở (tránh chiếm quá nhiều không gian).
 */
const OwnerGuideCollapsible = ({ label = 'Hướng dẫn sử dụng', children, className = '' }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`owner-guide-collapsible ${open ? 'owner-guide-collapsible--open' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        className="owner-guide-collapsible__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="owner-guide-collapsible__toggle-icon" aria-hidden>
          <FaInfoCircle />
        </span>
        <span className="owner-guide-collapsible__toggle-label">{label}</span>
        <FaChevronDown className="owner-guide-collapsible__chevron" aria-hidden />
      </button>
      {open && <div className="owner-guide-collapsible__panel">{children}</div>}
    </div>
  );
};

export default OwnerGuideCollapsible;
