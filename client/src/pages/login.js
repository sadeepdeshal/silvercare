import React, { useState } from "react";
import { Link } from "react-router-dom";
import loginImage from "../components/images/login.jpg";
import welcomeIcon from "../components/images/5220-1.jpg";
import nameIcon from "../components/images/group41.png";
import emailIcon from "../components/images/group.jpg";
import "../components/css/login.css";

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login form submitted:', formData);
    // Add login logic here later
  };

  return (
    <div className="login-page">
      <div className="bg">
        <div className="left-section">
          <img className="main-image" alt="Login" src={loginImage} />
          <div className="welcome-text">
            <h1 className="welcome-title">Welcome Back to SilverCare!</h1>
            <p className="welcome-description">
              Sign in to your account to continue providing
              <br />
              exceptional care and support to your community.
              <br />
              Your dedication makes a difference every day.
            </p>
          </div>
        </div>

        <div className="right-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">Log In to Your Account</h2>
              <img className="welcome-image" alt="Welcome" src={welcomeIcon} />
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-section">
                <h3 className="section-title">Login Information</h3>
                <p className="section-subtitle">Please enter your credentials to continue</p>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Email icon" src={emailIcon} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Password icon" src={nameIcon} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-options">
                  <div className="remember-me">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">Remember me</label>
                  </div>
                  <Link to="/forgot-password" className="forgot-password">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button type="submit" className="primary-btn">
                <span className="button-text">Log In</span>
              </button>
            </form>

            <div className="form-footer">
              <p className="signup-prompt">Don't Have An Account?</p>
              <div className="signup-links">
                <Link to="/caregiver/signup" className="sign-up-link">Sign Up</Link>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
