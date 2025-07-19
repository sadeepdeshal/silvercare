import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import { getElderDetailsByEmail, updateElderProfile } from '../../services/elderApi2';
import styles from '../../components/css/elder/profile.module.css';

const ElderProfile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [elderDetails, setElderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    contact: '',
    address: '',
    nic: '',
    medical_conditions: '',
    district: ''
  });
  
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Sri Lankan districts
  const districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
  ];

  useEffect(() => {
    const fetchElderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getElderDetailsByEmail(currentUser.email);
        setElderDetails(response.data);
        
        // Initialize form data
        const data = response.data;
        setFormData({
          name: data.name || '',
          dob: data.dob ? data.dob.split('T')[0] : '',
          gender: data.gender || '',
          contact: data.contact || '',
          address: data.address || '',
          nic: data.nic || '',
          medical_conditions: data.medical_conditions || '',
          district: data.district || ''
        });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append profile photo if selected
      if (profilePhoto) {
        formDataToSend.append('profile_photo', profilePhoto);
      }

      const response = await updateElderProfile(elderDetails.elder_id, formDataToSend);
      
      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        
        // Refresh elder details
        const updatedResponse = await getElderDetailsByEmail(currentUser.email);
        setElderDetails(updatedResponse.data);
        
        // Reset photo states
        setProfilePhoto(null);
        setPreviewImage(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfilePhoto(null);
    setPreviewImage(null);
    setError(null);
    setSuccessMessage('');
    
    // Reset form data to original values
    const data = elderDetails;
    setFormData({
      name: data.name || '',
      dob: data.dob ? data.dob.split('T')[0] : '',
      gender: data.gender || '',
      contact: data.contact || '',
      address: data.address || '',
      nic: data.nic || '',
      medical_conditions: data.medical_conditions || '',
      district: data.district || ''
    });
  };

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
        {/* Success Message */}
        {successMessage && (
          <div className={styles.successMessage}>
            ✅ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            ❌ {error}
          </div>
        )}

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
              disabled={saving}
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
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className={styles.profileImage}
                />
              ) : elderDetails?.profile_photo ? (
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
              <div className={styles.photoUploadSection}>
                <input
                  type="file"
                  id="profilePhoto"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profilePhoto" className={styles.changePhotoBtn}>
                  📷 Change Photo
                </label>
              </div>
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
            </div>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.editInput}
                    required
                  />
                ) : (
                  <span>{elderDetails?.name}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label>Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className={styles.editInput}
                    required
                  />
                ) : (
                  <span>{formatDate(elderDetails?.dob)}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label>Gender</label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={styles.editSelect}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <span>{elderDetails?.gender}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label>National ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nic"
                    value={formData.nic}
                    onChange={handleInputChange}
                    className={styles.editInput}
                    placeholder="e.g., 123456789V or 123456789012"
                    required
                  />
                ) : (
                  <span>{elderDetails?.nic}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label>Address</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={styles.editTextarea}
                    rows="3"
                    required
                  />
                ) : (
                  <span>{elderDetails?.address}</span>
                )}
              </div>
              
              <div className={styles.infoItem}>
                <label>District</label>
                {isEditing ? (
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={styles.editSelect}
                    required
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                ) : (
                  <span>{elderDetails?.district}</span>
                )}
              </div>

              <div className={styles.infoItem}>
                <label>Medical Conditions</label>
                {isEditing ? (
                  <textarea
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleInputChange}
                    className={styles.editTextarea}
                    rows="3"
                    placeholder="Describe any medical conditions or leave blank if none"
                  />
                ) : (
                  <span>{elderDetails?.medical_conditions || 'None specified'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <h3>📞 Contact Information</h3>
            </div>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={elderDetails?.email || ''}
                  className={`${styles.editInput} ${styles.disabledInput}`}
                  disabled
                  readOnly
                />
              </div>
              
              <div className={styles.infoItem}>
                <label>Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className={styles.editInput}
                    placeholder="e.g., 0771234567"
                    required
                  />
                ) : (
                  <span>{elderDetails?.contact}</span>
                )}
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

                  {elderDetails.family_member.phone_fixed && (
                    <div className={styles.familyDetail}>
                      <label>Fixed Line</label>
                      <span>{elderDetails.family_member.phone_fixed}</span>
                    </div>
                  )}
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
            <button 
              className={styles.saveBtn}
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Saving...
                </>
              ) : (
                <>
                  💾 Save Changes
                </>
              )}
            </button>
            <button 
              className={styles.cancelBtn}
              onClick={handleCancelEdit}
              disabled={saving}
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
