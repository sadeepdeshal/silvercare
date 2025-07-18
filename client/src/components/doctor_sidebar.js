import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './../components/css/doctor_sidebar.module.css';

const DoctorSidebar = ({ onItemClick, onToggleCollapse }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut for toggle (Ctrl + B)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sidebarCollapsed]);

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleToggleSidebar = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsedState);
    }
    
    // Close all expanded menus when collapsing
    if (newCollapsedState) {
      setExpandedMenus({});
    }
  };

  const handleMenuItemClick = (item) => {
    setActiveMenuItem(item.key);
    
    // Handle navigation based on menu item
    switch (item.key) {
      case 'dashboard':
        navigate('/doctor/dashboard');
        break;
      case 'appointments':
        navigate('/doctor/appointments');
        break;
      case 'schedule':
        navigate('/doctor/schedule');
        break;
      case 'appointment-history':
        navigate('/doctor/appointment-history');
        break;
      case 'patient-list':
        navigate('/doctor/patients');
        break;
      case 'patient-records':
        navigate('/doctor/patient-records');
        break;
      case 'medical-history':
        navigate('/doctor/medical-history');
        break;
      case 'prescriptions':
        navigate('/doctor/prescriptions');
        break;
      case 'lab-reports':
        navigate('/doctor/lab-reports');
        break;
      case 'diagnosis-reports':
        navigate('/doctor/diagnosis-reports');
        break;
      case 'messages':
        navigate('/doctor/messages');
        break;
      case 'family-chat':
        navigate('/doctor/family-chat');
        break;
      case 'caregiver-chat':
        navigate('/doctor/caregiver-chat');
        break;
      case 'consultations':
        navigate('/doctor/consultations');
        break;
      case 'virtual-consultations':
        navigate('/doctor/virtual-consultations');
        break;
      case 'consultation-history':
        navigate('/doctor/consultation-history');
        break;
      case 'profile-settings':
        navigate('/doctor/profile');
        break;
      case 'clinic-settings':
        navigate('/doctor/clinic-settings');
        break;
      case 'availability-settings':
        navigate('/doctor/availability-settings');
        break;
      case 'notification-settings':
        navigate('/doctor/notification-settings');
        break;
      default:
        console.log('Navigation not implemented for:', item.key);
    }
    
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const sidebarItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: '🏥',
      path: '/doctor/dashboard'
    },
    {
      key: 'appointments-management',
      label: 'Appointments',
      icon: '📅',
      hasSubmenu: true,
      submenu: [
        { key: 'appointments', label: 'Today\'s Appointments', path: '/doctor/appointments' },
        { key: 'schedule', label: 'Schedule', path: '/doctor/schedule' },
        { key: 'appointment-history', label: 'History', path: '/doctor/appointment-history' }
      ]
    },
    {
      key: 'patients',
      label: 'Patients',
      icon: '👥',
      hasSubmenu: true,
      submenu: [
        { key: 'patient-list', label: 'Patient List', path: '/doctor/patients' },
        { key: 'patient-records', label: 'Patient Records', path: '/doctor/patient-records' },
        { key: 'medical-history', label: 'Medical History', path: '/doctor/medical-history' }
      ]
    },
    {
      key: 'medical-records',
      label: 'Medical Records',
      icon: '📋',
      hasSubmenu: true,
      submenu: [
        { key: 'prescriptions', label: 'Prescriptions', path: '/doctor/prescriptions' },
        { key: 'lab-reports', label: 'Lab Reports', path: '/doctor/lab-reports' },
        { key: 'diagnosis-reports', label: 'Diagnosis Reports', path: '/doctor/diagnosis-reports' }
      ]
    },
    {
      key: 'communications',
      label: 'Communications',
      icon: '💬',
      hasSubmenu: true,
      submenu: [
        { key: 'messages', label: 'Messages', path: '/doctor/messages' },
        { key: 'family-chat', label: 'Family Chat', path: '/doctor/family-chat' },
        { key: 'caregiver-chat', label: 'Caregiver Chat', path: '/doctor/caregiver-chat' }
      ]
    },
    {
      key: 'consultations',
      label: 'Consultations',
      icon: '🩺',
      hasSubmenu: true,
      submenu: [
        { key: 'consultations', label: 'Consultations', path: '/doctor/consultations' },
        { key: 'virtual-consultations', label: 'Virtual Consultations', path: '/doctor/virtual-consultations' },
        { key: 'consultation-history', label: 'History', path: '/doctor/consultation-history' }
      ]
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: '⚙️',
      hasSubmenu: true,
      submenu: [
        { key: 'profile-settings', label: 'Profile Settings', path: '/doctor/profile' },
        { key: 'clinic-settings', label: 'Clinic Settings', path: '/doctor/clinic-settings' },
        { key: 'availability-settings', label: 'Availability', path: '/doctor/availability-settings' },
        { key: 'notification-settings', label: 'Notifications', path: '/doctor/notification-settings' }
      ]
    }
  ];

  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      toggleSubmenu(item.key);
    } else {
      handleMenuItemClick(item);
    }
  };

  return (
    <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Sidebar Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          {!sidebarCollapsed && <span className={styles.logoText}>SilverCare</span>}
        </div>
        <button 
          className={styles.toggleButton}
          onClick={handleToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {sidebarCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* User Info */}
      {!sidebarCollapsed && (
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>👨‍⚕️</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>Doctor</span>
            <span className={styles.userRole}>Medical Professional</span>
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
                title={sidebarCollapsed ? item.label : ''}
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
                {sidebarCollapsed && (
                  <div className={styles.tooltip}>
                    <span className={styles.tooltipText}>{item.label}</span>
                    {item.hasSubmenu && item.submenu && (
                      <div className={styles.tooltipSubmenu}>
                        {item.submenu.map((subItem) => (
                          <div key={subItem.key} className={styles.tooltipSubmenuItem}>
                            {subItem.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

export default DoctorSidebar;
