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
import styles from "../../components/css/familymember/signup.module.css";

export const FamilyMemberReg2 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [step1Data, setStep1Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

    // Clear previous messages
    setError('');
    setSuccess('');

    // Check password strength in real-time
    if (name === 'password') {
      const validation = validatePasswordStrength(value);
      setPasswordStrength(validation);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
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
      setSuccess('Registration successful! Welcome to SilverCare!');
      
      // Redirect to family member dashboard after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
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

  const handleBackToStep1 = () => {
    // Save current step 2 data before going back
    const step2Data = {
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };
    localStorage.setItem('familyMemberStep2Data', JSON.stringify(step2Data));
    navigate('/family-member/signup');
  };

  // Get strength indicator width and color
  const getStrengthWidth = (strength) => {
    switch (strength) {
      case 'weak': return '25%';
      case 'medium': return '65%';
      case 'strong': return '100%';
      default: return '0%';
    }
  };

  const getStrengthClass = (strength) => {
    switch (strength) {
      case 'weak': return styles.weak;
      case 'medium': return styles.medium;
      case 'strong': return styles.strong;
      default: return '';
    }
  };

  return (
    <div className={styles.familyMemberReg}>
      <div className={styles.bg}>
        <div className={styles.leftSection}>
          <img className={styles.mainImage} alt="Family Care" src={image1} />
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>Welcome to SilverCare!</h1>
            <p className={styles.welcomeDescription}>
              Help your loved ones stay safe, healthy, and supported.
              <br />
              Create your family member account to connect with seniors,
              caregivers, and doctors — all in one place
            </p>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Register as a Family Member</h2>
              <img className={styles.welcomeImage} alt="Welcome" src={x52201} />
            </div>

    

            <form onSubmit={handleSubmit} className={styles.registrationForm}>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Security Information</h3>
                <p className={styles.sectionSubtitle}>Create a strong password for your account</p>
                
                {/* Success Message */}
                {success && (
                  <div className={styles.successMessage}>
                    {success}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Password icon" src={group41} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className={styles.formInput}
                      required
                      minLength="8"
                    />
                  </div>
                  
                  {/* Password Requirements */}
                  <div className={styles.passwordRequirements}>
                    <p>Password must contain:</p>
                    <ul>
                      <li>At least 8 characters</li>
                      <li>One uppercase letter (A-Z)</li>
                      <li>One lowercase letter (a-z)</li>
                      <li>One number (0-9)</li>
                      <li>One special character (!@#$%^&*)</li>
                    </ul>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && passwordStrength && (
                    <div className={styles.passwordStrength}>
                      <div className={styles.strengthIndicator}>
                        <div className={styles.strengthBar}>
                          <div 
                            className={`${styles.strengthFill} ${getStrengthClass(passwordStrength.strength)}`}
                            style={{ width: getStrengthWidth(passwordStrength.strength) }}
                          ></div>
                        </div>
                        <span className={styles.strengthText}>
                          {passwordStrength.message}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Confirm Password</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Confirm password icon" src={group} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className={styles.formInput}
                      required
                      minLength="8"
                    />
                  </div>
                  
                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className={`${styles.passwordMatchIndicator} ${
                      formData.password === formData.confirmPassword ? styles.match : styles.noMatch
                    }`}>
                      {formData.password === formData.confirmPassword ? 
                        '✓ Passwords match' : 
                        '✗ Passwords do not match'
                      }
                    </div>
                  )}
                </div>

                                <button 
                                  type="button" 
                                  onClick={handleBackToStep1}
                                  className={styles.secondaryBtn}
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
                                
                <div className={styles.buttonContainer}>
                  <button 
                    type="submit" 
                    className={`${styles.registerBtnCentered} ${loading ? styles.loading : ''}`}
                    disabled={loading || !passwordStrength.isValid || formData.password !== formData.confirmPassword}
                  >
                    {loading ? 'Registering...' : 'Register Now'}
                  </button>
                </div>
              </div>
            </form>

            <div className={styles.formFooter}>
              <p className={styles.loginPrompt}>Do You Have An Account?</p>
              <Link to="/login" className={styles.signInLink}>Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
