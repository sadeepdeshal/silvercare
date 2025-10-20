import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './css/doctor_sidebar.module.css';

const HealthProfessionalSidebar = ({ onToggleCollapse }) => {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard'); // Default to 'dashboard'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // To track current path

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    if (onToggleCollapse) onToggleCollapse(!sidebarCollapsed);
  };

  const handleMenuItemClick = (item) => {
    setActiveMenuItem(item.key); // Update active item when clicked
    navigate(item.path); // Navigate to the corresponding path
  };

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/healthprofessional/dashboard' },
    { key: 'profile', label: 'Profile', icon: '🧑', path: '/healthprofessional/profile' },
    { key: 'elders', label: 'Patients', icon: '👴', path: '/healthprofessional/elders' },
    { key: 'sessions', label: 'Appointments', icon: '🗓️', path: '/healthprofessional/sessions' },
    { key: 'messages', label: 'Messages', icon: '✉️', path: '/healthprofessional/messages' },
  ];

  // Sync activeMenuItem with current URL
  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = sidebarItems.find(item => item.path === currentPath);
    if (activeItem) setActiveMenuItem(activeItem.key);
  }, [location.pathname, sidebarItems]);

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
                {!sidebarCollapsed && <span className={styles.menuLabel}>{item.label}</span>}
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default HealthProfessionalSidebar;