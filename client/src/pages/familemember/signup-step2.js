import React, { useState } from "react";
import x52201 from "../../components/images/5220-1.jpg";
import group41 from "../../components/images/group41.png";
import group3984 from "../../components/images/group3984.jpg";
import group from "../../components/images/group.jpg";
import image1 from "../../components/images/image-1.jpg";
import image from "../../components/images/image.jpg";
import line133 from "../../components/images/line-133.jpg";
import "../../components/css/familymember/signup.css";
import { Link } from "react-router-dom";

export const FamilyMemberReg2 = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
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
    console.log('Form submitted:', formData);
    // Add your form submission logic here
  };

  return (
    <div className="family-member-reg">
      <div className="bg">
        <div className="left-section">
          <img className="main-image" alt="Family Care" src={image1} />
          <div className="welcome-text">
            <h1 className="welcome-title">Welcome to SilverCare!</h1>
            <p className="welcome-description">
              Help your loved ones stay safe, healthy, and supported.
              <br />
              Create your family member account to connect with seniors,
              caregivers, and doctors — all in one place
            </p>
          </div>
        </div>
        <div className="right-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">Register as a Family Member</h2>
              <img className="welcome-image" alt="Welcome" src={x52201} />
            </div>
            <form onSubmit={handleSubmit} className="registration-form">
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>
                <p className="section-subtitle">Make sure you have filled all the details</p>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Password icon" src={group41} />
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
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Confirm password icon" src={group} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                                <div className="button-container">
                  <button type="submit" className="register-btn-centered">
                    Register Now
                  </button>
                </div>
              </div>
            </form>
            <div className="form-footer">
              <p className="login-prompt">Do You Have An Account?</p>
                            <Link to="/family-member/signup" className="sign-in-link">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
