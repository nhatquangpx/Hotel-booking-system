import React, { useState, useId, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPanel.scss';

/**
 * Panel dashboard — header + danh sách item
 * @param {number} [collapsibleLimit] — hiển thị tối đa N mục; nút toggle xem đầy đủ
 * @param {number} [pageSize] — phân trang client-side (ưu tiên hơn collapsibleLimit)
 * @param {'single' | 'two-column'} [listLayout] — bố cục danh sách (nhiệm vụ: 2 cột)
 */
const DashboardPanel = ({
  icon: Icon,
  title,
  subtitle,
  items = [],
  emptyText = 'Không có dữ liệu',
  viewAllTo,
  viewAllLabel = 'Xem trang đầy đủ',
  collapsibleLimit,
  pageSize,
  listLayout = 'single',
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const listId = useId();

  const usesPagination = pageSize != null && pageSize > 0;
  const totalPages = usesPagination ? Math.max(1, Math.ceil(items.length / pageSize)) : 1;

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const hasCollapse =
    !usesPagination && collapsibleLimit != null && items.length > collapsibleLimit;

  const visibleItems = usesPagination
    ? items.slice((page - 1) * pageSize, page * pageSize)
    : hasCollapse && !expanded
      ? items.slice(0, collapsibleLimit)
      : items;

  const showPagination = usesPagination && items.length > pageSize;
  const showViewAllLink = Boolean(viewAllTo) && !hasCollapse;

  const panelClass = [
    'staff-dashboard-panel',
    listLayout === 'two-column' ? 'staff-dashboard-panel--two-col' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={panelClass}>
      <header className="staff-dashboard-panel__header">
        <div className="staff-dashboard-panel__title-row">
          {Icon && (
            <span className="staff-dashboard-panel__icon" aria-hidden>
              <Icon />
            </span>
          )}
          <h3 className="staff-dashboard-panel__title">{title}</h3>
        </div>
        {subtitle && (
          <span className="staff-dashboard-panel__subtitle">{subtitle}</span>
        )}
      </header>
      <ul className="staff-dashboard-panel__list" id={hasCollapse ? listId : undefined}>
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => {
            const rowClass = `staff-dashboard-panel__item${
              item.linkTo ? ' staff-dashboard-panel__item--link' : ''
            }`;
            const inner = (
              <>
                {item.leading}
                <div className="staff-dashboard-panel__item-body">
                  <span className="staff-dashboard-panel__item-main">{item.main}</span>
                  {item.meta && (
                    <span className="staff-dashboard-panel__item-meta">{item.meta}</span>
                  )}
                </div>
                {item.trailing}
              </>
            );
            if (item.linkTo) {
              return (
                <li key={item.id}>
                  <Link to={item.linkTo} className={rowClass}>
                    {inner}
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.id}>
                <div className={rowClass}>{inner}</div>
              </li>
            );
          })
        ) : (
          <li className="staff-dashboard-panel__empty">{emptyText}</li>
        )}
      </ul>
      {hasCollapse && (
        <button
          type="button"
          className="staff-dashboard-panel__toggle"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Thu gọn' : `Xem tất cả (${items.length})`}
        </button>
      )}
      {showPagination && (
        <div className="staff-dashboard-panel__pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Trước
          </button>
          <span>
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Sau
          </button>
        </div>
      )}
      {showViewAllLink && (
        <Link to={viewAllTo} className="staff-dashboard-panel__view-all">
          {viewAllLabel}
        </Link>
      )}
    </section>
  );
};

export default DashboardPanel;
