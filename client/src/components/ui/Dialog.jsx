import React from 'react';
import './Dialog.scss';

/**
 * Dialog Component
 * Reusable dialog/modal component
 */
const Dialog = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '600px',
  className = '' 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className={`dialog-content ${className}`} style={{ maxWidth }}>
        <div className="dialog-header">
          <h2>{title}</h2>
          <button className="dialog-close-button" onClick={onClose} aria-label="Đóng">
            &times;
          </button>
        </div>
        <div className="dialog-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;

