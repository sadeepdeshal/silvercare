import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import CaregiverLayout from '../../components/CaregiverLayout';
import { useAuth } from '../../context/AuthContext';
import { caregiverApi } from '../../services/caregiverApi2';
import styles from "../../components/css/caregiver/profile.module.css";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    availability: '',
    certifications: '',
    fixed_line: '',
    district: '',
    day_rate: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user && user.caregiver_id) {
      fetchProfileData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug effect to log profileData changes
  useEffect(() => {
    console.log('=== PROFILE DATA CHANGED ===');
    console.log('Current profileData:', profileData);
    console.log('Current profileData.availability:', profileData?.availability);
    console.log('Current profileData.day_rate:', profileData?.day_rate);
    console.log('Day rate type:', typeof profileData?.day_rate);
  }, [profileData]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await caregiverApi.getCaregiverById(user.caregiver_id);
      
      console.log('=== FETCHING PROFILE DATA ===');
      console.log('Response:', response);
      console.log('Caregiver data:', response.caregiver);
      console.log('Day rate from API:', response.caregiver?.day_rate);
      
      if (response.success) {
        setProfileData(response.caregiver);
        setEditForm({
          name: response.caregiver.caregiver_name || '',
          email: response.caregiver.caregiver_email || '',
          phone: response.caregiver.caregiver_phone || '',
          availability: response.caregiver.availability || '',
          certifications: response.caregiver.certifications || '',
          fixed_line: response.caregiver.fixed_line || '',
          district: response.caregiver.district || '',
          day_rate: response.caregiver.day_rate || ''
        });
        
        console.log('Set day_rate in editForm:', response.caregiver.day_rate || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original data
    setEditForm({
      name: profileData.caregiver_name || '',
      email: profileData.caregiver_email || '',
      phone: profileData.caregiver_phone || '',
      availability: profileData.availability || '',
      certifications: profileData.certifications || '',
      fixed_line: profileData.fixed_line || '',
      district: profileData.district || '',
      day_rate: profileData.day_rate || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      // Convert day_rate to number or null
      const dayRateValue = editForm.day_rate === '' || editForm.day_rate === null || editForm.day_rate === undefined 
        ? null 
        : Number(editForm.day_rate);
      
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        availability: editForm.availability,
        certifications: editForm.certifications,
        fixed_line: editForm.fixed_line,
        district: editForm.district,
        day_rate: dayRateValue
      };
      
      console.log('=== SAVING PROFILE ===');
      console.log('Update data being sent:', updateData);
      console.log('Day rate value:', dayRateValue);
      console.log('Day rate type:', typeof dayRateValue);
      console.log('Original editForm.day_rate:', editForm.day_rate);
      
      const response = await caregiverApi.updateCaregiverProfile(user.caregiver_id, updateData);
      
      console.log('=== UPDATE RESPONSE ===');
      console.log('Full response object:', JSON.stringify(response, null, 2));
      console.log('Response.success:', response.success);
      console.log('Response.caregiver:', response.caregiver);
      console.log('Response.caregiver.day_rate:', response.caregiver?.day_rate);
      console.log('Type of day_rate:', typeof response.caregiver?.day_rate);
      
      if (response.success) {
        console.log('=== UPDATING STATE WITH RESPONSE ===');
        console.log('Response caregiver object:', response.caregiver);
        console.log('Availability from response:', response.caregiver.availability);
        console.log('Day rate from response:', response.caregiver.day_rate);
        
        // Update profileData with response
        setProfileData(response.caregiver);
        
        // Update editForm with response data
        const newEditForm = {
          name: response.caregiver.caregiver_name || '',
          email: response.caregiver.caregiver_email || '',
          phone: response.caregiver.caregiver_phone || '',
          availability: response.caregiver.availability || '',
          certifications: response.caregiver.certifications || '',
          fixed_line: response.caregiver.fixed_line || '',
          district: response.caregiver.district || '',
          day_rate: response.caregiver.day_rate || ''
        };
        
        console.log('New editForm values:', newEditForm);
        console.log('New editForm.availability:', newEditForm.availability);
        console.log('New editForm.day_rate:', newEditForm.day_rate);
        
        setEditForm(newEditForm);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        
        // Re-fetch profile data to ensure sync with database
        console.log('Re-fetching profile data to confirm update...');
        await fetchProfileData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = () => {
    setIsChangingPassword(true);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePassword = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      // Validate passwords
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setError('All password fields are required');
        return;
      }
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('New password and confirm password do not match');
        return;
      }
      
      if (passwordForm.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }
      
      const passwordData = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      };
      
      const response = await caregiverApi.updateCaregiverPassword(user.caregiver_id, passwordData);
      
      if (response.success) {
        setIsChangingPassword(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSuccess('Password updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password');
    }
  };

  const handleBack = () => {
    navigate('/caregiver/dashboard');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading profile...</p>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.error}>
            <p>{error}</p>
            <button className={styles.backButton} onClick={handleBack}>
              ← Back to Dashboard
            </button>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={fetchProfileData} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CaregiverLayout>
        <div className={styles.container}>
          <button className={styles.backButton} onClick={handleBack}>
            ← Back to Dashboard
          </button>
          <div className={styles.header}>
            <h1>My Profile</h1>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className={styles.successMessage}>
              ✅ {success}
            </div>
          )}
          
          {error && (
            <div className={styles.errorMessage}>
              ❌ {error}
            </div>
          )}

          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarSection}>
                <div className={styles.avatar}>
                  {profileData?.caregiver_name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className={styles.userInfo}>
                  <h2>{profileData?.caregiver_name}</h2>
                  <p className={styles.role}>Professional Caregiver</p>
                  <div className={`${styles.statusBadge} ${styles[profileData?.availability]}`}>
                    {profileData?.availability}
                  </div>
                </div>
              </div>
              <div className={styles.actions}>
                {!isEditing ? (
                  <button onClick={handleEditClick} className={styles.editButton}>
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button onClick={handleSaveProfile} className={styles.saveButton}>
                      ✓ Save
                    </button>
                    <button onClick={handleCancelEdit} className={styles.cancelButton}>
                      ✕ Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.profileContent}>
              <div className={styles.section}>
                <h3>Personal Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{profileData?.caregiver_name}</span>
                    )}
                  </div>
                  <div className={styles.infoItem}>
                    <label>Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{profileData?.caregiver_email}</span>
                    )}
                  </div>
                  <div className={styles.infoItem}>
                    <label>Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{profileData?.caregiver_phone}</span>
                    )}
                  </div>
                  <div className={styles.infoItem}>
                    <label>Fixed Line</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="fixed_line"
                        value={editForm.fixed_line}
                        onChange={handleInputChange}
                        className={styles.input}
                      />
                    ) : (
                      <span>{profileData?.fixed_line || 'Not provided'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Professional Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>District</label>
                    {isEditing ? (
                      <select
                        name="district"
                        value={editForm.district}
                        onChange={handleInputChange}
                        className={styles.select}
                      >
                        <option value="">Select District</option>
                        <option value="Colombo">Colombo</option>
                        <option value="Kandy">Kandy</option>
                        <option value="Galle">Galle</option>
                        <option value="Jaffna">Jaffna</option>
                        <option value="Anuradhapura">Anuradhapura</option>
                        <option value="Polonnaruwa">Polonnaruwa</option>
                        <option value="Matara">Matara</option>
                        <option value="Hambantota">Hambantota</option>
                        <option value="Badulla">Badulla</option>
                        <option value="Monaragala">Monaragala</option>
                        <option value="Ratnapura">Ratnapura</option>
                        <option value="Kegalle">Kegalle</option>
                        <option value="Kurunegala">Kurunegala</option>
                        <option value="Puttalam">Puttalam</option>
                        <option value="Kalutara">Kalutara</option>
                        <option value="Gampaha">Gampaha</option>
                        <option value="Nuwara Eliya">Nuwara Eliya</option>
                        <option value="Matale">Matale</option>
                        <option value="Ampara">Ampara</option>
                        <option value="Batticaloa">Batticaloa</option>
                        <option value="Trincomalee">Trincomalee</option>
                        <option value="Mullaitivu">Mullaitivu</option>
                        <option value="Vavuniya">Vavuniya</option>
                        <option value="Mannar">Mannar</option>
                        <option value="Kilinochchi">Kilinochchi</option>
                      </select>
                    ) : (
                      <span>{profileData?.district}</span>
                    )}
                  </div>
                  <div className={styles.infoItem}>
                    <label>Availability Status</label>
                    {isEditing ? (
                      <select
                        name="availability"
                        value={editForm.availability}
                        onChange={handleInputChange}
                        className={styles.select}
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    ) : (
                      <span className={`${styles.statusText} ${styles[profileData?.availability]}`}>
                        {profileData?.availability}
                      </span>
                    )}
                  </div>
                  <div className={styles.infoItem}>
                    <label>Member Since</label>
                    <span>{new Date(profileData?.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Day Rate</label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="day_rate"
                        value={editForm.day_rate}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Enter day rate in Rs."
                        min="0"
                      />
                    ) : (
                      <span>
                        {profileData?.day_rate !== null && profileData?.day_rate !== undefined && profileData?.day_rate !== ''
                          ? `Rs. ${profileData.day_rate}` 
                          : 'Not set'}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.certificationsSection}>
                  <label>Certifications & Qualifications</label>
                  {isEditing ? (
                    <textarea
                      name="certifications"
                      value={editForm.certifications}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      rows={4}
                      placeholder="List your certifications, qualifications, and experience..."
                    />
                  ) : (
                    <div className={styles.certifications}>
                      {profileData?.certifications || 'No certifications listed'}
                    </div>
                  )}
                </div>
              </div>

              {/* Security Section */}
              <div className={styles.section}>
                <h3>Security Settings</h3>
                {!isChangingPassword ? (
                  <div className={styles.securityActions}>
                    <button 
                      onClick={handleChangePassword}
                      className={styles.actionButton}
                    >
                      🔒 Change Password
                    </button>
                    <p className={styles.securityNote}>
                      Keep your account secure by updating your password regularly
                    </p>
                  </div>
                ) : (
                  <div className={styles.passwordSection}>
                    <div className={styles.passwordGrid}>
                      <div className={styles.infoItem}>
                        <label>Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordInputChange}
                          className={styles.input}
                          placeholder="Enter your current password"
                        />
                      </div>
                      <div className={styles.infoItem}>
                        <label>New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordInputChange}
                          className={styles.input}
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>
                      <div className={styles.infoItem}>
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordInputChange}
                          className={styles.input}
                          placeholder="Confirm your new password"
                        />
                      </div>
                    </div>
                    <div className={styles.passwordActions}>
                      <button 
                        onClick={handleSavePassword}
                        className={styles.saveButton}
                      >
                        ✓ Update Password
                      </button>
                      <button 
                        onClick={handleCancelPasswordChange}
                        className={styles.cancelButton}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/*<div className={styles.section}>
                <h3>Account Actions</h3>
                <div className={styles.actionsGrid}>
                  <button 
                    onClick={() => navigate('/caregiver/dashboard')}
                    className={styles.actionButton}
                  >
                    📊 Go to Dashboard
                  </button>
                  <button 
                    onClick={() => navigate('/caregiver/care-requests')}
                    className={styles.actionButton}
                  >
                    📋 View Care Requests
                  </button>
                  <button 
                    onClick={handleLogout}
                    className={`${styles.actionButton} ${styles.logoutButton}`}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>*/}
            </div>
          </div>
        </div>
      </CaregiverLayout>
    </>
  );
};

export default Profile;
