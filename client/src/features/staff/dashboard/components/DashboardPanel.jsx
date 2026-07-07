import React, { useState, useId, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFillListPageSize } from '@/shared/hooks/useFillListPageSize';
import './DashboardPanel.scss';

function renderItemRow(item) {
  const rowClass = `staff-dashboard-panel__item${
    item.linkTo ? ' staff-dashboard-panel__item--link' : ''
  }`;
  const inner = (
    <>
      {item.leading}
      <div className="staff-dashboard-panel__item-body">
        <span className="staff-dashboard-panel__item-main">{item.main}</span>
        {item.meta && <span className="staff-dashboard-panel__item-meta">{item.meta}</span>}
      </div>
      {item.trailing}
    </>
  );

  if (item.linkTo) {
    return (
      <Link to={item.linkTo} className={rowClass}>
        {inner}
      </Link>
    );
  }
  return <div className={rowClass}>{inner}</div>;
}

/**
 * Panel dashboard — header + danh sách item
 * @param {number} [collapsibleLimit] — hiển thị tối đa N mục; nút toggle xem đầy đủ
 * @param {number} [pageSize] — phân trang client-side cố định
 * @param {boolean} [fillList] — tự tính pageSize theo chiều cao vùng list (3 panel staff)
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
  pageSize: fixedPageSize,
  fillList = false,
  listLayout = 'single',
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const listId = useId();

  const { wrapRef, probeRef, pageSize: fillPageSize } = useFillListPageSize(items, fillList);
  const pageSize = fillList ? fillPageSize : fixedPageSize;

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
  const probeItem = items[0];

  const panelClass = [
    'staff-dashboard-panel',
    listLayout === 'two-column' ? 'staff-dashboard-panel--two-col' : '',
    fillList ? 'staff-dashboard-panel--fill' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const listContent = (
    <ul className="staff-dashboard-panel__list" id={hasCollapse ? listId : undefined}>
      {visibleItems.length > 0 ? (
        visibleItems.map((item) => <li key={item.id}>{renderItemRow(item)}</li>)
      ) : (
        <li className="staff-dashboard-panel__empty">{emptyText}</li>
      )}
    </ul>
  );

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
        {subtitle && <span className="staff-dashboard-panel__subtitle">{subtitle}</span>}
      </header>

      {fillList ? (
        <div className="staff-dashboard-panel__list-wrap" ref={wrapRef}>
          {probeItem && (
            <div ref={probeRef} className="staff-dashboard-panel__item-probe" aria-hidden>
              {renderItemRow(probeItem)}
            </div>
          )}
          {listContent}
        </div>
      ) : (
        listContent
      )}

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

      {(showPagination || showViewAllLink) && fillList && (
        <div className="staff-dashboard-panel__footer staff-dashboard-panel__footer--fill">
          {showViewAllLink ? (
            <Link to={viewAllTo} className="staff-dashboard-panel__view-all">
              {viewAllLabel}
            </Link>
          ) : (
            <span />
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
        </div>
      )}
      {!fillList && showPagination && (
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
      {!fillList && showViewAllLink && (
        <Link to={viewAllTo} className="staff-dashboard-panel__view-all">
          {viewAllLabel}
        </Link>
      )}
    </section>
  );
};

export default DashboardPanel;
