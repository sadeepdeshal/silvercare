import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import styles from '../../components/css/doctor/dashboard.module.css';

const API_BASE = "http://localhost:5000"; // Change if your backend runs elsewhere

const DoctorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const token = localStorage.getItem('silvercare_token');
  const [dashboardData, setDashboardData] = useState({
    todaysAppointments: [],
    upcomingAppointments: [],
    nextAppointment: null,
    counts: {
      todaysAppointments: 0,
      upcomingAppointments: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Wait for auth
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

        // Get dashboard data
        const dashboard = await fetchWithAuth(`${API_BASE}/api/doctor/${doctorId}/dashboard`);
        if (!dashboard?.data) {
          setError("No dashboard data returned.");
          setLoading(false);
          return;
        }
        setDashboardData(dashboard.data);
      } catch (err) {
        // Try to parse error if it's HTML
        if (err.message && err.message.startsWith('<!DOCTYPE')) {
          setError("API endpoint not found or backend not running.");
        } else {
          setError(err.message || "Failed to load dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser, token]);

  // Extract unique elders from appointments
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
          appointment: app
        };
      }
    });
    return Object.values(eldersMap);
  };

  const elders = getUniqueElders();

  // Next patient: from nextAppointment
  const nextPatient = dashboardData.nextAppointment
    ? {
        name: dashboardData.nextAppointment.elder_name,
        dob: dashboardData.nextAppointment.elder_dob,
        gender: dashboardData.nextAppointment.elder_gender,
        contact: dashboardData.nextAppointment.elder_contact,
        address: dashboardData.nextAppointment.elder_address,
        medical_conditions: dashboardData.nextAppointment.medical_conditions,
        avatar: dashboardData.nextAppointment.elder_avatar,
        appointment: dashboardData.nextAppointment
      }
    : null;

  // Upcoming consultations: from upcomingAppointments
  const consultations = (dashboardData.upcomingAppointments || []).map(app => ({
    id: app.elder_id,
    name: app.elder_name,
    date: formatDate(app.date_time),
    time: formatTime(app.date_time),
    avatar: app.elder_avatar,
    appointment: app
  }));

  // Example tasks (replace with real data if available)
  const tasks = [
    { id: 1, title: "Review today's appointments", time: "08:00 AM" },
    { id: 2, title: "Check medication updates", time: "10:00 AM" },
    { id: 3, title: "Family call follow-up", time: "03:00 PM" },
  ];

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
        <p>Fetching your dashboard data...</p>
      </div>
    );
  }

  // Don't render if error
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className={styles.retryBtn}>
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Navbar />
      
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>Welcome back, Dr. {currentUser.name}!</h1>
            <p className={styles.welcomeSubtitle}>Manage your patients and appointments from your medical dashboard</p>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>📧 {currentUser.email}</span>
              <span className={styles.userRole}>👨‍⚕️ {currentUser.role.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          <div className={styles.welcomeImage}>
            <div className={styles.avatarPlaceholder}>
              <span className={styles.avatarIcon}>🩺</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>{dashboardData.counts?.todaysAppointments || 0}</h3>
              <p className={styles.statLabel}>Today's Appointments</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏰</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>{dashboardData.counts?.upcomingAppointments || 0}</h3>
              <p className={styles.statLabel}>Upcoming Appointments</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>{elders.length}</h3>
              <p className={styles.statLabel}>Total Patients</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>{tasks.length}</h3>
              <p className={styles.statLabel}>Today's Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className={styles.mainContentSection}>
        {/* Next Patient & Tasks Section - Left Half */}
        <div className={styles.leftContentContainer}>
          <div className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>🏥 Next Patient</h2>
            {nextPatient ? (
              <div className={styles.nextPatientCard}>
                <div className={styles.patientHeader}>
                  <img 
                    src={nextPatient.avatar || "https://randomuser.me/api/portraits/men/1.jpg"} 
                    alt={nextPatient.name} 
                    className={styles.patientAvatar} 
                  />
                  <div className={styles.patientInfo}>
                    <h3 className={styles.patientName}>{nextPatient.name}</h3>
                    <p className={styles.patientDetails}>Age: {calculateAge(nextPatient.dob) || 'N/A'}</p>
                    <p className={styles.patientDetails}>{nextPatient.address || 'N/A'}</p>
                    {nextPatient.appointment && (
                      <p className={styles.appointmentTime}>
                        📅 {formatDate(nextPatient.appointment.date_time)} at {formatTime(nextPatient.appointment.date_time)}
                      </p>
                    )}
                  </div>
                </div>
                <div className={styles.patientSummary}>
                  <h4>Medical Conditions:</h4>
                  <p>{nextPatient.medical_conditions || 'No conditions recorded'}</p>
                </div>
                <div className={styles.patientActions}>
                  <button className={styles.actionBtn}>📋 View Records</button>
                  <button className={styles.actionBtn}>💬 Start Consultation</button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📅</div>
                <h3>No Next Patient</h3>
                <p>You have no upcoming appointments scheduled.</p>
              </div>
            )}
          </div>

          {/* Today's Tasks */}
          <div className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>✅ Today's Tasks</h2>
            <div className={styles.tasksList}>
              {tasks.map(task => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <span className={styles.taskTime}>{task.time}</span>
                  </div>
                  <button className={styles.taskCompleteBtn}>✓</button>
                </div>
              ))}
            </div>
            <button className={styles.viewAllBtn}>View All Tasks</button>
          </div>
        </div>

        {/* Upcoming Consultations & Calendar Section - Right Half */}
        <div className={styles.rightContentContainer}>
          <div className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>📊 Upcoming Consultations</h2>
            {consultations.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📅</div>
                <h3>No Upcoming Consultations</h3>
                <p>Your schedule is clear for now.</p>
              </div>
            ) : (
              <div className={styles.consultationsList}>
                {consultations.map(c => (
                  <div key={c.id + c.date + c.time} className={styles.consultationItem}>
                    <img 
                      src={c.avatar || "https://randomuser.me/api/portraits/men/2.jpg"} 
                      alt={c.name} 
                      className={styles.consultationAvatar} 
                    />
                    <div className={styles.consultationInfo}>
                      <h4 className={styles.consultationName}>{c.name}</h4>
                      <p className={styles.consultationTime}>{c.date} | {c.time}</p>
                    </div>
                    <button className={styles.consultationBtn}>📋 View Record</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Appointments */}
          <div className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>📅 Today's Schedule</h2>
            <div className={styles.appointmentsList}>
              {(dashboardData.todaysAppointments || []).length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📅</div>
                  <h3>No Appointments Today</h3>
                  <p>You have a free day!</p>
                </div>
              ) : (
                (dashboardData.todaysAppointments || []).map((app, idx) => (
                  <div key={idx} className={styles.appointmentItem}>
                    <div className={styles.appointmentTime}>
                      <span className={styles.timeLabel}>{formatTime(app.date_time)}</span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <h4 className={styles.appointmentPatient}>{app.elder_name}</h4>
                      <p className={styles.appointmentType}>Regular Consultation</p>
                    </div>
                    <button className={styles.appointmentAction}>Join</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className={styles.quickActionsSection}>
        <div className={styles.quickActionsContainer}>
          <h2 className={styles.sectionTitle}>⚡ Quick Actions</h2>
          <div className={styles.quickActionsGrid}>
            <div className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>📝</div>
              <div className={styles.quickActionContent}>
                <h3 className={styles.quickActionTitle}>Write Prescription</h3>
                <p className={styles.quickActionDescription}>Create new prescriptions for patients</p>
              </div>
            </div>
            
            <div className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>📊</div>
              <div className={styles.quickActionContent}>
                <h3 className={styles.quickActionTitle}>View Reports</h3>
                <p className={styles.quickActionDescription}>Check patient reports and analytics</p>
              </div>
            </div>
            
            <div className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>👥</div>
              <div className={styles.quickActionContent}>
                <h3 className={styles.quickActionTitle}>Manage Patients</h3>
                <p className={styles.quickActionDescription}>View and update patient information</p>
              </div>
            </div>
            
            <div className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>📞</div>
              <div className={styles.quickActionContent}>
                <h3 className={styles.quickActionTitle}>Emergency Contacts</h3>
                <p className={styles.quickActionDescription}>Access emergency contact information</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;