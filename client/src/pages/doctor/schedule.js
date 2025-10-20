import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import DoctorSidebar from '../../components/doctor_sidebar';
import { getImageSrc, handleImageError } from '../../utils/imageUtils';
import styles from '../../components/css/doctor/dashboard.module.css';

const API_BASE = "http://localhost:5000";

const DoctorSchedule = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('silvercare_token');
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [joinMeetingLoading, setJoinMeetingLoading] = useState({});

  // Helper functions
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
    const loadUpcomingAppointments = async () => {
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

        // Get upcoming appointments
        const upcomingResponse = await fetchWithAuth(`${API_BASE}/api/doctor/${doctorId}/upcoming`);
        setUpcomingAppointments(upcomingResponse.appointments || []);
      } catch (err) {
        setError(err.message || "Failed to load upcoming appointments.");
      } finally {
        setLoading(false);
      }
    };
    loadUpcomingAppointments();
  }, [currentUser, token]);

  // Handle joining a meeting
  const handleJoinMeeting = async (appointment) => {
    const appointmentId = appointment.appointment_id || appointment.id;
    
    try {
      setJoinMeetingLoading(prev => ({ ...prev, [appointmentId]: true }));
      
      if (!appointment.meeting_link) {
        throw new Error('No meeting link available for this appointment');
      }
      
      const meetingUrl = new URL(appointment.meeting_link);
      meetingUrl.searchParams.set('userInfo.displayName', `Dr. ${currentUser.name || 'Doctor'}`);
      meetingUrl.searchParams.set('userInfo.email', currentUser.email || 'doctor@silvercare.com');
      meetingUrl.searchParams.set('config.prejoinPageEnabled', 'false');
      
      window.open(meetingUrl.toString(), '_blank');
    } catch (err) {
      console.error('Error joining meeting:', err);
      alert(err.message || 'Failed to join meeting');
    } finally {
      setJoinMeetingLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  // Group appointments by date
  const groupAppointmentsByDate = (appointments) => {
    const grouped = {};
    appointments.forEach(app => {
      const dateKey = formatDate(app.date_time);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(app);
    });
    
    // Sort appointments within each date by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    });
    
    return grouped;
  };

  const groupedAppointments = groupAppointmentsByDate(upcomingAppointments);

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading Schedule...</h2>
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
              <h1 className={styles.welcomeTitle}>📊 Upcoming Schedule</h1>
              <p className={styles.welcomeSubtitle}>
                Manage your upcoming consultations and appointments
              </p>
              <div className={styles.userInfo}>
                <span className={styles.userEmail}>👨‍⚕️ Dr. {currentUser.name}</span>
                <span className={styles.userRole}>📊 {upcomingAppointments.length} upcoming appointments</span>
              </div>
            </div>
            <div className={styles.welcomeImage}>
              <div className={styles.avatarPlaceholder}>
                <span className={styles.avatarIcon}>📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Consultations Content */}
        <div className={styles.mainContentSection}>
          <div className={styles.fullWidthContainer}>
            <div className={styles.contentCard}>
              <h2 className={styles.sectionTitle}>📊 Upcoming Consultations</h2>
              {upcomingAppointments.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📅</div>
                  <h3>No Upcoming Consultations</h3>
                  <p>Your schedule is clear for now. Take some time to rest!</p>
                </div>
              ) : (
                <div className={styles.consultationsContainer}>
                  {Object.keys(groupedAppointments).map(dateKey => (
                    <div key={dateKey} className={styles.dateGroup}>
                      <h3 className={styles.dateHeader}>
                        📅 {formatFullDate(groupedAppointments[dateKey][0].date_time)}
                      </h3>
                      <div className={styles.consultationsList}>
                        {groupedAppointments[dateKey].map((app, idx) => (
                          <div key={idx} className={styles.consultationItem}>
                            <div className={styles.consultationTime}>
                              <span className={styles.timeLabel}>{formatTime(app.date_time)}</span>
                            </div>
                            
                            <img 
                              src={getImageSrc(app.elder_avatar, 'elder', app.elder_gender)} 
                              alt={app.elder_name} 
                              className={styles.consultationAvatar} 
                              onError={(e) => handleImageError(e, 'elder', app.elder_gender)}
                            />
                            
                            <div className={styles.consultationInfo}>
                              <h4 className={styles.consultationName}>{app.elder_name}</h4>
                              <p className={styles.consultationDetails}>
                                {app.elder_contact} • {app.elder_address}
                              </p>
                              <p className={styles.consultationType}>
                                {app.appointment_type === 'online' ? '💻 Online Consultation' : '🏥 Physical Consultation'}
                              </p>
                              {app.medical_conditions && (
                                <p className={styles.medicalConditions}>
                                  🏥 {app.medical_conditions}
                                </p>
                              )}
                              <p className={styles.consultationStatus}>
                                Status: <span className={`${styles.statusBadge} ${styles['status' + app.status.charAt(0).toUpperCase() + app.status.slice(1)]}`}>
                                  {app.status.toUpperCase()}
                                </span>
                              </p>
                            </div>
                            
                            <div className={styles.consultationActions}>
                              <button className={styles.consultationBtn}>
                                📋 View Record
                              </button>
                              {app.appointment_type === 'online' && app.status === 'confirmed' ? (
                                <button 
                                  className={`${styles.consultationBtn} ${styles.joinMeetingBtn}`}
                                  onClick={() => handleJoinMeeting(app)}
                                  disabled={joinMeetingLoading[app.appointment_id || app.id]}
                                >
                                  {joinMeetingLoading[app.appointment_id || app.id] ? (
                                    <>
                                      <div className={styles.loadingSpinner}></div>
                                      Joining...
                                    </>
                                  ) : (
                                    <>🎥 Join Meeting</>
                                  )}
                                </button>
                              ) : (
                                <button 
                                  className={styles.consultationBtn}
                                  disabled={app.appointment_type !== 'online' || app.status !== 'confirmed'}
                                >
                                  {app.appointment_type === 'online' ? '🎥 Join Meeting' : '🏥 Physical Appointment'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
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

export default DoctorSchedule;