import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerElder } from '../../services/registerApi';
import styles from '../../components/css/familymember/elder-signup.module.css';
import Navbar from '../../components/navbar';

const ElderSignup = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    nicPassport: '',
    contactNumber: '',
    medicalConditions: '',
    address: '',
    profilePhoto: null,
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [familyMemberId, setFamilyMemberId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Get family member ID from AuthContext when component mounts
  useEffect(() => {
    console.log('=== ELDER SIGNUP DEBUG ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('currentUser:', currentUser);
    console.log('loading:', loading);
    console.log('========================');

    if (loading) {
      return; // Wait for auth to load
    }

    // Mark that we've checked authentication
    setAuthChecked(true);

    if (!isAuthenticated || !currentUser) {
      alert('Please login first to register an elder');
      navigate('/login', { replace: true });
      return;
    }

    if (currentUser.role === 'family_member') {
      // Use user_id instead of id for the new User table structure
      console.log('Setting family member ID:', currentUser.user_id);
      setFamilyMemberId(currentUser.user_id);
    } else {
      alert('Only family members can register elders');
      navigate('/login', { replace: true });
    }
  }, [currentUser, isAuthenticated, loading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      profilePhoto: file
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.nicPassport.trim()) newErrors.nicPassport = 'NIC/Passport is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.contactNumber && !phoneRegex.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must be exactly 10 digits';
    }
    
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!familyMemberId) {
      alert('Family member information not found. Please login again.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('email', formData.email);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('gender', formData.gender);
      submitData.append('nicPassport', formData.nicPassport);
      submitData.append('contactNumber', formData.contactNumber);
      submitData.append('medicalConditions', formData.medicalConditions);
      submitData.append('address', formData.address);
      submitData.append('password', formData.password);
      submitData.append('confirmPassword', formData.confirmPassword);
      submitData.append('familyMemberId', familyMemberId);
      
      if (formData.profilePhoto) {
        submitData.append('profilePhoto', formData.profilePhoto);
      }

      console.log('Submitting elder registration with family member ID:', familyMemberId);

      const response = await registerElder(submitData);
      
      if (response.status === 201) {
        alert('Elder registered successfully!');
        navigate('/family-member/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.error) {
        alert(`Registration failed: ${error.response.data.error}`);
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (loading || !authChecked) {
    return (
      <div className={styles.container}>
        <div className={styles.signupCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Loading...</h1>
            <p className={styles.subtitle}>Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !currentUser || currentUser.role !== 'family_member' || !familyMemberId) {
    return (
      <div className={styles.container}>
        <div className={styles.signupCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Access Denied</h1>
            <p className={styles.subtitle}>Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.signupCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Elder Registration</h1>
            <p className={styles.subtitle}>Create an account for elderly care services</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Profile Photo Upload */}
            <div className={styles.photoSection}>
              <div className={styles.photoUpload}>
                <input
                  type="file"
                  id="profilePhoto"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                <label htmlFor="profilePhoto" className={styles.photoLabel}>
                  {formData.profilePhoto ? (
                    <img
                      src={URL.createObjectURL(formData.profilePhoto)}
                      alt="Profile"
                      className={styles.profilePreview}
                    />
                  ) : (
                    <div className={styles.photoPlaceholder}>
                      <span className={styles.photoIcon}>📷</span>
                      <span>Upload Photo</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Personal Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                  placeholder="Enter full name"
                />
                {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="Enter email address"
                />
                {errors.email && <span className={styles.error}>{errors.email}</span>}
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.dateOfBirth ? styles.inputError : ''}`}
                  />
                  {errors.dateOfBirth && <span className={styles.error}>{errors.dateOfBirth}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`${styles.input} ${styles.select} ${errors.gender ? styles.inputError : ''}`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <span className={styles.error}>{errors.gender}</span>}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>NIC/Passport Number *</label>
                <input
                  type="text"
                  name="nicPassport"
                  value={formData.nicPassport}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.nicPassport ? styles.inputError : ''}`}
                  placeholder="Enter NIC or Passport number"
                />
                {errors.nicPassport && <span className={styles.error}>{errors.nicPassport}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Contact Number *</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.contactNumber ? styles.inputError : ''}`}
                  placeholder="Enter contact number (10 digits)"
                />
                {errors.contactNumber && <span className={styles.error}>{errors.contactNumber}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`${styles.input} ${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                  placeholder="Enter full address"
                  rows="3"
                />
                {errors.address && <span className={styles.error}>{errors.address}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Medical Conditions</label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="List any medical conditions or medications (optional)"
                  rows="3"
                />
              </div>
            </div>

            {/* Security Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Security Information</h3>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Password *</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.inputError : ''}`}
                    placeholder="Enter password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && <span className={styles.error}>{errors.password}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password *</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`${styles.input} ${styles.passwordInput} ${errors.confirmPassword ? styles.inputError : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Submit Button */}
            <div className={styles.buttonSection}>
              <button
                type="button"
                onClick={() => navigate('/family-member/dashboard')}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register Elder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ElderSignup;

