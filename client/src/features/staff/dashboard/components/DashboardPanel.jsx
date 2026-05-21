import React, { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPanel.scss';

/**
 * Panel dashboard — header + danh sách item
 * @param {number} [collapsibleLimit] — hiển thị tối đa N mục; nút toggle xem đầy đủ
 * @param {'single' | 'two-column'} [listLayout] — bố cục danh sách (nhiệm vụ: 2 cột)
 */
const DashboardPanel = ({
  icon: Icon,
  title,
  subtitle,
  items = [],
  emptyText = 'Không có dữ liệu',
  viewAllTo,
  collapsibleLimit,
  listLayout = 'single',
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  const hasCollapse = collapsibleLimit != null && items.length > collapsibleLimit;
  const visibleItems =
    hasCollapse && !expanded ? items.slice(0, collapsibleLimit) : items;

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
      {viewAllTo && !hasCollapse && (
        <Link to={viewAllTo} className="staff-dashboard-panel__view-all">
          Xem tất cả
        </Link>
      )}
    </section>
  );
};

export default DashboardPanel;
