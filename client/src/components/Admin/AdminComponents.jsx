import React from 'react';
import './AdminComponents.scss';

// Loading Spinner Component
export const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
  </div>
);

// Error Message Component
export const ErrorMessage = ({ message }) => (
  <div className="error-message">
    <i className="fas fa-exclamation-circle"></i>
    <span>{message}</span>
  </div>
);

// Success Message Component
export const SuccessMessage = ({ message }) => (
  <div className="success-message">
    <i className="fas fa-check-circle"></i>
    <span>{message}</span>
  </div>
);

// Status Badge Component
export const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'active';
      case 'inactive':
      case 'rejected':
        return 'inactive';
      case 'pending':
        return 'pending';
      default:
        return '';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {status}
    </span>
  );
};

// Search Bar Component
export const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="search-bar">
    <input
      type="text"
      className="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// Filter Select Component
export const FilterSelect = ({ value, onChange, options, placeholder = 'Filter by...' }) => (
  <select
    className="filter-select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

// Pagination Component
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={currentPage === page ? 'active' : ''}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

// Modal Component
export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Form Input Component
export const FormInput = ({ label, type = 'text', value, onChange, error, ...props }) => (
  <div className="form-group">
    <label>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
    {error && <div className="error-text">{error}</div>}
  </div>
);

// Form Select Component
export const FormSelect = ({ label, value, onChange, options, error, ...props }) => (
  <div className="form-group">
    <label>{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    >
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <div className="error-text">{error}</div>}
  </div>
);

// Form Textarea Component
export const FormTextarea = ({ label, value, onChange, error, ...props }) => (
  <div className="form-group">
    <label>{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
    {error && <div className="error-text">{error}</div>}
  </div>
);

// Action Buttons Component
export const ActionButtons = ({ onEdit, onDelete, onView }) => (
  <div className="action-buttons">
    {onView && (
      <button className="view" onClick={onView}>
        <i className="fas fa-eye"></i>
      </button>
    )}
    {onEdit && (
      <button className="edit" onClick={onEdit}>
        <i className="fas fa-edit"></i>
      </button>
    )}
    {onDelete && (
      <button className="delete" onClick={onDelete}>
        <i className="fas fa-trash"></i>
      </button>
    )}
  </div>
);

// Page Header Component
export const PageHeader = ({ title, actionButton }) => (
  <div className="page-header">
    <div className="header-title">
      <h2>{title}</h2>
    </div>
    {actionButton && (
      <div className="header-actions">
        {actionButton}
      </div>
    )}
  </div>
); 