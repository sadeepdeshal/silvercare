import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth
import styles from './css/navbar.module.css';
import logoSilver from './images/logo_silver.png'; // ✅ Import your custom logo
import userIcon from './images/user.png'; // ✅ Import user icon
import bellIcon from './images/bell.png'; // ✅ Import bell icon

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser, isAuthenticated } = useAuth(); // ✅ Get logout function
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // ✅ Proper logout handler
  const handleLogout = () => {
    logout(); // Use the logout function from AuthContext
    setIsProfileDropdownOpen(false); // Close dropdown after logout
  };

  // ✅ Profile icon click handler - Toggle dropdown
  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // ✅ Role-based profile navigation handler - Updated to match App.js routes
  const handleProfileNavigation = () => {
    if (!currentUser || !currentUser.role) {
      console.error('User role not found');
      return;
    }

    const role = currentUser.role.toLowerCase();
    let profilePath = '/profile'; // default fallback

    switch (role) {
      case 'elder':
        profilePath = '/elder/profile';
        break;
      case 'doctor':
        profilePath = '/doctor/profile';
        break;
      case 'caregiver':
        profilePath = '/caregiver/profile';
        break;
      case 'family_member':
        profilePath = '/family-member/profile'; // ✅ Fixed to match App.js route
        break;
      case 'healthprofessional':
        profilePath = '/healthprofessional/profile';
        break;
      case 'admin':
        // Admin doesn't have a profile page, so we don't navigate
        console.log('Admin users do not have a profile page');
        return;
      default:
        console.warn('Unknown role:', role);
        profilePath = '/profile';
    }

    navigate(profilePath);
    setIsProfileDropdownOpen(false);
  };

  const handleSettingsNavigation = () => {
    navigate('/settings');
    setIsProfileDropdownOpen(false);
  };

  // ✅ Bell icon click handler
  const handleNotificationClick = () => {
    navigate('/notifications'); // Navigate to notifications page
  };

  // ✅ Check if current user is admin
  const isAdmin = currentUser && currentUser.role && currentUser.role.toLowerCase() === 'admin';

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <div className={styles.navLogo} >
          <img 
            src={logoSilver} 
            alt="SilverCare Logo" 
            className={styles.logoImage}
          />
        </div>

        {/* Desktop Navigation Links */}
        <div className={styles.navMenu}>
          <div 
            className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
            onClick={() => handleNavigation('/')}
          >
            Home
          </div>
          <div 
            className={`${styles.navItem} ${isActive('/about') ? styles.active : ''}`}
            onClick={() => handleNavigation('/about')}
          >
            About
          </div>

          <div 
            className={`${styles.navItem} ${isActive('/contact') ? styles.active : ''}`}
            onClick={() => handleNavigation('/contact')}
          >
            Contact
          </div>

          {/* ✅ Icons Section - Only show when authenticated */}
          {isAuthenticated && (
            <div className={styles.navIcons}>
              {/* ✅ Profile Icon with Dropdown */}
              <div className={styles.profileDropdownContainer} ref={dropdownRef}>
                <div 
                  className={styles.iconButton}
                  onClick={handleProfileClick}
                  title="Profile"
                >
                  <img 
                    src={userIcon} 
                    alt="Profile" 
                    className={styles.iconImage}
                  />
                </div>
                
                {/* ✅ Profile Dropdown - Hide Profile option for admin */}
                {isProfileDropdownOpen && (
                  <div className={styles.profileDropdown}>
                    {/* Only show Profile menu item if user is not admin */}
                    {!isAdmin && (
                      <div 
                        className={styles.dropdownItem}
                        onClick={handleProfileNavigation}
                      >
                        Profile
                      </div>
                    )}
                    <div 
                      className={styles.dropdownItem}
                      onClick={handleSettingsNavigation}
                    >
                      Settings
                    </div>
                    <div 
                      className={styles.dropdownItem}
                      onClick={handleLogout}
                    >
                      Logout
                    </div>
                  </div>
                )}
              </div>

              <div 
                className={styles.iconButton}
                onClick={handleNotificationClick}
                title="Notifications"
              >
                <img 
                  src={bellIcon} 
                  alt="Notifications" 
                  className={styles.iconImage}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.navAuth}>
          {!isAuthenticated && (
            // ✅ Show login button when not authenticated
            <button
              className={styles.loginBtn}
              onClick={() => handleNavigation('/login')}
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className={styles.mobileMenuToggle} onClick={toggleMobileMenu}>
          <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.active : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.active : ''}`}>
        <div className={styles.mobileNavItem} onClick={() => handleNavigation('/')}>
          Home
        </div>
        <div className={styles.mobileNavItem} onClick={() => handleNavigation('/about')}>
          About
        </div>
        <div className={styles.mobileNavItem} onClick={() => handleNavigation('/services')}>
          Services
        </div>
        <div className={styles.mobileNavItem} onClick={() => handleNavigation('/contact')}>
          Contact
        </div>
        
        {/* ✅ Mobile Icons Section - Only show when authenticated */}
        {isAuthenticated && (
          <div className={styles.mobileIconsSection}>
            {/* Only show Profile menu item if user is not admin */}
            {!isAdmin && (
              <div className={styles.mobileNavItem} onClick={() => {
                handleProfileNavigation();
                setIsMobileMenuOpen(false);
              }}>
                <img src={userIcon} alt="Profile" className={styles.mobileIconImage} />
                Profile
              </div>
            )}
            <div className={styles.mobileNavItem} onClick={() => handleNavigation('/settings')}>
              Settings
            </div>
            <div className={styles.mobileNavItem} onClick={handleNotificationClick}>
              <img src={bellIcon} alt="Notifications" className={styles.mobileIconImage} />
              Notifications
            </div>
          </div>
        )}

        <div className={styles.mobileAuthButtons}>
          {isAuthenticated ? (
            // ✅ Mobile logout button
            <button 
              className={styles.mobileLoginBtn}
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            // ✅ Mobile login/signup buttons
            <>
              <button 
                className={styles.mobileLoginBtn}
                onClick={() => handleNavigation('/login')}
              >
                Login
              </button>
              <button 
                className={styles.mobileSignupBtn}
                onClick={() => handleNavigation('/roles')}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
