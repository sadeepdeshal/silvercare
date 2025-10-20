import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import HealthProfessionalSidebar from '../../components/HealthProfessionalSidebar';
import WelcomeModal from '../../components/WelcomeModal';
import OnboardingTour from '../../components/OnboardingTour';
import OnlineMeetingInterface from '../../components/OnlineMeetingInterface';
import { getImageSrc, handleImageError } from '../../utils/imageUtils';
import styles from '../../components/css/doctor/dashboard.module.css';

const API_BASE = "http://localhost:5000";

const HealthProfessionalDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
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
  
  // Onboarding tour state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Meeting state
  const [joinMeetingLoading, setJoinMeetingLoading] = useState({});
  const [joinedMeetings, setJoinedMeetings] = useState({});
  const [meetingLinks, setMeetingLinks] = useState({});

  // Tour steps configuration
  const tourSteps = [
    {
      target: '[data-tour="header"]',
      title: 'Welcome to Your Dashboard',
      content: 'This is your personalized counseling dashboard where you can manage your mental health practice efficiently.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="stats"]',
      title: 'Quick Statistics',
      content: 'Get an instant overview of your daily activities and patient load.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="next-patient"]',
      title: 'Next Patient Details',
      content: 'View comprehensive information about your next scheduled patient.',
      placement: 'right'
    },
    {
      target: '[data-tour="tasks"]',
      title: 'Today\'s Tasks',
      content: 'Stay organized with your daily counseling tasks and reminders.',
      placement: 'left'
    },
    {
      target: '[data-tour="consultations"]',
      title: 'Upcoming Sessions',
      content: 'Manage your counseling session schedule and patient appointments.',
      placement: 'right'
    },
    {
      target: '[data-tour="schedule"]',
      title: 'Today\'s Schedule',
      content: 'View your complete daily schedule at a glance.',
      placement: 'left'
    },
    {
      target: '[data-tour="quick-actions"]',
      title: 'Quick Actions',
      content: 'Access frequently used counseling tools and features instantly.',
      placement: 'top'
    }
  ];

  // Check if user is new and should see onboarding
  useEffect(() => {
    if (currentUser && !loading && !error) {
      const tourKey = `counselor_tour_${currentUser.user_id}`;
      const hasSeenTour = localStorage.getItem(tourKey);
      
      if (!hasSeenTour || hasSeenTour !== 'completed') {
        setShowWelcomeModal(true);
      }
    }
  }, [currentUser, loading, error]);

  // Tour control functions
  const startTour = () => {
    setShowWelcomeModal(false);
    setShowTour(true);
  };

  const skipTour = () => {
    setShowWelcomeModal(false);
    setShowTour(false);
    localStorage.setItem(`counselor_tour_${currentUser?.user_id}`, 'completed');
  };

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem(`counselor_tour_${currentUser?.user_id}`, 'completed');
  };

  const restartTour = () => {
    localStorage.removeItem(`counselor_tour_${currentUser?.user_id}`);
    setShowWelcomeModal(true);
  };

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

        if (!currentUser?.user_id || !token) {
          setError("Not authenticated. Please log in again.");
          setLoading(false);
          return;
        }

        // Get counselor ID from healthprofessional endpoint
        const counselorData = await fetchWithAuth(`${API_BASE}/api/healthprofessional/user/${currentUser.user_id}`);
        if (!counselorData?.healthprofessional) {
          setError("Health professional profile not found.");
          setLoading(false);
          return;
        }
        
        // For now, use user_id as counselor_id until we get the proper counselor record
        const counselorId = counselorData.healthprofessional.counselor_id || currentUser.user_id;

        // Try to get dashboard data - if endpoint exists
        try {
          const dashboard = await fetchWithAuth(`${API_BASE}/api/healthprofessional/${counselorId}/dashboard`);
          console.log('Dashboard API response:', dashboard);
          if (dashboard?.data) {
            console.log('Dashboard data received:', dashboard.data);
            console.log('Upcoming appointments count:', dashboard.data.upcomingAppointments?.length);
            console.log('Upcoming appointments:', dashboard.data.upcomingAppointments);
            setDashboardData(dashboard.data);
          }
        } catch (dashErr) {
          console.log('Dashboard endpoint error:', dashErr);
          // Continue with empty dashboard data
        }
      } catch (err) {
        if (err.message && err.message.startsWith('<!DOCTYPE')) {
          setError("API endpoint not found or backend not running.");
        } else if (err.message.includes('404')) {
          setError("Health professional profile not set up. Please contact admin.");
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

  // Example tasks
  const tasks = [
    { id: 1, title: "Review today's appointments", time: "08:00 AM" },
    { id: 2, title: "Check treatment plans", time: "10:00 AM" },
    { id: 3, title: "Resource review", time: "03:00 PM" },
  ];

  // Handle joining a meeting
  const handleJoinMeeting = async (appointment) => {
    const appointmentId = appointment.appointment_id || appointment.id;
    
    try {
      setJoinMeetingLoading(prev => ({ ...prev, [appointmentId]: true }));
      
      if (!appointment.meeting_link) {
        throw new Error('No meeting link available for this appointment');
      }
      
      // Get counselor information for the meeting
      const counselorData = await fetchWithAuth(`${API_BASE}/api/healthprofessional/user/${currentUser.user_id}`);
      if (!counselorData?.healthprofessional) {
        throw new Error("Health professional information not found");
      }
      
      // Create meeting URL with counselor parameters for Jitsi Meet
      const meetingUrl = new URL(appointment.meeting_link);
      meetingUrl.searchParams.set('userInfo.displayName', `Counselor ${currentUser.name || 'Professional'}`);
      meetingUrl.searchParams.set('userInfo.email', currentUser.email || 'counselor@silvercare.com');
      meetingUrl.searchParams.set('config.prejoinPageEnabled', 'false');
      
      // Mark as joined and store the meeting link
      setJoinedMeetings(prev => ({ ...prev, [appointmentId]: true }));
      setMeetingLinks(prev => ({ ...prev, [appointmentId]: meetingUrl.toString() }));
      
      // Open meeting in new tab
      window.open(meetingUrl.toString(), '_blank');
    } catch (err) {
      console.error('Error joining meeting:', err);
      alert(err.message || 'Failed to join meeting');
    } finally {
      setJoinMeetingLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
        <p>Fetching your dashboard data...</p>
      </div>
    );
  }

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
      <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
        <Navbar />
        
        {/* Header Section */}
        <div className={styles.headerSection} data-tour="header">
          <div className={styles.welcomeCard}>
            <div className={styles.welcomeContent}>
              <h1 className={styles.welcomeTitle}>Welcome back, {currentUser.name}!</h1>
              <p className={styles.welcomeSubtitle}>Manage your mental health practice and patient consultations from your dashboard</p>
              <div className={styles.userInfo}>
                <span className={styles.userEmail}>📧 {currentUser.email}</span>
                <span className={styles.userRole}>🧑‍⚕️ {currentUser.role.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            <div className={styles.welcomeImage}>
              <div className={styles.avatarPlaceholder}>
                <span className={styles.avatarIcon}>🧑‍⚕️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className={styles.statsSection} data-tour="stats">
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
            <div className={styles.contentCard} data-tour="next-patient">
              <h2 className={styles.sectionTitle}>🏥 Next Patient</h2>
              {nextPatient ? (
                <div className={styles.nextPatientCard}>
                  <div className={styles.patientHeader}>
                    <img 
                      src={getImageSrc(nextPatient.avatar, 'elder', nextPatient.gender)} 
                      alt={nextPatient.name} 
                      className={styles.patientAvatar} 
                      onError={(e) => handleImageError(e, 'elder', nextPatient.gender)}
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
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleJoinMeeting(nextPatient.appointment)}
                      disabled={nextPatient.appointment?.session_type !== 'online' || nextPatient.appointment?.status !== 'confirmed'}
                    >
                      💬 Join Now
                    </button>
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
            <div className={styles.contentCard} data-tour="tasks">
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
            <div className={styles.contentCard} data-tour="consultations">
              <h2 className={styles.sectionTitle}>📊 Upcoming Sessions</h2>
              {consultations.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📅</div>
                  <h3>No Upcoming Sessions</h3>
                  <p>Your schedule is clear for now.</p>
                </div>
              ) : (
                <div className={styles.consultationsList}>
                  {consultations.map(c => (
                    <div key={c.id + c.date + c.time} className={styles.consultationItem}>
                      <img 
                        src={getImageSrc(c.avatar, 'elder')} 
                        alt={c.name} 
                        className={styles.consultationAvatar} 
                        onError={(e) => handleImageError(e, 'elder')}
                      />
                      <div className={styles.consultationInfo}>
                        <h4 className={styles.consultationName}>{c.name}</h4>
                        <p className={styles.consultationTime}>{c.date} | {c.time}</p>
                      </div>
                      <button className={styles.consultationBtn}>📋 View Record</button>
                      <button 
                        className={styles.consultationBtn} 
                        onClick={() => handleJoinMeeting(c.appointment)}
                        disabled={c.appointment?.session_type !== 'online' || c.appointment?.status !== 'confirmed'}
                      >
                        🎥 Join Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Appointments */}
            <div className={styles.contentCard} data-tour="schedule">
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
                        <p className={styles.appointmentType}>
                          {app.session_type === 'online' ? 'Online Session' : 'In-Person Session'}
                        </p>
                        {app.session_type === 'online' && (
                          <span className={styles.onlineBadge}>💻 Online</span>
                        )}
                      </div>
                      {app.session_type === 'online' && app.status === 'confirmed' ? (
                        <button 
                          className={`${styles.appointmentAction} ${styles.joinMeetingBtn}`}
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
                        <button className={styles.appointmentAction}>View Details</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Online Meetings Section */}
        {(dashboardData.todaysAppointments || []).some(app => 
          app.session_type === 'online' && app.status === 'confirmed'
        ) && (
          <div className={styles.onlineMeetingsSection}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>💻 Online Sessions</h2>
              <div className={styles.meetingsGrid}>
                {(dashboardData.todaysAppointments || [])
                  .filter(app => app.session_type === 'online' && app.status === 'confirmed')
                  .map((appointment, idx) => (
                    <OnlineMeetingInterface
                      key={appointment.appointment_id || appointment.id || idx}
                      appointment={appointment}
                      onJoinMeeting={() => handleJoinMeeting(appointment)}
                      isJoining={joinMeetingLoading[appointment.appointment_id || appointment.id]}
                      hasJoined={joinedMeetings[appointment.appointment_id || appointment.id]}
                      meetingLink={meetingLinks[appointment.appointment_id || appointment.id]}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        <div className={styles.quickActionsSection} data-tour="quick-actions">
          <div className={styles.quickActionsContainer}>
            <h2 className={styles.sectionTitle}>⚡ Quick Actions</h2>
            <div className={styles.quickActionsGrid}>
              <div className={styles.quickActionCard}>
                <div className={styles.quickActionIcon}>📝</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>Create Treatment Plan</h3>
                  <p className={styles.quickActionDescription}>Design new treatment plans for patients</p>
                </div>
              </div>
              
              <div className={styles.quickActionCard} onClick={() => navigate('/healthprofessional/reports')} style={{ cursor: 'pointer' }}>
                <div className={styles.quickActionIcon}>📊</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>View Reports</h3>
                  <p className={styles.quickActionDescription}>Online and In-person session statistics</p>
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
                <div className={styles.quickActionIcon}>📚</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>Resources</h3>
                  <p className={styles.quickActionDescription}>Access mental health resources and guidelines</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Button to restart tour */}
        <button 
          className={styles.helpButton}
          onClick={restartTour}
          title="Take a tour of the dashboard"
        >
          ❓
        </button>

        {/* Onboarding Components */}
        <WelcomeModal 
          isVisible={showWelcomeModal}
          onStartTour={startTour}
          onSkip={skipTour}
          userName={currentUser?.name}
        />
        
        <OnboardingTour 
          steps={tourSteps}
          isActive={showTour}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      </div>
    </div>
  );
};

export default HealthProfessionalDashboard;
