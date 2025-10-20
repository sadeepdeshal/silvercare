import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './../components/css/elder_sidebar.module.css';

const ElderSidebar = ({ onItemClick }) => {
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
        navigate('/elder/dashboard');
        break;
      case 'my-profile':
        navigate('/elder/profile');
        break;
      case 'health-records':
        navigate('/elder/health-records');
        break;
      case 'sessions':
        navigate('/elder/sessions');
        break;
      case 'appointments':
        navigate('/elder/appointments');
        break;
      case 'upcoming-appointments':
        navigate('/elder/appointments');
        break;
      case 'appointment-history':
        navigate('/elder/appointment-history');
        break;
      case 'reschedule-appointment':
        navigate('/elder/reschedule-appointment');
        break;
      case 'prescriptions':
        navigate('/elder/prescriptions');
        break;
      case 'lab-reports':
        navigate('/elder/lab-reports');
        break;
      case 'treatment-plans':
        navigate('/elder/treatment-plans');
        break;
      case 'messages':
        navigate('/elder/messages');
        break;
      case 'doctor-chat':
        navigate('/elder/doctor-chat');
        break;
      case 'family-chat':
        navigate('/elder/family-chat');
        break;
      case 'caregiver-chat':
        navigate('/elder/caregiver-messages');
        break;
      case 'counselor-chat':
        navigate('/elder/counselor-chat');
        break;
      case 'caregivers':
        navigate('/elder/caregivers');
        break;
      case 'my-caregivers':
        navigate('/elder/caregivers');
        break;
      case 'care-schedule':
        navigate('/elder/care-schedule');
        break;
      case 'care-feedback':
        navigate('/elder/care-feedback');
        break;
      case 'wellness-tracking':
        navigate('/elder/wellness-tracking');
        break;
      case 'daily-activities':
        navigate('/elder/daily-activities');
        break;
      case 'mood-tracker':
        navigate('/elder/mood-tracker');
        break;
      case 'emergency-contacts':
        navigate('/elder/emergency-contacts');
        break;
      case 'sos-alert':
        navigate('/elder/sos-alert');
        break;
      case 'health-alerts':
        navigate('/elder/health-alerts');
        break;
      case 'profile-settings':
        navigate('/elder/profile-settings');
        break;
      case 'privacy-settings':
        navigate('/elder/privacy-settings');
        break;
      case 'notification-settings':
        navigate('/elder/notification-settings');
        break;
      case 'accessibility-settings':
        navigate('/elder/accessibility-settings');
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
      path: '/elder/dashboard'
    },
    {
      key: 'appointments',
      label: 'Appointments',
      icon: '📅',
      path: '/elder/appointments'
    },
    {
      key: 'sessions',
      label: 'Sessions',
      icon: '📚',
      path: '/elder/sessions'
    },
    {
      key: 'caregivers',
      label: 'My Care',
      icon: '🤝',
      path: '/elder/caregivers'
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: '💬',
      hasSubmenu: true,
      submenu: [
        { key: 'family-chat', label: 'Family Chat', path: '/elder/family-chat' },
        { key: 'doctor-chat', label: 'Doctor Chat', path: '/elder/doctor-chat' },
        { key: 'counselor-chat', label: 'Counselor Chat', path: '/elder/counselor-chat' },
        { key: 'caregiver-chat', label: 'Caregiver Chat', path: '/elder/caregiver-messages' }
      ]
    },
    { key: 'my-profile', label: 'My Profile', icon: '👤', path: '/elder/profile' },
    
    
    
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
          <div className={styles.userAvatar}>👴</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>
              Hi {currentUser?.name || 'Elder'}!
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
              
              {/* Submenu */}
              {item.hasSubmenu && expandedMenus[item.key] && !sidebarCollapsed && (
                <ul className={styles.submenu}>
                  {item.submenu.map((subItem) => (
                    <li key={subItem.key} className={styles.submenuItem}>
                      <div
                        className={`${styles.submenuLink} ${
                          activeMenuItem === subItem.key ? styles.active : ''
                        }`}
                        onClick={() => handleMenuItemClick(subItem)}
                      >
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

export default ElderSidebar;
