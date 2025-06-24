import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerCaregiver } from "../../services/registerApi";
import x52201 from "../../components/images/5220-1.jpg";
import group41 from "../../components/images/group41.png";
import image1 from "../../components/images/image-1.jpg";
import "../../components/css/caregiver/signup.css";
import { Link } from "react-router-dom";

export const CaregiverRegStep2 = () => {
  const navigate = useNavigate();
  const [step1Data, setStep1Data] = useState({});
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load step 1 data
    const savedStep1Data = localStorage.getItem('caregiverStep1Data');
    if (!savedStep1Data) {
      // If no step 1 data, redirect back to step 1
      navigate('/caregiver/signup');
      return;
    }
    setStep1Data(JSON.parse(savedStep1Data));
  }, [navigate]);

  const checkPasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One uppercase letter");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One lowercase letter");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("One number");
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One special character");
    }

    return { score, feedback };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return '#ff4757';
    if (passwordStrength.score <= 3) return '#ffa502';
    if (passwordStrength.score <= 4) return '#ff6b35';
    return '#2ed573';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (passwordStrength.score < 5) {
      setError('Please create a stronger password with all required criteria');
      return;
    }

    setIsLoading(true);

    try {
      // Combine step 1 and step 2 data
      const completeData = {
        ...step1Data,
        password: formData.password,
        role: 'caregiver'
      };

      console.log('Submitting caregiver registration:', completeData);
      
      const response = await registerCaregiver(completeData);
      
      console.log('Registration successful:', response.data);
      
      // Clear localStorage
      localStorage.removeItem('caregiverStep1Data');
      
      // Show success message and redirect
      alert('Registration successful! Welcome to SilverCare.');
      navigate('/caregiver/dashboard');
      
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 400) {
        setError('Registration failed. Please check your information and try again.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    navigate('/caregiver/signup');
  };

  return (
    <div className="family-member-reg">
      <div className="bg">
        <div className="left-section">
          <img className="main-image" alt="Caregiver Care" src={image1} />
          <div className="welcome-text">
            <h1 className="welcome-title">Almost There!</h1>
            <p className="welcome-description">
              Create a secure password to complete your caregiver registration.
              <br />
              Join our community of professional caregivers today!
            </p>
          </div>
        </div>

        <div className="right-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">Complete Your Registration</h2>
              <img className="welcome-image" alt="Welcome" src={x52201} />
            </div>

            {error && (
              <div className="error-message" style={{
                backgroundColor: '#ffe6e6',
                color: '#d63031',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #fab1a0'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="registration-form">
              <div className="form-section">
                <h3 className="section-title">Create Password</h3>
                <p className="section-subtitle">Choose a strong password to secure your account</p>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Password icon" src={group41} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="form-input"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#666'
                      }}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  
                  {formData.password && (
                    <div className="password-strength" style={{ marginTop: '8px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <div style={{
                          flex: 1,
                          height: '4px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            height: '100%',
                            backgroundColor: getPasswordStrengthColor(),
                            transition: 'all 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: getPasswordStrengthColor(),
                          fontWeight: '500'
                        }}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      
                      {passwordStrength.feedback.length > 0 && (
                        <div style={{
                          fontSize: '12px',
                          color: '#666',
                          marginTop: '4px'
                        }}>
                          Missing: {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-container">
                    <img className="input-icon" alt="Confirm Password icon" src={group41} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className="form-input"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#666'
                      }}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <div style={{
                      fontSize: '12px',
                      color: '#ff4757',
                      marginTop: '4px'
                    }}>
                      Passwords do not match
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={handleBackToStep1}
                  className="secondary-btn"
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    border: '1px solid #dee2e6',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginRight: '12px'
                  }}
                >
                  Back to Step 1
                </button>
                
                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={isLoading || passwordStrength.score < 5 || formData.password !== formData.confirmPassword}
                  style={{
                    opacity: (isLoading || passwordStrength.score < 5 || formData.password !== formData.confirmPassword) ? 0.6 : 1,
                    cursor: (isLoading || passwordStrength.score < 5 || formData.password !== formData.confirmPassword) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span className="button-text">
                    {isLoading ? 'Creating Account...' : 'Complete Registration'}
                  </span>
                </button>
              </div>
            </form>

            <div className="form-footer">
              <p className="login-prompt">Already Have An Account?</p>
              <Link to="/login" className="sign-in-link">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
