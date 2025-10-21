import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './css/doctor_sidebar.module.css';

const HealthProfessionalSidebar = ({ onToggleCollapse }) => {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    if (onToggleCollapse) onToggleCollapse(!sidebarCollapsed);
  };

  const handleMenuItemClick = (item) => {
    if (item.subItems) {
      // Toggle submenu
      setExpandedMenus(prev => ({
        ...prev,
        [item.key]: !prev[item.key]
      }));
    } else {
      setActiveMenuItem(item.key);
      navigate(item.path);
    }
  };

  const handleSubMenuItemClick = (parentKey, subItem) => {
    setActiveMenuItem(subItem.key);
    navigate(subItem.path);
  };

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/healthprofessional/dashboard' },
    { key: 'profile', label: 'Profile', icon: '🧑‍⚕️', path: '/healthprofessional/profile' },
    { key: 'elders', label: 'Patients', icon: '👴', path: '/healthprofessional/elders' },
    { key: 'sessions', label: 'Sessions', icon: '🗓️', path: '/healthprofessional/sessions' },
    { key: 'reports', label: 'Reports', icon: '📊', path: '/healthprofessional/reports' },
    { 
      key: 'messages', 
      label: 'Messages', 
      icon: '✉️',
      subItems: [
        { key: 'elder-chat', label: 'Elder Chat', icon: '👴', path: '/healthprofessional/messages' },
        { key: 'family-chat', label: 'Family Chat', icon: '👨‍👩‍👧‍👦', path: '/healthprofessional/family-messages' },
      ]
    },
  ];

  return (
    <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          {!sidebarCollapsed && <span className={styles.logoText}>SilverCare</span>}
        </div>
        <button
          className={styles.toggleButton}
          onClick={handleToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '▶' : '◀'}
        </button>
      </div>
      {!sidebarCollapsed && (
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>🧑‍⚕️</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>Health Professional</span>
            <span className={styles.userRole}>Mental Health</span>
          </div>
        </div>
      )}
      <nav className={styles.navigation}>
        <ul className={styles.menuList}>
          {sidebarItems.map((item) => (
            <li key={item.key} className={styles.menuItem}>
              <div
                className={`${styles.menuLink} ${activeMenuItem === item.key ? styles.active : ''}`}
                onClick={() => handleMenuItemClick(item)}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className={styles.menuLabel}>{item.label}</span>
                    {item.subItems && (
                      <span className={styles.submenuArrow}>
                        {expandedMenus[item.key] ? '▼' : '▶'}
                      </span>
                    )}
                  </>
                )}
              </div>
              
              {/* Submenu */}
              {item.subItems && expandedMenus[item.key] && !sidebarCollapsed && (
                <ul className={styles.submenu}>
                  {item.subItems.map((subItem) => (
                    <li key={subItem.key} className={styles.submenuItem}>
                      <div
                        className={`${styles.submenuLink} ${activeMenuItem === subItem.key ? styles.active : ''}`}
                        onClick={() => handleSubMenuItemClick(item.key, subItem)}
                        title={subItem.label}
                      >
                        <span className={styles.menuIcon}>{subItem.icon}</span>
                        <span className={styles.submenuLabel}>{subItem.label}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default HealthProfessionalSidebar; 