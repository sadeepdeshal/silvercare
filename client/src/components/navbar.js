import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth
import styles from './css/navbar.module.css';
import logoSilver from './images/logo_silver.png'; // ✅ Import your custom logo

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser, isAuthenticated } = useAuth(); // ✅ Get logout function
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  };

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
        </div>

        {/* Auth Buttons */}
        <div className={styles.navAuth}>
          {isAuthenticated ? (
            // ✅ Show logout button when authenticated
            <button 
              className={styles.loginBtn}
              onClick={handleLogout} // ✅ Use proper logout handler
            >
              Logout
            </button>
          ) : (
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
