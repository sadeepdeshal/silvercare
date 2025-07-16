import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import { getElderDetailsByEmail } from '../../services/elderApi2';
import styles from '../../components/css/elder/profile.module.css';

const ElderProfile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [elderDetails, setElderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchElderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getElderDetailsByEmail(currentUser.email);
        setElderDetails(response.data);
      } catch (error) {
        console.error("Error fetching elder details:", error);
        setError(
          error.response?.data?.error || "Failed to fetch elder details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.email) {
      fetchElderDetails();
    }
  }, [currentUser.email]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (dob) => {
    if (!dob) return "N/A";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleBackToDashboard = () => {
    navigate('/elder/dashboard');
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        <Navbar />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryBtn}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <Navbar />
      
      <div className={styles.profileContent}>
        {/* Header Section */}
        <div className={styles.profileHeader}>
          <button 
            className={styles.backBtn}
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>
          
          <div className={styles.headerContent}>
            <h1>My Profile</h1>
            <p>Manage your personal information and settings</p>
          </div>

          <div className={styles.headerActions}>
            <button 
              className={styles.editBtn}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button 
              className={styles.logoutBtn}
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className={styles.profileCard}>
          {/* Profile Image Section */}
          <div className={styles.profileImageSection}>
            <div className={styles.imageContainer}>
              {elderDetails?.profile_photo ? (
                <img
                  src={`http://localhost:5000/uploads/profiles/${elderDetails.profile_photo}`}
                  alt="Profile"
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profilePlaceholder}>
                  <span>{elderDetails?.name?.charAt(0) || "E"}</span>
                </div>
                              )}
              <div className={styles.statusIndicator}></div>
            </div>
            
            {isEditing && (
              <button className={styles.changePhotoBtn}>
                📷 Change Photo
              </button>
            )}
          </div>

          {/* Profile Information */}
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>
              <h2>{elderDetails?.name}</h2>
              <span className={styles.roleTag}>Elder</span>
            </div>
            
            <div className={styles.profileMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Age</span>
                <span className={styles.metaValue}>{getAge(elderDetails?.dob)} years</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Gender</span>
                <span className={styles.metaValue}>{elderDetails?.gender}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Member Since</span>
                <span className={styles.metaValue}>{formatDate(elderDetails?.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Sections */}
        <div className={styles.infoSections}>
          {/* Personal Information */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <h3>📋 Personal Information</h3>
              {isEditing && (
                <button className={styles.sectionEditBtn}>Edit</button>
              )}
            </div>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Full Name</label>
                <span>{elderDetails?.name}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Date of Birth</label>
                <span>{formatDate(elderDetails?.dob)}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Gender</label>
                <span>{elderDetails?.gender}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>National ID</label>
                <span>{elderDetails?.nic}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Address</label>
                <span>{elderDetails?.address}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>District</label>
                <span>{elderDetails?.district}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <h3>📞 Contact Information</h3>
              {isEditing && (
                <button className={styles.sectionEditBtn}>Edit</button>
              )}
            </div>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Email Address</label>
                <span>{elderDetails?.email}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Phone Number</label>
                <span>{elderDetails?.contact}</span>
              </div>
              
              <div className={styles.infoItem}>
                <label>Emergency Contact</label>
                <span>{elderDetails?.emergency_contact || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Family Information */}
          {elderDetails?.family_member && (
            <div className={styles.infoSection}>
              <div className={styles.sectionHeader}>
                <h3>👨‍👩‍👧‍👦 Family Information</h3>
              </div>
              
              <div className={styles.familyCard}>
                <div className={styles.familyInfo}>
                  <div className={styles.familyDetail}>
                    <label>Family Contact Person</label>
                    <span>{elderDetails.family_member.name}</span>
                  </div>
                  
                  <div className={styles.familyDetail}>
                    <label>Email</label>
                    <span>{elderDetails.family_member.email}</span>
                  </div>
                  
                  <div className={styles.familyDetail}>
                    <label>Phone</label>
                    <span>{elderDetails.family_member.phone}</span>
                  </div>
                  
                  <div className={styles.familyDetail}>
                    <label>Family ID</label>
                    <span>{elderDetails?.family_id}</span>
                  </div>
                </div>
                
                <div className={styles.familyActions}>
                  <button className={styles.contactBtn}>
                    📞 Call
                  </button>
                  <button className={styles.messageBtn}>
                    💬 Message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Medical Information */}
          {elderDetails?.medical_conditions && (
            <div className={styles.infoSection}>
              <div className={styles.sectionHeader}>
                <h3>🏥 Medical Information</h3>
                {isEditing && (
                  <button className={styles.sectionEditBtn}>Edit</button>
                )}
              </div>
              
              <div className={styles.medicalInfo}>
                <div className={styles.medicalConditions}>
                  <label>Medical Conditions</label>
                  <div className={styles.conditionsContent}>
                    <p>{elderDetails.medical_conditions}</p>
                  </div>
                </div>
                
                <div className={styles.medicalStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Blood Type</span>
                    <span className={styles.statValue}>Not specified</span>
                  </div>
                  
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Allergies</span>
                    <span className={styles.statValue}>Not specified</span>
                  </div>
                  
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Emergency Medicine</span>
                    <span className={styles.statValue}>Not specified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <h3>⚙️ Account Settings</h3>
            </div>
            
            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Notifications</span>
                  <span className={styles.settingDesc}>Receive email and SMS notifications</span>
                </div>
                <button className={styles.toggleBtn}>Enabled</button>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Privacy</span>
                  <span className={styles.settingDesc}>Control who can see your information</span>
                </div>
                <button className={styles.toggleBtn}>Private</button>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Emergency Alerts</span>
                  <span className={styles.settingDesc}>Automatic emergency notifications</span>
                </div>
                <button className={styles.toggleBtn}>Enabled</button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className={styles.actionButtons}>
            <button className={styles.saveBtn}>
              💾 Save Changes
            </button>
            <button 
              className={styles.cancelBtn}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElderProfile;

