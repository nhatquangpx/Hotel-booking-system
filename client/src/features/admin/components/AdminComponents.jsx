/**
 * AdminComponents
 * Admin-specific components for admin pages
 * Note: Reusable components (LoadingSpinner, ErrorMessage, etc.) are in @/components
 * This file contains admin-specific components like SearchBar, Pagination, Modal, etc.
 */
import { 
  LoadingSpinner, 
  ErrorMessage, 
  SuccessMessage, 
  StatusBadge 
} from '@/components';
import './AdminComponents.scss';

// Re-export shared components for backward compatibility
export { LoadingSpinner, ErrorMessage, SuccessMessage, StatusBadge };

// Search Bar Component (Admin-specific styling)
export const SearchBar = ({ value, onChange, placeholder = 'Tìm kiếm...' }) => (
  <div className="search-bar">
    <input
      type="text"
      className="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
    <i className="fas fa-search"></i>
  </div>
);

// Filter Select Component (Admin-specific styling)
export const FilterSelect = ({ value, onChange, options, placeholder = 'Lọc theo...' }) => (
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

// Pagination Component (Admin-specific styling)
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisiblePages = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      {pages.slice(startPage - 1, endPage).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={currentPage === page ? 'active' : ''}
          aria-label={`Trang ${page}`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

// Modal Component (Admin-specific styling)
export const Modal = ({ isOpen, onClose, title, children, footer, size = 'medium' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="admin-modal" onClick={handleBackdropClick}>
      <div className={`modal-content modal-content--${size}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose} aria-label="Đóng">
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

// Form Input Component (Admin-specific styling)
export const FormInput = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  required = false,
  ...props 
}) => (
  <div className="form-group">
    {label && (
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={error ? 'error' : ''}
      {...props}
    />
    {error && <div className="error-text">{error}</div>}
  </div>
);

// Form Select Component (Admin-specific styling)
export const FormSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  error, 
  required = false,
  ...props 
}) => (
  <div className="form-group">
    {label && (
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={error ? 'error' : ''}
      {...props}
    >
      <option value="">Chọn...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <div className="error-text">{error}</div>}
  </div>
);

// Form Textarea Component (Admin-specific styling)
export const FormTextarea = ({ 
  label, 
  value, 
  onChange, 
  error, 
  required = false,
  rows = 4,
  ...props 
}) => (
  <div className="form-group">
    {label && (
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={error ? 'error' : ''}
      rows={rows}
      {...props}
    />
    {error && <div className="error-text">{error}</div>}
  </div>
);

// Action Buttons Component
export const ActionButtons = ({ onEdit, onDelete, onView, onApprove, onReject }) => (
  <div className="action-buttons">
    {onView && (
      <button className="view" onClick={onView} aria-label="Xem chi tiết">
        <i className="fas fa-eye"></i>
      </button>
    )}
    {onEdit && (
      <button className="edit" onClick={onEdit} aria-label="Chỉnh sửa">
        <i className="fas fa-edit"></i>
      </button>
    )}
    {onApprove && (
      <button className="approve" onClick={onApprove} aria-label="Phê duyệt">
        <i className="fas fa-check"></i>
      </button>
    )}
    {onReject && (
      <button className="reject" onClick={onReject} aria-label="Từ chối">
        <i className="fas fa-times"></i>
      </button>
    )}
    {onDelete && (
      <button className="delete" onClick={onDelete} aria-label="Xóa">
        <i className="fas fa-trash"></i>
      </button>
    )}
  </div>
);

// Page Header Component
export const PageHeader = ({ title, subtitle, actionButton }) => (
  <div className="page-header">
    <div className="header-title">
      <h2>{title}</h2>
      {subtitle && <p className="header-subtitle">{subtitle}</p>}
    </div>
    {actionButton && (
      <div className="header-actions">
        {actionButton}
      </div>
    )}
  </div>
);

