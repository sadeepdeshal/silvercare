import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/familymember/elder-details.module.css';

const ElderDetails = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { elderId } = useParams();
  
  const [elder, setElder] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    nic_passport: '',
    contact_number: '',
    medical_conditions: '',
    address: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  // Protect the route
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (currentUser.role !== 'family_member') {
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate]);

  // Fetch elder details
  useEffect(() => {
    const fetchElderDetails = async () => {
      if (!elderId) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await elderApi.getElderById(elderId);
        
        if (response.success) {
          setElder(response.elder);
          setFormData({
            full_name: response.elder.full_name || '',
            date_of_birth: response.elder.date_of_birth ? response.elder.date_of_birth.split('T')[0] : '',
            gender: response.elder.gender || '',
            nic_passport: response.elder.nic_passport || '',
            contact_number: response.elder.contact_number || '',
            medical_conditions: response.elder.medical_conditions || '',
            address: response.elder.address || '',
            email: response.elder.email || '',
            password: '',
            confirm_password: ''
          });
        } else {
          setError('Failed to load elder details');
        }
        
      } catch (err) {
        console.error('Error fetching elder details:', err);
        setError('Failed to load elder details');
      } finally {
        setDataLoading(false);
      }
    };

    fetchElderDetails();
  }, [elderId]);

  // Helper function to construct proper image URL
  const getProfileImageUrl = (profilePhoto) => {
    if (!profilePhoto) return null;
    
    let imagePath = profilePhoto;
    if (imagePath.startsWith('/') || imagePath.startsWith('\\')) {
      imagePath = imagePath.substring(1);
    }
    imagePath = imagePath.replace(/\\/g, '/');
    if (!imagePath.startsWith('uploads/')) {
      imagePath = `uploads/${imagePath}`;
    }
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${baseUrl}/${imagePath}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdateLoading(true);
      setError(null);
      
      const response = await elderApi.updateElder(elderId, formData);
      
      if (response.success) {
        setElder(prev => ({ ...prev, ...response.elder }));
        setIsEditing(false);
        alert('Elder details updated successfully!');
      } else {
        setError(response.error || 'Failed to update elder details');
      }
      
    } catch (err) {
      console.error('Error updating elder:', err);
      setError(err.message || 'Failed to update elder details');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    // Reset form data to original elder data
    if (elder) {
      setFormData({
        full_name: elder.full_name || '',
        date_of_birth: elder.date_of_birth ? elder.date_of_birth.split('T')[0] : '',
        gender: elder.gender || '',
        nic_passport: elder.nic_passport || '',
        contact_number: elder.contact_number || '',
        medical_conditions: elder.medical_conditions || '',
        address: elder.address || '',
        email: elder.email || '',
        password: '',
        confirm_password: ''
      });
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !currentUser || currentUser.role !== 'family_member') {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      
      <div className={styles.content}>
        {/* Header Section */}
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/family-member/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Elder Details</h1>
            <p className={styles.subtitle}>
              {isEditing ? 'Edit elder information' : 'View and manage elder information'}
            </p>
          </div>
          {!isEditing && (
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
            >
              <span className={styles.editIcon}>✏️</span>
              Edit Details
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Content Section */}
        {dataLoading ? (
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading elder details...</p>
          </div>
        ) : !elder ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>❌</div>
            <h2>Elder Not Found</h2>
            <p>The elder you're looking for doesn't exist or you don't have permission to view it.</p>
            <button 
              className={styles.backToDashboard}
              onClick={() => navigate('/family-member/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className={styles.elderDetailsContainer}>
            {/* Profile Section */}
            <div className={styles.profileSection}>
              <div className={styles.profileImageContainer}>
                <div className={styles.profileImage}>
                  {elder.profile_photo ? (
                    <>
                      <img 
                        src={getProfileImageUrl(elder.profile_photo)} 
                        alt={elder.full_name}
                        className={styles.elderPhoto}
                        onLoad={(e) => {
                          e.target.style.display = 'block';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'none';
                          }
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <div 
                        className={styles.profileInitial}
                        style={{ display: 'flex' }}
                      >
                        {elder.full_name.charAt(0).toUpperCase()}
                      </div>
                    </>
                  ) : (
                    <div className={styles.profileInitial}>
                      {elder.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.profileInfo}>
                  <h2 className={styles.elderName}>{elder.full_name}</h2>
                  <p className={styles.elderRole}>Elder • {elder.gender}</p>
                  <p className={styles.elderAge}>
                    {new Date().getFullYear() - new Date(elder.date_of_birth).getFullYear()} years old
                  </p>
                </div>
              </div>
            </div>

            {/* Details Form/Display */}
            {isEditing ? (
              <form onSubmit={handleUpdateSubmit} className={styles.editForm}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date of Birth *</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={styles.formSelect}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>NIC/Passport *</label>
                    <input
                      type="text"
                      name="nic_passport"
                      value={formData.nic_passport}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Contact Number *</label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit phone number"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Medical Conditions</label>
                    <textarea
                      name="medical_conditions"
                      value={formData.medical_conditions}
                      onChange={handleInputChange}
                      className={styles.formTextarea}
                      rows="3"
                      placeholder="Enter any medical conditions or leave blank if none"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={styles.formTextarea}
                      rows="3"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>New Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancelEdit}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className={styles.saveButton}
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.detailsDisplay}>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailCard}>
                    <div className={styles.detailHeader}>
                      <span className={styles.detailIcon}>👤</span>
                      <h3 className={styles.detailTitle}>Personal Information</h3>
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Full Name:</span>
                        <span className={styles.detailValue}>{elder.full_name}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Date of Birth:</span>
                        <span className={styles.detailValue}>
                          {new Date(elder.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Gender:</span>
                        <span className={styles.detailValue}>{elder.gender}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Age:</span>
                        <span className={styles.detailValue}>
                          {new Date().getFullYear() - new Date(elder.date_of_birth).getFullYear()} years
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailCard}>
                    <div className={styles.detailHeader}>
                      <span className={styles.detailIcon}>📞</span>
                      <h3 className={styles.detailTitle}>Contact Information</h3>
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Phone Number:</span>
                        <span className={styles.detailValue}>{elder.contact_number}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Email:</span>
                        <span className={styles.detailValue}>{elder.email}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Address:</span>
                        <span className={styles.detailValue}>
                          {elder.address || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailCard}>
                    <div className={styles.detailHeader}>
                      <span className={styles.detailIcon}>🆔</span>
                      <h3 className={styles.detailTitle}>Identification</h3>
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>NIC/Passport:</span>
                        <span className={styles.detailValue}>{elder.nic_passport}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Registration Date:</span>
                        <span className={styles.detailValue}>
                          {new Date(elder.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {elder.updated_at && elder.updated_at !== elder.created_at && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Last Updated:</span>
                          <span className={styles.detailValue}>
                            {new Date(elder.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.detailCard}>
                    <div className={styles.detailHeader}>
                      <span className={styles.detailIcon}>🏥</span>
                      <h3 className={styles.detailTitle}>Medical Information</h3>
                    </div>
                    <div className={styles.detailContent}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Medical Conditions:</span>
                        <span className={styles.detailValue}>
                          {elder.medical_conditions || 'None reported'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.actionButton}
                    onClick={() => navigate(`/family-member/elder/${elder.id}/appointments`)}
                  >
                    <span className={styles.buttonIcon}>📅</span>
                    Book Appointment
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={() => navigate(`/family-member/elder/${elder.id}/reports`)}
                  >
                                        <span className={styles.buttonIcon}>📊</span>
                    View Reports
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={() => navigate(`/family-member/elder/${elder.id}/caregivers`)}
                  >
                    <span className={styles.buttonIcon}>👩‍⚕️</span>
                    Manage Caregivers
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElderDetails;

