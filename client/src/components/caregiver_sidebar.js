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
      case 'requests':
        navigate('/caregiver/care-requests');
        break;
      case 'carelogs':
        navigate('/caregiver/carelog');
        break;
      case 'family-messages':
        navigate('/caregiver/family-member-messages');
        break;
      case 'elder-messages':
        navigate('/caregiver/elder-messages');
        break;
      case 'profile':
        navigate('/caregiver/profile');
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
      key: 'elder',
      label: 'Elders',
      icon: '👴',
      path: '/caregiver/elders'
    },
    {
      key: 'requests',
      label: 'Care Requests',
      icon: '📥',
      path: '/caregiver/care-requests'
    },
    {
      key: 'carelogs',
      label: 'Carelogs',
      icon: '📝',
      path: '/caregiver/carelog'
    },
    {
      key: 'family-messages',
      label: 'Family Messages',
      icon: '👨‍👩‍👧‍👦',
      path: '/caregiver/family-member-messages'
    },
    {
      key: 'elder-messages',
      label: 'Elder Messages',
      icon: '👴👵',
      path: '/caregiver/elder-messages'
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/caregiver/profile'
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
