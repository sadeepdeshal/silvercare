import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './css/navbar.module.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Logo Section */}
        <div className={styles.navLogo} onClick={handleLogoClick}>
          <div className={styles.logoIcon}>
            <span className={styles.logoSymbol}>🏥</span>
          </div>
          <span className={styles.logoText}>SilverCare</span>
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
            className={`${styles.navItem} ${isActive('/services') ? styles.active : ''}`}
            onClick={() => handleNavigation('/services')}
          >
            Services
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
          <button 
            className={styles.loginBtn}
            onClick={() => handleNavigation('/login')}
          >
            Logout
          </button>

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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
