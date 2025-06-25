import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import x52201 from "../../components/images/5220-1.jpg";
import group41 from "../../components/images/group41.png";
import group3984 from "../../components/images/group3984.jpg";
import group from "../../components/images/group.jpg";
import image1 from "../../components/images/image-1.jpg";
import image from "../../components/images/image.jpg";
import line133 from "../../components/images/line-133.jpg";
import "../../components/css/familymember/signup.css";
import { Link } from "react-router-dom";

export const FamilyMemberReg = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    fixedLine: ''
  });

  // Add error states
  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    fixedLine: ''
  });

  // Custom email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailRegex.test(email);
  };

  // Phone validation function
  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  // Fixed line validation function
  const validateFixedLine = (fixedLine) => {
    if (!fixedLine) return true; // Optional field
    const fixedLineRegex = /^[0-9]{10}$/;
    return fixedLineRegex.test(fixedLine);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear previous error when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    // Real-time validation
    if (name === 'email' && value) {
      if (!validateEmail(value)) {
        setErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address (e.g., user@example.com)'
        }));
      }
    }

    if (name === 'phone' && value) {
      if (!validatePhone(value)) {
        setErrors(prev => ({
          ...prev,
          phone: 'Phone number must be exactly 10 digits'
        }));
      }
    }

    if (name === 'fixedLine' && value) {
      if (!validateFixedLine(value)) {
        setErrors(prev => ({
          ...prev,
          fixedLine: 'Fixed line must be exactly 10 digits'
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {};
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }
    
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }
    
    if (formData.fixedLine && !validateFixedLine(formData.fixedLine)) {
      newErrors.fixedLine = 'Fixed line must be exactly 10 digits';
    }

    // If there are errors, set them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    console.log('Form submitted:', formData);
    
    // Store form data in localStorage or context for use in step 2
    localStorage.setItem('familyMemberStep1Data', JSON.stringify(formData));
    
    // Navigate to step 2
    navigate('/family-member/signup-step2');
  };

  // Add this useEffect to load saved data
  useEffect(() => {
    // Load step 1 data if returning from step 2
    const savedStep1Data = localStorage.getItem('familyMemberStep1Data');
    if (savedStep1Data) {
      setFormData(JSON.parse(savedStep1Data));
    }
  }, []);

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
                  <label className="form-label">Name</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Name icon" src={group41} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Sadeep Deshal"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Email icon" src={group} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email address"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                      title="Please enter a valid email address"
                      required
                    />
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Phone icon" src={image} />
                    <input
                      type="number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g, 0715896477"
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      pattern="[0-9]{10}"
                      maxLength="10"
                      required
                    />
                  </div>
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Fixed Line</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Fixed line icon" src={group3984} />
                    <input
                      type="number"
                      name="fixedLine"
                      value={formData.fixedLine}
                      onChange={handleInputChange}
                      placeholder="e.g, 0415869896"
                      className={`form-input ${errors.fixedLine ? 'error' : ''}`}
                      pattern="[0-9]{10}"
                      maxLength="10"
                    />
                  </div>
                  {errors.fixedLine && <span className="error-message">{errors.fixedLine}</span>}
                </div>
              </div>

              <button type="submit" className="primary-btn">
                <span className="button-text">Next step</span>
              </button>
            </form>

            <div className="form-footer">
              <p className="login-prompt">Do You Have An Account?</p>
              <Link to="/login" className="sign-in-link">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
