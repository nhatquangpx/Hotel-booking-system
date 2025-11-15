import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IMAGE_PATHS } from '@/constants/images';
import './Sidebar.scss';

/**
 * Sidebar Component
 * Reusable sidebar navigation component
 * @param {boolean} isCollapsed - Whether sidebar is collapsed
 * @param {Array} menuItems - Array of menu items { path, label, icon: Component, title }
 * @param {string} logoLink - Link for logo (default: "/")
 * @param {string} className - Additional CSS class
 */
const Sidebar = ({ 
  isCollapsed = false,
  menuItems = [],
  logoLink = "/",
  className = ''
}) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${className}`}>
      <div className="sidebar-header">
        <Link to={logoLink} className="logo-link">
          <img 
            src={IMAGE_PATHS.LOGO_VERTICAL} 
            alt="Logo" 
            className="sidebar-logo"
          />
        </Link>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <li key={index}>
                <Link 
                  to={item.path} 
                  className={isActive(item.path) ? 'active' : ''}
                  title={item.title || item.label}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {IconComponent && <IconComponent className="menu-icon" />}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

