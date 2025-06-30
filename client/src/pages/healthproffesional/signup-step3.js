import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import x52201 from "../../components/images/5220-1.jpg";
import group41 from "../../components/images/group41.png";
import group3984 from "../../components/images/group3984.jpg";
import group from "../../components/images/group.jpg";
import image1 from "../../components/images/image-1.jpg";
import image from "../../components/images/image.jpg";
import line133 from "../../components/images/line-133.jpg";
import styles from "../../components/css/healthprofessional/signup.module.css";
import { Link } from "react-router-dom";
import { registerHealthProfessional } from "../../services/registerApi";

export const HealthProfessionalRegStep3 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    submit: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;
    let feedback = '';

    if (password.length >= minLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumbers) score++;
    if (hasSpecialChar) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Very Weak';
        break;
      case 2:
        feedback = 'Weak';
        break;
      case 3:
        feedback = 'Medium';
        break;
      case 4:
        feedback = 'Strong';
        break;
      case 5:
        feedback = 'Very Strong';
        break;
      default:
        feedback = 'Very Weak';
    }

    return { score, feedback };
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
      [name]: '',
      submit: ''
    }));

    // Password strength validation
    if (name === 'password') {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength);

      if (value.length > 0 && strength.score < 3) {
        setErrors(prev => ({
          ...prev,
          password: 'Password is too weak. Please make it stronger.'
        }));
      }
    }

    // Confirm password validation
    if (name === 'confirmPassword' || (name === 'password' && formData.confirmPassword)) {
      const passwordToCheck = name === 'password' ? value : formData.password;
      const confirmPasswordToCheck = name === 'confirmPassword' ? value : formData.confirmPassword;
      
      if (confirmPasswordToCheck && passwordToCheck !== confirmPasswordToCheck) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {};
    
    if (passwordStrength.score < 3) {
      newErrors.password = 'Password must be at least medium strength';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // If there are errors, set them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get all stored data from previous steps
      const step1Data = JSON.parse(localStorage.getItem('healthProfessionalStep1Data') || '{}');
      const step2Data = JSON.parse(localStorage.getItem('healthProfessionalStep2Data') || '{}');
      
      // Check if previous step data exists
      if (!step1Data.name || !step1Data.email || !step2Data.areaOfSpecification) {
        setErrors(prev => ({
          ...prev,
          submit: 'Missing information from previous steps. Please start registration again.'
        }));
        setIsSubmitting(false);
        return;
      }
      
      const completeFormData = {
        name: step1Data.name,
        email: step1Data.email,
        phone: step1Data.phone,
        alternativeNumber: step1Data.alternativeNumber,
        areaOfSpecification: step2Data.areaOfSpecification,
        licenseRegistrationNumber: step2Data.licenseRegistrationNumber,
        yearOfExperience: step2Data.yearOfExperience,
        currentInstitutions: step2Data.currentInstitutions,
        professionalCredentials: step2Data.professionalCredentials,
        password: formData.password
      };
      
      console.log('Submitting health professional registration:', completeFormData);
      
      // Call the API to register the health professional
      const response = await registerHealthProfessional(completeFormData);
      
      console.log('Registration successful:', response.data);
      
      // Clear localStorage after successful registration
      localStorage.removeItem('healthProfessionalStep1Data');
      localStorage.removeItem('healthProfessionalStep2Data');
      
      // Show success message and navigate
      alert('Registration successful! Your account is pending approval. You will be notified once approved.');
      navigate('/login');
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.error || 'Registration failed. Please try again.';
        setErrors(prev => ({
          ...prev,
          submit: errorMessage
        }));
      } else if (error.request) {
        // Request was made but no response received
        setErrors(prev => ({
          ...prev,
          submit: 'Network error. Please check your connection and try again.'
        }));
      } else {
        // Something else happened
        setErrors(prev => ({
          ...prev,
          submit: 'An unexpected error occurred. Please try again.'
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthColor = (score) => {
    switch (score) {
      case 0:
      case 1:
        return 'weak';
      case 2:
        return 'medium';
      case 3:
      case 4:
        return 'strong';
      case 5:
        return 'veryStrong';
      default:
        return 'weak';
    }
  };

  const getStrengthWidth = (score) => {
    return `${(score / 5) * 100}%`;
  };

  // Check if previous step data exists on component mount
  useEffect(() => {
    const step1Data = localStorage.getItem('healthProfessionalStep1Data');
    const step2Data = localStorage.getItem('healthProfessionalStep2Data');
    
    if (!step1Data || !step2Data) {
      alert('Please complete all previous steps first.');
      navigate('/healthproffesional/signup');
    }
  }, [navigate]);

  return (
    <div className={styles.doctorReg}>
      <div className={styles.bg}>
        <div className={styles.leftSection}>
          <img className={styles.mainImage} alt="Health Professional Care" src={image1} />
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>Welcome to SilverCare!</h1>
            <p className={styles.welcomeDescription}>
              Join our community of professional mental health experts.
              <br /> 
              Create your health professional account to connect with families,
              seniors, and healthcare professionals — all in one place
            </p>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Create Password</h2>
              <img className={styles.welcomeImage} alt="Welcome" src={x52201} />
            </div>

            <form onSubmit={handleSubmit} className={styles.registrationForm}>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Account Security</h3>
                <p className={styles.sectionSubtitle}>Create a strong password for your account</p>

                {/* Display submit error if any */}
                {errors.submit && (
                  <div className={styles.submitError}>
                    <span className={styles.errorMessage}>{errors.submit}</span>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Password icon" src={group} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className={`${styles.formInput} ${errors.password ? styles.error : ''}`}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                  
                  {/* Password Requirements */}
                  <div className={styles.passwordRequirements}>
                    <p>Password must contain:</p>
                    <ul>
                      <li>At least 8 characters</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                      <li>One special character</li>
                    </ul>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className={styles.passwordStrength}>
                      <div className={styles.strengthIndicator}>
                        <span>Password Strength: {passwordStrength.feedback}</span>
                        <div className={styles.strengthBar}>
                          <div 
                            className={`${styles.strengthFill} ${styles[getStrengthColor(passwordStrength.score)]}`}
                            style={{ width: getStrengthWidth(passwordStrength.score) }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Confirm Password</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Confirm password icon" src={group} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className={`${styles.formInput} ${errors.confirmPassword ? styles.error : ''}`}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
                  
                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className={`${styles.passwordMatchIndicator} ${
                      formData.password === formData.confirmPassword ? styles.match : styles.noMatch
                    }`}>
                      {formData.password === formData.confirmPassword ? 
                        "✓ Passwords match" : 
                        "✗ Passwords do not match"
                      }
                    </div>
                  )}
                </div>
              </div>

                            <div className={styles.buttonContainer}>
                <button 
                  type="button" 
                  className={styles.backBtn}
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
                  onClick={() => navigate('/healthproffesional/signup-step2')}
                >
                  <span className={styles.buttonText}>Back to Step 2</span>
                </button>
                <button 
                  type="submit" 
                  className={`${styles.registerBtnCentered} ${isSubmitting ? styles.loading : ''}`}
                  disabled={isSubmitting}
                >
                  <span className={styles.buttonText}>
                    {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                  </span>
                </button>
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

