import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import DoctorSidebar from '../../components/doctor_sidebar';
import { getImageSrc, handleImageError } from '../../utils/imageUtils';
import styles from '../../components/css/doctor/dashboard.module.css';

const API_BASE = "http://localhost:5000";

const DoctorPatients = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('silvercare_token');
  const [dashboardData, setDashboardData] = useState({
    todaysAppointments: [],
    upcomingAppointments: [],
    nextAppointment: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  // Extract unique elders from appointments (same logic as dashboard)
  const getUniqueElders = () => {
    const eldersMap = {};
    [
      ...(dashboardData.todaysAppointments || []),
      ...(dashboardData.upcomingAppointments || []),
      ...(dashboardData.nextAppointment ? [dashboardData.nextAppointment] : [])
    ].forEach(app => {
      if (app && app.elder_id && !eldersMap[app.elder_id]) {
        eldersMap[app.elder_id] = {
          id: app.elder_id,
          name: app.elder_name,
          dob: app.elder_dob,
          gender: app.elder_gender,
          contact: app.elder_contact,
          address: app.elder_address,
          medical_conditions: app.medical_conditions,
          avatar: app.elder_avatar,
          appointment: app,
          // Get latest appointment for this elder
          latestAppointment: app,
          // Count appointments for this elder
          appointmentCount: [
            ...(dashboardData.todaysAppointments || []),
            ...(dashboardData.upcomingAppointments || [])
          ].filter(a => a.elder_id === app.elder_id).length
        };
      }
    });
    return Object.values(eldersMap);
  };

  // Fetch with token
  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
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
    const loadPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentUser?.user_id || !token) {
          setError("Not authenticated. Please log in again.");
          setLoading(false);
          return;
        }

        // Get doctor ID
        const doctorData = await fetchWithAuth(`${API_BASE}/api/doctor/user/${currentUser.user_id}`);
        if (!doctorData?.doctor?.doctor_id) {
          setError("Doctor not found for this user.");
          setLoading(false);
          return;
        }
        const doctorId = doctorData.doctor.doctor_id;

        // Get dashboard data to extract patient information
        const dashboard = await fetchWithAuth(`${API_BASE}/api/doctor/${doctorId}/dashboard`);
        if (!dashboard?.data) {
          setError("No patient data available.");
          setLoading(false);
          return;
        }
        setDashboardData(dashboard.data);
      } catch (err) {
        setError(err.message || "Failed to load patient data.");
      } finally {
        setLoading(false);
      }
    };
    loadPatientData();
  }, [currentUser, token]);

  const elders = getUniqueElders();

  // Filter patients based on search term
  const filteredPatients = elders.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.contact && patient.contact.includes(searchTerm)) ||
    (patient.medical_conditions && patient.medical_conditions.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading Patients...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
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
    <div className={styles.dashboardContainer}>
      <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
        <Navbar />
        
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.welcomeCard}>
            <div className={styles.welcomeContent}>
              <h1 className={styles.welcomeTitle}>👥 Patient List</h1>
              <p className={styles.welcomeSubtitle}>
                Manage and view information about your patients
              </p>
              <div className={styles.userInfo}>
                <span className={styles.userEmail}>👨‍⚕️ Dr. {currentUser.name}</span>
                <span className={styles.userRole}>📊 {elders.length} total patients</span>
              </div>
            </div>
            <div className={styles.welcomeImage}>
              <div className={styles.avatarPlaceholder}>
                <span className={styles.avatarIcon}>👥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className={styles.mainContentSection}>
          <div className={styles.fullWidthContainer}>
            <div className={styles.contentCard}>
              <div className={styles.searchSection}>
                <h2 className={styles.sectionTitle}>🔍 Search Patients</h2>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search by name, contact, or medical condition..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                  <div className={styles.searchResults}>
                    {searchTerm && (
                      <span className={styles.resultCount}>
                        {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Patients List */}
              <h2 className={styles.sectionTitle}>👥 My Patients</h2>
              {filteredPatients.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>👥</div>
                  <h3>{searchTerm ? 'No Patients Found' : 'No Patients'}</h3>
                  <p>
                    {searchTerm 
                      ? 'No patients match your search criteria. Try a different search term.'
                      : 'You have no patients with appointments yet. Patients will appear here once they book appointments with you.'
                    }
                  </p>
                </div>
              ) : (
                <div className={styles.patientsList}>
                  {filteredPatients.map((patient, index) => (
                    <div key={patient.id} className={styles.patientCard}>
                      {/* Patient Header */}
                      <div className={styles.patientHeader}>
                        <img 
                          src={getImageSrc(patient.avatar, 'elder', patient.gender)} 
                          alt={patient.name} 
                          className={styles.patientAvatar} 
                          onError={(e) => handleImageError(e, 'elder', patient.gender)}
                        />
                        <div className={styles.patientInfo}>
                          <h3 className={styles.patientName}>{patient.name}</h3>
                          <p className={styles.patientDetails}>
                            Age: {calculateAge(patient.dob) || 'N/A'} • {patient.gender || 'N/A'}
                          </p>
                          <p className={styles.patientDetails}>📞 {patient.contact || 'No contact'}</p>
                          <p className={styles.patientDetails}>📍 {patient.address || 'No address'}</p>
                        </div>
                        <div className={styles.patientStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{patient.appointmentCount || 0}</span>
                            <span className={styles.statLabel}>Appointments</span>
                          </div>
                        </div>
                      </div>

                      {/* Medical Conditions */}
                      <div className={styles.patientSummary}>
                        <h4>Medical Conditions:</h4>
                        <p className={styles.medicalConditions}>
                          {patient.medical_conditions || 'No conditions recorded'}
                        </p>
                      </div>

                      {/* Latest Appointment Info */}
                      {patient.latestAppointment && (
                        <div className={styles.latestAppointment}>
                          <h4>Latest Appointment:</h4>
                          <div className={styles.appointmentDetails}>
                            <span className={styles.appointmentDate}>
                              📅 {formatDate(patient.latestAppointment.date_time)} at {formatTime(patient.latestAppointment.date_time)}
                            </span>
                            <span className={styles.appointmentType}>
                              {patient.latestAppointment.appointment_type === 'online' ? '💻 Online' : '🏥 Physical'}
                            </span>
                            <span className={`${styles.appointmentStatus} ${styles['status' + patient.latestAppointment.status.charAt(0).toUpperCase() + patient.latestAppointment.status.slice(1)]}`}>
                              {patient.latestAppointment.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Patient Actions */}
                      <div className={styles.patientActions}>
                        <button className={styles.actionBtn}>
                          📋 View Medical Records
                        </button>
                        <button className={styles.actionBtn}>
                          📅 View Appointments
                        </button>
                        <button className={styles.actionBtn}>
                          💬 Send Message
                        </button>
                        <button className={styles.actionBtn}>
                          📝 Add Notes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;