import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { elderApi } from '../../services/elderApi';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import styles from '../../components/css/familymember/elder-details.module.css';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';

const ElderDetails = () => {
  const { elderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [elder, setElder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    date_of_birth: '',
    gender: '',
    nic_passport: '',
    contact_number: '',
    medical_conditions: '',
    address: '',
    password: '',
    confirm_password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    fetchElderDetails();
  }, [elderId]);

  const fetchElderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await elderApi.getElderById(elderId);
      
      if (response.success) {
        setElder(response.elder);
        setFormData({
          full_name: response.elder.full_name || '',
          email: response.elder.email || '',
          date_of_birth: response.elder.date_of_birth ? response.elder.date_of_birth.split('T')[0] : '',
          gender: response.elder.gender || '',
          nic_passport: response.elder.nic_passport || '',
          contact_number: response.elder.contact_number || '',
          medical_conditions: response.elder.medical_conditions || '',
          address: response.elder.address || '',
          password: '',
          confirm_password: ''
        });
      } else {
        setError('Failed to fetch elder details');
      }
    } catch (err) {
      console.error('Error fetching elder details:', err);
      setError(err.message || 'Failed to fetch elder details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Required field validation
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      // Age validation
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate >= today) {
        errors.date_of_birth = 'Date of birth must be in the past';
      } else if (age < 50) {
        errors.date_of_birth = 'Elder must be at least 50 years old';
      }
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required';
    }

    if (!formData.nic_passport.trim()) {
      errors.nic_passport = 'NIC/Passport is required';
    }

        if (!formData.contact_number.trim()) {
      errors.contact_number = 'Contact number is required';
    } else {
      // Phone number validation
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.contact_number)) {
        errors.contact_number = 'Contact number must be exactly 10 digits';
      }
    }

    // Password validation (only if password fields are shown and filled)
    if (showPasswordFields) {
      if (formData.password && formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }
      
      if (formData.password !== formData.confirm_password) {
        errors.confirm_password = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Prepare data for submission
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        nic_passport: formData.nic_passport,
        contact_number: formData.contact_number,
        medical_conditions: formData.medical_conditions,
        address: formData.address
      };

      // Only include password if it's provided
      if (showPasswordFields && formData.password) {
        updateData.password = formData.password;
        updateData.confirm_password = formData.confirm_password;
      }

      console.log('Submitting update data:', updateData);

      const response = await elderApi.updateElder(elderId, updateData);
      
      if (response.success) {
        // Update local state with new data
        setElder(response.elder);
        setIsEditing(false);
        setShowPasswordFields(false);
        setFormData(prev => ({
          ...prev,
          password: '',
          confirm_password: ''
        }));
        
        // Show success message
        alert('Elder details updated successfully!');
      } else {
        setError(response.error || 'Failed to update elder details');
      }
    } catch (err) {
      console.error('Error updating elder:', err);
      setError(err.message || 'Failed to update elder details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original elder data
    if (elder) {
      setFormData({
        full_name: elder.full_name || '',
        email: elder.email || '',
        date_of_birth: elder.date_of_birth ? elder.date_of_birth.split('T')[0] : '',
        gender: elder.gender || '',
        nic_passport: elder.nic_passport || '',
        contact_number: elder.contact_number || '',
        medical_conditions: elder.medical_conditions || '',
        address: elder.address || '',
        password: '',
        confirm_password: ''
      });
    }
    setIsEditing(false);
    setShowPasswordFields(false);
    setFormErrors({});
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (dateString) => {
    if (!dateString) return 'Unknown';
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  if (loading) {
    return (
      <div>
        
      
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading elder details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !elder) {
    return (
      <div>
       
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/family-member/elders')} className={styles.backButton}>
              Back to Elders List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <FamilyMemberLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            onClick={() => navigate('/family-member/elders')} 
            className={styles.backButton}
          >
            ← Back to Elders
          </button>
          <h1>Elder Details</h1>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className={styles.editButton}
            >
              Edit Details
            </button>
          )}
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.detailsContainer}>
          {!isEditing ? (
            // View Mode
            <div className={styles.viewMode}>
              <div className={styles.profileSection}>
                <div className={styles.profileHeader}>
                  <div className={styles.profileInfo}>
                    <h2>{elder?.full_name}</h2>
                    <p className={styles.ageInfo}>
                      Age: {calculateAge(elder?.date_of_birth)} years old
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <h3>Personal Information</h3>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Full Name:</span>
                    <span className={styles.value}>{elder?.full_name || 'Not provided'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>{elder?.email || 'Not provided'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Date of Birth:</span>
                    <span className={styles.value}>{formatDate(elder?.date_of_birth)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Gender:</span>
                    <span className={styles.value}>{elder?.gender || 'Not provided'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>NIC/Passport:</span>
                    <span className={styles.value}>{elder?.nic_passport || 'Not provided'}</span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <h3>Contact Information</h3>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Contact Number:</span>
                    <span className={styles.value}>{elder?.contact_number || 'Not provided'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Address:</span>
                    <span className={styles.value}>{elder?.address || 'Not provided'}</span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <h3>Medical Information</h3>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Medical Conditions:</span>
                    <span className={styles.value}>
                      {elder?.medical_conditions || 'No medical conditions recorded'}
                    </span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <h3>Account Information</h3>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Registration Date:</span>
                    <span className={styles.value}>{formatDate(elder?.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className={styles.editMode}>
              <form onSubmit={handleSubmit} className={styles.editForm}>
                <div className={styles.formGrid}>
                  <div className={styles.formSection}>
                    <h3>Personal Information</h3>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${formErrors.full_name ? styles.error : ''}`}
                        placeholder="Enter full name"
                      />
                      {formErrors.full_name && (
                        <span className={styles.errorText}>{formErrors.full_name}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${formErrors.email ? styles.error : ''}`}
                        placeholder="Enter email address"
                      />
                      {formErrors.email && (
                        <span className={styles.errorText}>{formErrors.email}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Date of Birth *</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${formErrors.date_of_birth ? styles.error : ''}`}
                      />
                      {formErrors.date_of_birth && (
                        <span className={styles.errorText}>{formErrors.date_of_birth}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Gender *</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${formErrors.gender ? styles.error : ''}`}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {formErrors.gender && (
                        <span className={styles.errorText}>{formErrors.gender}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>NIC/Passport *</label>
                      <input
                        type="text"
                        name="nic_passport"
                        value={formData.nic_passport}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${formErrors.nic_passport ? styles.error : ''}`}
                        placeholder="Enter NIC or Passport number"
                      />
                      {formErrors.nic_passport && (
                        <span className={styles.errorText}>{formErrors.nic_passport}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h3>Contact Information</h3>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Contact Number *</label>
                      <input
                        type="tel"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${formErrors.contact_number ? styles.error : ''}`}
                        placeholder="Enter 10-digit contact number"
                        maxLength="10"
                      />
                      {formErrors.contact_number && (
                        <span className={styles.errorText}>{formErrors.contact_number}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={styles.formTextarea}
                        placeholder="Enter address"
                        rows="3"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Medical Conditions</label>
                      <textarea
                        name="medical_conditions"
                        value={formData.medical_conditions}
                        onChange={handleInputChange}
                        className={styles.formTextarea}
                        placeholder="Enter any medical conditions or leave blank if none"
                        rows="4"
                      />
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h3>Account Security</h3>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={showPasswordFields}
                          onChange={(e) => setShowPasswordFields(e.target.checked)}
                        />
                        Update Password
                      </label>
                    </div>

                    {showPasswordFields && (
                      <>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>New Password</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`${styles.formInput} ${formErrors.password ? styles.error : ''}`}
                            placeholder="Enter new password (min 6 characters)"
                          />
                          {formErrors.password && (
                                                        <span className={styles.errorText}>{formErrors.password}</span>
                          )}
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Confirm New Password</label>
                          <input
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleInputChange}
                            className={`${styles.formInput} ${formErrors.confirm_password ? styles.error : ''}`}
                            placeholder="Confirm new password"
                          />
                          {formErrors.confirm_password && (
                            <span className={styles.errorText}>{formErrors.confirm_password}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={styles.cancelButton}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default ElderDetails;


