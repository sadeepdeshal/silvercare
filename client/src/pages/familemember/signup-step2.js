import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerFamilyMember } from "../../services/registerApi";
import x52201 from "../../components/images/5220-1.jpg";
import group41 from "../../components/images/group41.png";
import group3984 from "../../components/images/group3984.jpg";
import group from "../../components/images/group.jpg";
import image1 from "../../components/images/image-1.jpg";
import image from "../../components/images/image.jpg";
import line133 from "../../components/images/line-133.jpg";
import "../../components/css/familymember/signup.css";

export const FamilyMemberReg2 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [step1Data, setStep1Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

useEffect(() => {
  // Get step 1 data from localStorage
  const savedData = localStorage.getItem('familyMemberStep1Data');
  if (savedData) {
    setStep1Data(JSON.parse(savedData));
  } else {
    // If no step 1 data, redirect back to step 1
    navigate('/family-member/signup');
  }

  // Restore step 2 data if user came back from step 1
  const savedStep2Data = localStorage.getItem('familyMemberStep2Data');
  if (savedStep2Data) {
    const step2Data = JSON.parse(savedStep2Data);
    setFormData(step2Data);
    // Clear the saved step 2 data after restoring
    localStorage.removeItem('familyMemberStep2Data');
  }
}, [navigate]);

  // Password strength validation function
  const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return { isValid: false, message: 'Password must be at least 8 characters long', strength: 'weak' };
    }
    
    let score = 0;
    let missing = [];

    if (hasUpperCase) score++;
    else missing.push('uppercase letter');
    
    if (hasLowerCase) score++;
    else missing.push('lowercase letter');
    
    if (hasNumbers) score++;
    else missing.push('number');
    
    if (hasSpecialChar) score++;
    else missing.push('special character');

    if (score < 3) {
      return { 
        isValid: false, 
        message: `Password must contain at least: ${missing.slice(0, 4 - score).join(', ')}`, 
        strength: 'weak' 
      };
    } else if (score === 3) {
      return { isValid: true, message: 'Good password strength', strength: 'medium' };
    } else {
      return { isValid: true, message: 'Strong password', strength: 'strong' };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength in real-time
    if (name === 'password') {
      const validation = validatePasswordStrength(value);
      setPasswordStrength(validation);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!step1Data) {
      setError('Missing registration data. Please start from step 1.');
      return;
    }

    setLoading(true);

    try {
      // Combine step 1 and step 2 data
      const completeRegistrationData = {
        name: step1Data.name,
        email: step1Data.email,
        phone: step1Data.phone,
        fixedLine: step1Data.fixedLine,
        password: formData.password,
        role: 'family_member'
      };

      // Submit to API
      const response = await registerFamilyMember(completeRegistrationData);
      
      console.log('Registration successful:', response.data);
      
      // Clear localStorage
      localStorage.removeItem('familyMemberStep1Data');
      
      // Show success message
      alert('Registration successful! Welcome to SilverCare!');
      
      // Redirect to family member dashboard
      navigate('/family-member/dashboard');
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      if (error.response) {
        const errorMessage = error.response.data.error || 'Registration failed';
        
        if (error.response.status === 400) {
          setError(errorMessage);
        } else if (error.response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(errorMessage);
        }
      } else if (error.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get strength indicator color
  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'weak': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'strong': return '#00aa00';
      default: return '#ccc';
    }
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
                <h3 className="section-title">Security Information</h3>
                <p className="section-subtitle">Create a strong password for your account</p>
                
                {error && (
                  <div className="error-message" style={{
                    color: 'red', 
                    marginBottom: '1rem', 
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: '#ffe6e6',
                    border: '1px solid #ff9999',
                    borderRadius: '5px'
                  }}>
                    {error}
                  </div>
                )}

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
                      minLength="8"
                    />
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="password-requirements" style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px'
                  }}>
                    <p style={{margin: '0 0 0.3rem 0', fontWeight: 'bold'}}>Password must contain:</p>
                    <ul style={{margin: 0, paddingLeft: '1.2rem'}}>
                      <li>At least 8 characters</li>
                      <li>One uppercase letter (A-Z)</li>
                      <li>One lowercase letter (a-z)</li>
                      <li>One number (0-9)</li>
                      <li>One special character (!@#$%^&*)</li>
                    </ul>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && passwordStrength && (
                    <div className="password-strength" style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      backgroundColor: passwordStrength.isValid ? '#e6ffe6' : '#ffe6e6'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '100px',
                          height: '4px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: passwordStrength.strength === 'weak' ? '33%' : 
                                   passwordStrength.strength === 'medium' ? '66%' : '100%',
                            height: '100%',
                            backgroundColor: getStrengthColor(passwordStrength.strength),
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <span style={{
                          fontSize: '0.8rem',
                          color: getStrengthColor(passwordStrength.strength),
                          fontWeight: 'bold'
                        }}>
                          {passwordStrength.message}
                        </span>
                      </div>
                    </div>
                  )}
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
                      minLength="8"
                    />
                  </div>
                  
                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: formData.password === formData.confirmPassword ? '#00aa00' : '#ff4444'
                    }}>
                      {formData.password === formData.confirmPassword ? 
                        '✓ Passwords match' : 
                        '✗ Passwords do not match'
                      }
                    </div>
                  )}
                </div>
                                
                <div className="button-container">
                  <button 
                    type="submit" 
                    className="register-btn-centered"
                    disabled={loading || !passwordStrength.isValid}
                    style={{
                      opacity: (loading || !passwordStrength.isValid) ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Registering...' : 'Register Now'}
                  </button>
                </div>
              </div>


              // Add this after the form header and before the form
<div className="navigation-buttons" style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem'
}}>
  <button 
    type="button"
      onClick={() => {
    // Save current step 2 data before going back
    const step2Data = {
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };
    localStorage.setItem('familyMemberStep2Data', JSON.stringify(step2Data));
    navigate('/family-member/signup');
  }}
    className="back-btn"
    style={{
      padding: '10px 20px',
      backgroundColor: '#f8f9fa',
      color: '#667eea',
      border: '2px solid #667eea',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.3s ease'
    }}
    onMouseOver={(e) => {
      e.target.style.backgroundColor = '#667eea';
      e.target.style.color = 'white';
    }}
    onMouseOut={(e) => {
      e.target.style.backgroundColor = '#f8f9fa';
      e.target.style.color = '#667eea';
    }}
  >
    ← Back to Step 1
  </button>
  
  <div className="step-indicator" style={{fontSize: '0.9rem', color: '#666'}}>
    Step 2 of 2
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
