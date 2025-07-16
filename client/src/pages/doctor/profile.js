import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import DoctorSidebar from '../../components/doctor_sidebar';
import styles from '../../components/css/doctor/profile.module.css';

const API_BASE = "http://localhost:5000";

const DoctorProfile = () => {
  const { currentUser } = useAuth();
  const token = localStorage.getItem('silvercare_token');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [profileData, setProfileData] = useState({
    // User data
    name: '',
    email: '',
    phone: '',
    // Doctor specific data
    specialization: '',
    license_number: '',
    alternative_number: '',
    current_institution: '',
    proof: '',
    years_experience: '',
    status: '',
    district: '',
    created_at: ''
  });

  const [editForm, setEditForm] = useState({});

  // Fetch with token
  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Request failed');
    }
    return response.json();
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentUser?.user_id || !token) {
          setError("Not authenticated. Please log in again.");
          setLoading(false);
          return;
        }

        // Get doctor profile data
        const doctorData = await fetchWithAuth(`${API_BASE}/api/doctor/user/${currentUser.user_id}`);
        
        if (doctorData?.doctor) {
          const doctor = doctorData.doctor;
          setProfileData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            specialization: doctor.specialization || '',
            license_number: doctor.license_number || '',
            alternative_number: doctor.alternative_number || '',
            current_institution: doctor.current_institution || '',
            proof: doctor.proof || '',
            years_experience: doctor.years_experience || '',
            status: doctor.status || '',
            district: doctor.district || '',
            created_at: doctor.created_at || ''
          });
          setEditForm({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            specialization: doctor.specialization || '',
            license_number: doctor.license_number || '',
            alternative_number: doctor.alternative_number || '',
            current_institution: doctor.current_institution || '',
            years_experience: doctor.years_experience || '',
            district: doctor.district || ''
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      setError(null);
      setSuccessMessage('');

      // Update doctor profile
      const response = await fetchWithAuth(`${API_BASE}/api/doctor/user/${currentUser.user_id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });

      if (response.success) {
        setProfileData(prev => ({
          ...prev,
          ...editForm
        }));
        setIsEditing(false);
        setSuccessMessage(response.message || 'Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to update profile.');
      }
    } catch (err) {
      // Handle HTML error responses
      if (err.message && err.message.includes('<!DOCTYPE')) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || "Failed to update profile.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      specialization: profileData.specialization,
      license_number: profileData.license_number,
      alternative_number: profileData.alternative_number,
      current_institution: profileData.current_institution,
      years_experience: profileData.years_experience,
      district: profileData.district
    });
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'approved': { color: '#27ae60', bg: '#d5f4e6', text: 'Approved' },
      'pending': { color: '#f39c12', bg: '#fef9e7', text: 'Pending' },
      'rejected': { color: '#e74c3c', bg: '#fdf2f2', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span 
        className={styles.statusBadge}
        style={{ 
          color: config.color, 
          backgroundColor: config.bg,
          border: `1px solid ${config.color}30`
        }}
      >
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading Profile...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.errorContainer}>
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryBtn}>
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
        <Navbar />
        
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                <span className={styles.avatarIcon}>👨‍⚕️</span>
              </div>
              <div className={styles.avatarInfo}>
                <h1 className={styles.doctorName}>Dr. {profileData.name}</h1>
                <p className={styles.specialization}>{profileData.specialization}</p>
                <p className={styles.institution}>{profileData.current_institution}</p>
                {getStatusBadge(profileData.status)}
              </div>
            </div>
            
            <div className={styles.headerActions}>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className={styles.editBtn}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className={styles.editActions}>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className={styles.saveBtn}
                  >
                    {saveLoading ? '💾 Saving...' : '💾 Save Changes'}
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className={styles.cancelBtn}
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>✅</span>
            {successMessage}
          </div>
        )}

        {/* Profile Content */}
        <div className={styles.profileContent}>
          {/* Personal Information */}
          <div className={styles.profileSection}>
            <h2 className={styles.sectionTitle}>👤 Personal Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className={styles.editInput}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.name}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    className={styles.editInput}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.email}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className={styles.editInput}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.phone}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Alternative Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="alternative_number"
                    value={editForm.alternative_number}
                    onChange={handleInputChange}
                    className={styles.editInput}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.alternative_number || 'N/A'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className={styles.profileSection}>
            <h2 className={styles.sectionTitle}>🩺 Professional Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Specialization</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="specialization"
                    value={editForm.specialization}
                    onChange={handleInputChange}
                    className={styles.editInput}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.specialization}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>License Number</label>
                <span className={styles.infoValue}>{profileData.license_number || 'N/A'}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Current Institution</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="current_institution"
                    value={editForm.current_institution}
                    onChange={handleInputChange}
                    className={styles.editInput}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.current_institution}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Years of Experience</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="years_experience"
                    value={editForm.years_experience}
                    onChange={handleInputChange}
                    className={styles.editInput}
                    min="0"
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.years_experience} years</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>District</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="district"
                    value={editForm.district}
                    onChange={handleInputChange}
                    className={styles.editInput}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.district}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Account Status</label>
                {getStatusBadge(profileData.status)}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className={styles.profileSection}>
            <h2 className={styles.sectionTitle}>🔐 Account Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Registration Date</label>
                <span className={styles.infoValue}>{formatDate(profileData.created_at)}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Account Type</label>
                <span className={styles.infoValue}>Medical Professional</span>
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>User ID</label>
                <span className={styles.infoValue}>{currentUser?.user_id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
