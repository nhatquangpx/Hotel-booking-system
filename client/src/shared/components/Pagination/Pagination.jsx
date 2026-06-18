import './Pagination.scss';

/**
 * Điều hướng phân trang dùng chung.
 * @param {'default' | 'admin' | 'guest' | 'center'} variant
 */
const Pagination = ({
  page,
  totalPages,
  onPageChange,
  className = '',
  variant = 'default',
  total,
  pageSize,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const from = total ? (page - 1) * (pageSize || 0) + 1 : null;
  const to = total ? Math.min(page * (pageSize || 0), total) : null;

  return (
    <nav
      className={['app-pagination', `app-pagination--${variant}`, className].filter(Boolean).join(' ')}
      aria-label="Phân trang"
    >
      {total > 0 && from != null && (
        <span className="app-pagination__summary">
          {from}–{to} / {total}
        </span>
      )}
      <div className="app-pagination__controls">
        <button
          type="button"
          className="app-pagination__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </button>
        <span className="app-pagination__info">
          Trang {page} / {totalPages}
        </span>
        <button
          type="button"
          className="app-pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
