import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './css/admin/AdminNavbar.module.css';
import logoSilver from './images/logo_silver.png'; // ✅ Import your custom logo

const AdminNavbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: '📊'
    },
    {
      path: '/admin/users',
      label: 'Users',
      icon: '👥'
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      icon: '⚙️'
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={styles.adminNavbar}>
      <div className={styles.navContainer}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logo} onClick={() => navigate('/admin/dashboard')}>
            <span className={styles.logoIcon}>
              <div className={styles.navLogo} >
                        <img 
                          src={logoSilver} 
                          alt="SilverCare Logo" 
                          className={styles.logoImage}
                        />
                      </div>
            </span>
            <span className={styles.logoText}></span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <ul className={styles.navList}>
            {navigationItems.map((item) => (
              <li key={item.path} className={styles.navItem}>
                <button
                  className={`${styles.navLink} ${isActivePath(item.path) ? styles.active : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Admin Profile Section */}
        <div className={styles.profileSection}>
          <div className={styles.adminInfo}>
            <span className={styles.adminRole}>Admin</span>
            <span className={styles.adminName}>{currentUser?.name || 'Admin User'}</span>
          </div>
          
          <div className={styles.profileDropdown}>
            <button
              className={styles.profileButton}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className={styles.profileAvatar}>
                <span className={styles.avatarIcon}>👤</span>
              </div>
              <span className={styles.dropdownArrow}>▼</span>
            </button>

            {showProfileDropdown && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.userInfo}>
                    <strong>{currentUser?.name}</strong>
                    <span>{currentUser?.email}</span>
                  </div>
                </div>
                <div className={styles.dropdownDivider}></div>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate('/admin/profile');
                    setShowProfileDropdown(false);
                  }}
                >
                  <span className={styles.dropdownIcon}>👤</span>
                  Profile Settings
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate('/admin/system-settings');
                    setShowProfileDropdown(false);
                  }}
                >
                  <span className={styles.dropdownIcon}>⚙️</span>
                  System Settings
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate('/admin/security');
                    setShowProfileDropdown(false);
                  }}
                >
                  <span className={styles.dropdownIcon}>🔒</span>
                  Security
                </button>
                <div className={styles.dropdownDivider}></div>
                <button
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={handleLogout}
                >
                  <span className={styles.dropdownIcon}>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className={styles.mobileNav}>
          <div className={styles.mobileNavHeader}>
            <div className={styles.mobileUserInfo}>
              <div className={styles.mobileAvatar}>
                <span className={styles.avatarIcon}>👤</span>
              </div>
              <div className={styles.mobileUserDetails}>
                <strong>{currentUser?.name}</strong>
                <span>{currentUser?.email}</span>
                <span className={styles.mobileRole}>Administrator</span>
              </div>
            </div>
          </div>

          <ul className={styles.mobileNavList}>
            {navigationItems.map((item) => (
              <li key={item.path} className={styles.mobileNavItem}>
                <button
                  className={`${styles.mobileNavLink} ${isActivePath(item.path) ? styles.active : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.mobileNavFooter}>
            <button
              className={styles.mobileNavLink}
              onClick={() => {
                navigate('/admin/profile');
                setIsMenuOpen(false);
              }}
            >
              <span className={styles.navIcon}>👤</span>
              <span className={styles.navLabel}>Profile</span>
            </button>
            <button
              className={`${styles.mobileNavLink} ${styles.logoutLink}`}
              onClick={handleLogout}
            >
              <span className={styles.navIcon}>🚪</span>
              <span className={styles.navLabel}>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default AdminNavbar;