import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './../components/css/familymember_sidebar.module.css';

const FamilyMemberSidebar = ({ onItemClick }) => {
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
        navigate('/family-member/dashboard');
        break;
      case 'register-elder':
        navigate('/family-member/elder-signup');
        break;
      case 'elder-profiles':
        navigate('/family-member/elders');
        break;
      case 'medical-history':
        navigate('/family-member/medical-history');
        break;
      case 'book-appointment':
        navigate('/family-member/appointments');
        break;
      case 'upcoming-appointments':
        navigate('/family-member/upcoming-appointments');
        break;
      case 'appointment-history':
        navigate('/family-member/appointment-history');
        break;
      case 'prescriptions':
        navigate('/family-member/prescriptions');
        break;
      case 'lab-reports':
        navigate('/family-member/lab-reports');
        break;
      case 'wellness-updates':
        navigate('/family-member/wellness-updates');
        break;
      case 'messages':
        navigate('/family-member/messages');
        break;
      case 'doctor-chat':
        navigate('/family-member/doctor-chat');
        break;
      case 'caregiver-chat':
        navigate('/family-member/caregiver-chat');
        break;
      case 'find-caregivers':
        navigate('/family-member/caregivers');
        break;
      case 'assigned-caregivers':
        navigate('/family-member/assigned-caregivers');
        break;
      case 'care-reports':
        navigate('/family-member/care-reports');
        break;
      case 'counselor-sessions':
        navigate('/family-member/counselor-sessions');
        break;
      case 'mental-health-reports':
        navigate('/family-member/mental-health-reports');
        break;
      case 'profile-settings':
        navigate('/family-member/profile-settings');
        break;
      case 'privacy-settings':
        navigate('/family-member/privacy-settings');
        break;
      case 'notification-settings':
        navigate('/family-member/notification-settings');
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
      path: '/family-member/dashboard'
    },
    {
      key: 'elderly-management',
      label: 'Elders',
      icon: '👴',
      hasSubmenu: true,
      submenu: [
        { key: 'register-elder', label: 'Register Elder', path: '/family-member/elder-signup' },
        { key: 'elder-profiles', label: 'Elder Profiles', path: '/family-member/elders' },
        { key: 'medical-history', label: 'Medical History', path: '/family-member/medical-history' }
      ]
    },
    {
      key: 'appointments',
      label: 'Appointments',
      icon: '📅',
      hasSubmenu: true,
      submenu: [
        { key: 'book-appointment', label: 'Book Appointment', path: '/family-member/appointments' },
        { key: 'upcoming-appointments', label: 'Upcoming', path: '/family-member/upcoming-appointments' },
        { key: 'appointment-history', label: 'History', path: '/family-member/appointment-history' }
      ]
    },
    {
      key: 'medical-records',
      label: 'Reports',
      icon: '📋',
      hasSubmenu: true,
      submenu: [
        { key: 'prescriptions', label: 'Prescriptions', path: '/family-member/prescriptions' },
        { key: 'lab-reports', label: 'Lab Reports', path: '/family-member/lab-reports' },
        { key: 'wellness-updates', label: 'Wellness Updates', path: '/family-member/wellness-updates' }
      ]
    },
    {
      key: 'communications',
      label: 'Messages',
      icon: '💬',
      hasSubmenu: true,
      submenu: [
        { key: 'messages', label: 'Messages', path: '/family-member/messages' },
        { key: 'doctor-chat', label: 'Doctor Chat', path: '/family-member/doctor-chat' },
        { key: 'caregiver-chat', label: 'Caregiver Chat', path: '/family-member/caregiver-chat' }
      ]
    },
 
    {
      key: 'caregivers',
      label: 'Caregivers',
      icon: '🧑‍💼',
      hasSubmenu: true,
      submenu: [
        { key: 'find-caregivers', label: 'Find Caregivers', path: '/family-member/caregivers' },
        { key: 'assigned-caregivers', label: 'Assigned Caregivers', path: 'assigned-caregivers' },
        { key: 'care-reports', label: 'Care Reports', path: '/family-member/care-reports' }
      ]
    },
    {
      key: 'mental-health',
      label: 'Health Logs',
      icon: '🧠',
      hasSubmenu: true,
      submenu: [
        { key: 'counselor-sessions', label: 'Counselor Sessions', path: '/family-member/counselor-sessions' },
        { key: 'mental-health-reports', label: 'Mental Health Reports', path: '/family-member/mental-health-reports' }
      ]
    },
    
    
    {
      key: 'settings',
      label: 'Settings',
      icon: '⚙️',
      hasSubmenu: true,
      submenu: [
        { key: 'profile-settings', label: 'Profile Settings', path: '/family-member/profile-settings' },
        { key: 'privacy-settings', label: 'Privacy Settings', path: '/family-member/privacy-settings' },
        { key: 'notification-settings', label: 'Notification Settings', path: '/family-member/notification-settings' }
      ]
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

export default FamilyMemberSidebar;
