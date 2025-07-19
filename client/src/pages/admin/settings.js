import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/admin/settings.module.css';

const AdminSettings = () => {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State for different settings sections
  const [settings, setSettings] = useState({
    general: {
      platformName: 'SilverCare',
      platformDescription: 'Elder care management platform',
      supportEmail: 'support@silvercare.lk',
      contactPhone: '+94 11 234 5678',
      maintenanceMode: false,
      registrationEnabled: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      emergencyAlerts: true,
      appointmentReminders: true,
      systemUpdates: true
    },
    security: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireSpecialChars: true,
      twoFactorAuth: false,
      loginAttempts: 5
    },
    appointments: {
      maxAdvanceBooking: 30,
      cancellationDeadline: 24,
      reminderTime: 60,
      autoApproval: false,
      workingHoursStart: '08:00',
      workingHoursEnd: '18:00'
    },
    system: {
      backupFrequency: 'daily',
      logRetention: 90,
      dataExportEnabled: true,
      analyticsEnabled: true,
      debugMode: false
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Protect the settings route
  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated || !currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (currentUser.role !== 'admin') {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate]);

  // Fetch settings data when component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser || currentUser.role !== 'admin') return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        // For now, we'll use default settings since the API might not exist yet
        // const response = await adminApi.getSystemSettings();
        // if (response.success) {
        //   setSettings(response.data);
        // }
        
        // Simulate API call
        setTimeout(() => {
          setDataLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings');
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'admin') {
      fetchSettings();
    }
  }, [currentUser]);

  // Handle settings update
  const handleSettingsUpdate = async (section, key, value) => {
    try {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));

      // Clear any previous messages
      setError(null);
      setSuccessMessage('');
      
      // Here you would call the API to update settings
      // const response = await adminApi.updateSystemSettings(section, key, value);
      // if (response.success) {
      //   setSuccessMessage('Settings updated successfully');
      // }
      
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    }
  };

  // Handle bulk save
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Here you would call the API to save all settings
      // const response = await adminApi.saveSystemSettings(settings);
      // if (response.success) {
      //   setSuccessMessage('All settings saved successfully');
      // }
      
      // Simulate API call
      setTimeout(() => {
        setSaving(false);
        setSuccessMessage('All settings saved successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }, 1000);
      
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
      setSaving(false);
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const renderGeneralSettings = () => (
    <div className={styles.settingsSection}>
      <h3>🏢 General Settings</h3>
      <div className={styles.settingsGrid}>
        <div className={styles.settingItem}>
          <label>Platform Name</label>
          <input
            type="text"
            value={settings.general.platformName}
            onChange={(e) => handleSettingsUpdate('general', 'platformName', e.target.value)}
            className={styles.settingInput}
          />
        </div>
        <div className={styles.settingItem}>
          <label>Platform Description</label>
          <textarea
            value={settings.general.platformDescription}
            onChange={(e) => handleSettingsUpdate('general', 'platformDescription', e.target.value)}
            className={styles.settingTextarea}
            rows="3"
          />
        </div>
        <div className={styles.settingItem}>
          <label>Support Email</label>
          <input
            type="email"
            value={settings.general.supportEmail}
            onChange={(e) => handleSettingsUpdate('general', 'supportEmail', e.target.value)}
            className={styles.settingInput}
          />
        </div>
        <div className={styles.settingItem}>
          <label>Contact Phone</label>
          <input
            type="tel"
            value={settings.general.contactPhone}
            onChange={(e) => handleSettingsUpdate('general', 'contactPhone', e.target.value)}
            className={styles.settingInput}
          />
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.general.maintenanceMode}
              onChange={(e) => handleSettingsUpdate('general', 'maintenanceMode', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Maintenance Mode</span>
          </label>
          <p className={styles.settingDescription}>Enable to put the platform in maintenance mode</p>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.general.registrationEnabled}
              onChange={(e) => handleSettingsUpdate('general', 'registrationEnabled', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Registration Enabled</span>
          </label>
          <p className={styles.settingDescription}>Allow new user registrations</p>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className={styles.settingsSection}>
      <h3>🔔 Notification Settings</h3>
      <div className={styles.settingsGrid}>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.notifications.emailNotifications}
              onChange={(e) => handleSettingsUpdate('notifications', 'emailNotifications', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Email Notifications</span>
          </label>
          <p className={styles.settingDescription}>Send notifications via email</p>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.notifications.smsNotifications}
              onChange={(e) => handleSettingsUpdate('notifications', 'smsNotifications', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>SMS Notifications</span>
          </label>
          <p className={styles.settingDescription}>Send notifications via SMS</p>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.notifications.emergencyAlerts}
              onChange={(e) => handleSettingsUpdate('notifications', 'emergencyAlerts', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Emergency Alerts</span>
          </label>
          <p className={styles.settingDescription}>Enable emergency alert notifications</p>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.notifications.appointmentReminders}
              onChange={(e) => handleSettingsUpdate('notifications', 'appointmentReminders', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Appointment Reminders</span>
          </label>
          <p className={styles.settingDescription}>Send appointment reminder notifications</p>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.notifications.systemUpdates}
              onChange={(e) => handleSettingsUpdate('notifications', 'systemUpdates', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>System Updates</span>
          </label>
          <p className={styles.settingDescription}>Notify users about system updates</p>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className={styles.settingsSection}>
      <h3>🔒 Security Settings</h3>
      <div className={styles.settingsGrid}>
        <div className={styles.settingItem}>
          <label>Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => handleSettingsUpdate('security', 'sessionTimeout', parseInt(e.target.value))}
            className={styles.settingInput}
            min="5"
            max="120"
          />
        </div>
        <div className={styles.settingItem}>
          <label>Password Minimum Length</label>
          <input
            type="number"
            value={settings.security.passwordMinLength}
            onChange={(e) => handleSettingsUpdate('security', 'passwordMinLength', parseInt(e.target.value))}
            className={styles.settingInput}
            min="6"
            max="20"
          />
        </div>
        <div className={styles.settingItem}>
          <label>Maximum Login Attempts</label>
          <input
            type="number"
            value={settings.security.loginAttempts}
            onChange={(e) => handleSettingsUpdate('security', 'loginAttempts', parseInt(e.target.value))}
            className={styles.settingInput}
            min="3"
            max="10"
          />
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.security.requireSpecialChars}
              onChange={(e) => handleSettingsUpdate('security', 'requireSpecialChars', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Require Special Characters in Passwords</span>
          </label>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.security.twoFactorAuth}
              onChange={(e) => handleSettingsUpdate('security', 'twoFactorAuth', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Two-Factor Authentication</span>
          </label>
          <p className={styles.settingDescription}>Require 2FA for admin accounts</p>
        </div>
      </div>
    </div>
  );

  const renderAppointmentSettings = () => (
    <div className={styles.settingsSection}>
      <h3>📅 Appointment Settings</h3>
      <div className={styles.settingsGrid}>
        <div className={styles.settingItem}>
          <label>Maximum Advance Booking (days)</label>
          <input
            type="number"
            value={settings.appointments.maxAdvanceBooking}
            onChange={(e) => handleSettingsUpdate('appointments', 'maxAdvanceBooking', parseInt(e.target.value))}
            className={styles.settingInput}
            min="1"
            max="90"
          />
        </div>
        <div className={styles.settingItem}>
          <label>Cancellation Deadline (hours)</label>
          <input
            type="number"
            value={settings.appointments.cancellationDeadline}
            onChange={(e) => handleSettingsUpdate('appointments', 'cancellationDeadline', parseInt(e.target.value))}
            className={styles.settingInput}
            min="1"
            max="72"
          />
        </div>
        <div className={styles.settingItem}>
          <label>Reminder Time (minutes before)</label>
          <input
            type="number"
            value={settings.appointments.reminderTime}
            onChange={(e) => handleSettingsUpdate('appointments', 'reminderTime', parseInt(e.target.value))}
            className={styles.settingInput}
            min="15"
            max="1440"
          />
        </div>
        <div className={styles.settingItem}>
          <label>Working Hours Start</label>
          <input
            type="time"
            value={settings.appointments.workingHoursStart}
            onChange={(e) => handleSettingsUpdate('appointments', 'workingHoursStart', e.target.value)}
            className={styles.settingInput}
          />
        </div>
        <div className={styles.settingItem}>
          <label>Working Hours End</label>
          <input
            type="time"
            value={settings.appointments.workingHoursEnd}
            onChange={(e) => handleSettingsUpdate('appointments', 'workingHoursEnd', e.target.value)}
            className={styles.settingInput}
          />
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.appointments.autoApproval}
              onChange={(e) => handleSettingsUpdate('appointments', 'autoApproval', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Auto-approve Appointments</span>
          </label>
          <p className={styles.settingDescription}>Automatically approve new appointments</p>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className={styles.settingsSection}>
      <h3>⚙️ System Settings</h3>
      <div className={styles.settingsGrid}>
        <div className={styles.settingItem}>
          <label>Backup Frequency</label>
          <select
            value={settings.system.backupFrequency}
            onChange={(e) => handleSettingsUpdate('system', 'backupFrequency', e.target.value)}
            className={styles.settingSelect}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className={styles.settingItem}>
          <label>Log Retention (days)</label>
          <input
            type="number"
            value={settings.system.logRetention}
            onChange={(e) => handleSettingsUpdate('system', 'logRetention', parseInt(e.target.value))}
            className={styles.settingInput}
            min="7"
            max="365"
          />
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.system.dataExportEnabled}
              onChange={(e) => handleSettingsUpdate('system', 'dataExportEnabled', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Data Export Enabled</span>
          </label>
          <p className={styles.settingDescription}>Allow users to export their data</p>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.system.analyticsEnabled}
              onChange={(e) => handleSettingsUpdate('system', 'analyticsEnabled', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Analytics Enabled</span>
          </label>
          <p className={styles.settingDescription}>Enable system analytics and tracking</p>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings.system.debugMode}
              onChange={(e) => handleSettingsUpdate('system', 'debugMode', e.target.checked)}
              className={styles.settingCheckbox}
            />
            <span>Debug Mode</span>
          </label>
          <p className={styles.settingDescription}>Enable debug mode for troubleshooting</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.settingsContainer}>
      <Navbar />
      
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <button className={styles.backButton} onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>⚙️ System Settings</h1>
            <p className={styles.pageSubtitle}>Configure platform settings and preferences</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.saveButton}
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '💾 Save All Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.errorMessage}>
          <p>⚠️ {error}</p>
        </div>
      )}

      {successMessage && (
        <div className={styles.successMessage}>
          <p>✅ {successMessage}</p>
        </div>
      )}

      {/* Loading State */}
      {dataLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <h2>Loading Settings...</h2>
          <p>Please wait while we fetch the system settings...</p>
        </div>
      ) : (
        <>
          {/* Settings Navigation Tabs */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabsWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'general' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('general')}
              >
                🏢 General
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'notifications' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                🔔 Notifications
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'security' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('security')}
              >
                🔒 Security
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'appointments' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                📅 Appointments
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'system' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('system')}
              >
                ⚙️ System
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className={styles.settingsContent}>
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'appointments' && renderAppointmentSettings()}
            {activeTab === 'system' && renderSystemSettings()}
          </div>

          {/* Footer Actions */}
          <div className={styles.footerActions}>
            <div className={styles.footerContent}>
              <div className={styles.footerInfo}>
                <p>💡 Changes are saved automatically. Click "Save All Settings" to persist all changes.</p>
                <p>⚠️ Some settings may require a system restart to take effect.</p>
              </div>
              <div className={styles.footerButtons}>
                <button 
                  className={styles.resetButton}
                  onClick={() => window.location.reload()}
                >
                  🔄 Reset Changes
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={handleSaveSettings}
                  disabled={saving}
                >
                  {saving ? '💾 Saving...' : '💾 Save All Settings'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSettings;