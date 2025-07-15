import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './../components/css/familymember_sidebar.module.css';

const CaregiverSidebar = ({ onItemClick }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard'); // Internal state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Internal state
  const { currentUser } = useAuth(); // Get current user from AuthContext
  const navigate = useNavigate();

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Internal sidebar toggle handler
  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // New sidebar navigation handlers
  const handleMenuItemClick = (item) => {
    // Set active menu item
    setActiveMenuItem(item.key);
    
    // Handle navigation based on menu item - Updated to match App.js routes
    switch (item.key) {
      case 'dashboard':
        navigate('/caregiver/dashboard');
        break;
      case 'elder':
        navigate('/caregiver/elders');
        break;
      case 'family-member':
        navigate('/caregiver/family-member');
        break;
      case 'schedules':
        navigate('/caregiver/schedules');
        break;
      case 'medications':
        navigate('/caregiver/medications');
        break;
      case 'messages':
        navigate('/caregiver/messages');
        break;
      case 'profile':
        navigate('/caregiver/profile');
        break;
      case 'settings':
        navigate('/caregiver/settings');
        break;
      default:
        console.log('Navigation not implemented for:', item.key);
    }
    
    // Call the parent's onItemClick if provided
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const sidebarItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      path: '/caregiver/dashboard'
    },
    {
      key: 'elderly-management',
      label: 'Elders',
      icon: '👴',
      path: '/caregiver/elders'
    },
    {
      key: 'family-member',
      label: 'Family Member',
      icon: '🧑‍🤝‍🧑',
      path: '/caregiver/family-member'
    },
    {
      key: 'schedules',
      label: 'Schedules',
      icon: '📋',
      path: '/caregiver/schedules'
    },
    {
      key: 'medications',
      label: 'Medications',
      icon: '💊',
      path: '/caregiver/medications'
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: '💬',
      path: '/caregiver/messages'
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/caregiver/profile'
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/caregiver/settings'
    }
  ];

  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      toggleSubmenu(item.key);
    } else {
      // Use the internal navigation handler
      handleMenuItemClick(item);
    }
  };

  return (
    <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Sidebar Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          
          {!sidebarCollapsed && <span className={styles.logoText}></span>}
        </div>
        <button 
          className={styles.toggleButton}
          onClick={handleToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* User Info */}
      {!sidebarCollapsed && (
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>👨‍👩‍👧‍👦</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>
              Hi {currentUser?.name || 'User'}!
            </span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className={styles.navigation}>
        <ul className={styles.menuList}>
          {sidebarItems.map((item) => (
            <li key={item.key} className={styles.menuItem}>
              <div
                className={`${styles.menuLink} ${
                  activeMenuItem === item.key ? styles.active : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className={styles.menuLabel}>{item.label}</span>
                    {item.badge && (
                      <span className={styles.badge}>{item.badge}</span>
                    )}
                    {item.hasSubmenu && (
                      <span className={`${styles.submenuArrow} ${
                        expandedMenus[item.key] ? styles.expanded : ''
                      }`}>
                        ▼
                      </span>
                    )}
                  </>
                )}
              </div>
              
            </li>
          ))}
        </ul>
      </nav>

      
    </div>
  );
};

export default CaregiverSidebar;
