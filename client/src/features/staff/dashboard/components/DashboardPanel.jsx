import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardPanel.scss';

/**
 * Panel dashboard — header + danh sách item (mock / API sau)
 */
const DashboardPanel = ({
  icon: Icon,
  title,
  subtitle,
  items = [],
  emptyText = 'Không có dữ liệu',
  viewAllTo,
}) => {
  return (
    <section className="staff-dashboard-panel">
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
      <ul className="staff-dashboard-panel__list">
        {items.length > 0 ? (
          items.map((item) => {
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
      {viewAllTo && (
        <Link to={viewAllTo} className="staff-dashboard-panel__view-all">
          Xem tất cả
        </Link>
      )}
    </section>
  );
};

export default DashboardPanel;
