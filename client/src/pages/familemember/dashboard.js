import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import { caregiverApi } from '../../services/caregiverApi';
import { familyMemberApi } from '../../services/familyMemberApi';
import Navbar from '../../components/navbar';
import { getImageSrc, handleImageError } from '../../utils/imageUtils';
import styles from '../../components/css/familymember/dashboard.module.css';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';

const FamilyMemberDashboard = () => {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [elderCount, setElderCount] = useState(0);
  const [elders, setElders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [activeCaregiverCount, setActiveCaregiverCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [caregiversLoading, setCaregiversLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [upcomingCareVisits, setUpcomingCareVisits] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [careVisitsLoading, setCareVisitsLoading] = useState(true);

  // Protect the dashboard route
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

  // Fetch elders data when component mounts
  useEffect(() => {
    const fetchEldersData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        // Fetch both elder count and elders list using user_id (which will be converted to family_id in the backend)
        const [countResponse, eldersResponse] = await Promise.all([
          elderApi.getElderCount(currentUser.user_id),
          elderApi.getEldersByFamilyMember(currentUser.user_id)
        ]);
        
        if (countResponse.success) {
          setElderCount(countResponse.count);
        }
        
        if (eldersResponse.success) {
          setElders(eldersResponse.elders);
        }
        
      } catch (err) {
        console.error('Error fetching elders data:', err);
        setError('Failed to load elders data');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchEldersData();
    }
  }, [currentUser]);

  // Fetch caregivers data
  useEffect(() => {
    const fetchCaregiversData = async () => {
      try {
        setCaregiversLoading(true);
        
        // Fetch active caregiver count
        const countResponse = await caregiverApi.getActiveCaregiverCount();
        
        if (countResponse.success) {
          setActiveCaregiverCount(countResponse.count);
        }
        
      } catch (err) {
        console.error('Error fetching caregivers data:', err);
        // Don't set error for caregivers as it's not critical
      } finally {
        setCaregiversLoading(false);
      }
    };

    fetchCaregiversData();
  }, []);

  // Fetch appointments data - UPDATED TO USE REAL API
  useEffect(() => {
    const fetchAppointmentsData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setAppointmentsLoading(true);
        
        // Fetch real upcoming appointments from the database
        const [appointmentsResponse, countResponse] = await Promise.all([
          elderApi.getUpcomingAppointmentsByFamily(currentUser.user_id),
          elderApi.getAppointmentCountByFamily(currentUser.user_id)
        ]);
        
        if (appointmentsResponse.success) {
          setAppointments(appointmentsResponse.appointments);
        }
        
        if (countResponse.success) {
          setAppointmentCount(countResponse.count);
        }
        
      } catch (err) {
        console.error('Error fetching appointments data:', err);
        // Set fallback data if API fails
        setAppointments([]);
        setAppointmentCount(0);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchAppointmentsData();
    }
  }, [currentUser]);

  // Fetch upcoming sessions data
  useEffect(() => {
    const fetchSessionsData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setSessionsLoading(true);
        
        const sessionsResponse = await familyMemberApi.getUpcomingSessions(currentUser.user_id);
        
        if (sessionsResponse.success) {
          setUpcomingSessions(sessionsResponse.sessions || []);
        }
        
      } catch (err) {
        console.error('Error fetching sessions data:', err);
        setUpcomingSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchSessionsData();
    }
  }, [currentUser]);

  // Fetch upcoming care visits data
  useEffect(() => {
    const fetchCareVisitsData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setCareVisitsLoading(true);
        
        const careVisitsResponse = await familyMemberApi.getUpcomingCareVisits(currentUser.user_id);
        
        if (careVisitsResponse.success) {
          setUpcomingCareVisits(careVisitsResponse.careVisits || []);
        }
        
      } catch (err) {
        console.error('Error fetching care visits data:', err);
        setUpcomingCareVisits([]);
      } finally {
        setCareVisitsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchCareVisitsData();
    }
  }, [currentUser]);

  const handleElderRegistration = () => {
    navigate('/family-member/elder-signup');
  };

  const handleViewElders = () => {
    navigate('/family-member/elders');
  };

  const handleMentalSessions = () => {
    navigate('/family-member/sessions');
  };

  const handleBookAppointment = () => {
    navigate('/family-member/elders');
  };

  const handleViewReports = () => {
    navigate('/family-member/reports');
  };

  const handleElderDetails = (elderId) => {
    navigate(`/family-member/elder/${elderId}`);
  };

  const handleViewAllAppointments = () => {
    navigate('/family-member/appointments'); // This will now navigate to the new appointments page
  };

  const handleAppointmentDetails = (appointmentId) => {
    navigate(`/family-member/appointment/${appointmentId}`);
  };

  const formatAppointmentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f39c12'; // Orange
      case 'approved':
      case 'confirmed':
        return '#27ae60'; // Green
      case 'cancelled':
        return '#e74c3c'; // Red
      case 'completed':
        return '#3498db'; // Blue
      default:
        return '#95a5a6'; // Gray
    }
  };

  const getAppointmentTypeIcon = (type) => {
    switch (type) {
      case 'online':
        return '💻';
      case 'physical':
        return '🏥';
      default:
        return '🩺';
    }
  };

  // Using shared image utility function

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
  if (!isAuthenticated || !currentUser || currentUser.role !== 'family_member') {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <FamilyMemberLayout>

        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.welcomeCard}>
            <div className={styles.welcomeContent}>
              <h1 className={styles.welcomeTitle}>Welcome, {currentUser.name}!</h1>
              <p className={styles.welcomeSubtitle}>Manage your elderly care services from your dashboard</p>
              <div className={styles.userInfo}>
                <span className={styles.userEmail}>📧 {currentUser.email}</span>
                <span className={styles.userRole}>👤 {currentUser.role.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            <div className={styles.welcomeImage}>
              <div className={styles.avatarPlaceholder}>
                <span className={styles.avatarIcon}>👤</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>
                  {dataLoading ? '...' : elderCount}
                </h3>
                <p className={styles.statLabel}>Registered Elders</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>
                  {appointmentsLoading ? '...' : appointmentCount}
                </h3>
                <p className={styles.statLabel}>Upcoming Appointments</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏥</div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>
                  {caregiversLoading ? '...' : activeCaregiverCount}
                </h3>
                <p className={styles.statLabel}>Active Caregivers</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>12</h3>
                <p className={styles.statLabel}>Health Reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Main Content Section - Quick Actions and Recent Activity Side by Side */}
        <div className={styles.mainContentSection}>
          {/* Quick Actions Section - Left Half */}
          <div className={styles.quickActionsContainer}>
            <div className={styles.quickActionsCard}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
              <div className={styles.quickActionsGrid}>
                <div className={styles.quickActionCard} onClick={handleElderRegistration}>
                  <div className={styles.quickActionIcon}>➕</div>
                  <div className={styles.quickActionContent}>
                    <h3 className={styles.quickActionTitle}>Register New Elder</h3>
                    <p className={styles.quickActionDescription}>Add a new elderly person to your care network</p>
                  </div>
                </div>

                <div className={styles.quickActionCard} onClick={handleBookAppointment}>
                  <div className={styles.quickActionIcon}>👥</div>
                  <div className={styles.quickActionContent}>
                    <h3 className={styles.quickActionTitle}>Book Appointment</h3>
                    <p className={styles.quickActionDescription}>
                      Manage {elderCount} registered elder{elderCount !== 1 ? 's' : ''}
                    </p>
                    <p className={styles.quickActionDescription}>Schedule medical appointments and care services</p>
                  </div>
                </div>

                <div className={styles.quickActionCard} onClick={handleMentalSessions}>
                  <div className={styles.quickActionIcon}>📅</div>
                  <div className={styles.quickActionContent}>
                    <h3 className={styles.quickActionTitle}>Book mental sessions</h3>
                    <p className={styles.quickActionDescription}>Schedule mental sessions and care services</p>
                  </div>
                </div>

                <div className={styles.quickActionCard} onClick={handleViewReports}>
                  <div className={styles.quickActionIcon}>📊</div>
                  <div className={styles.quickActionContent}>
                    <h3 className={styles.quickActionTitle}> Reports</h3>
                    <p className={styles.quickActionDescription}>View elders appointment statics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Section - Right Half */}
          <div className={styles.recentActivityContainer}>
            <div className={styles.activityCard}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
              <div className={styles.activityList}>
                {dataLoading ? (
                  <div className={styles.activityItem}>
                    <div className={styles.activityIcon}>⏳</div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>Loading recent activity...</p>
                    </div>
                  </div>
                ) : elders.length > 0 ? (
                  <>
                    {elders.slice(0, 3).map((elder, index) => (
                      <div key={elder.elder_id} className={styles.activityItem}>
                        <div className={styles.activityIcon}>👤</div>
                        <div className={styles.activityContent}>
                          <p className={styles.activityText}>
                            Elder {elder.name} registered successfully
                          </p>
                          <span className={styles.activityTime}>
                            {new Date(elder.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 0 && (
                      <div className={styles.activityItem}>
                        <div className={styles.activityIcon}>📅</div>
                        <div className={styles.activityContent}>
                          <p className={styles.activityText}>
                            Appointment scheduled with {appointments[0].doctor_name}
                          </p>
                          <span className={styles.activityTime}>
                            {new Date(appointments[0].created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                                      </>
                ) : (
                  <div className={styles.activityItem}>
                    <div className={styles.activityIcon}>📝</div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>No elders registered yet. Click "Register New Elder" to get started.</p>
                      <span className={styles.activityTime}>Welcome to SilverCare</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid Section - Elders and Appointments Side by Side */}
        <div className={styles.sectionsContainer}>
          {/* Registered Elders Section - Left Half */}
          {elders.length > 0 && (
            <div className={styles.appointmentsSection}>
              <div className={styles.appointmentsHeader}>
                <h2>Your Registered Elders</h2>
                <div className={styles.appointmentTabs}>
                  <button className={`${styles.tabBtn} ${styles.activeTab}`}>
                    Registered
                    {elderCount > 0 && (
                      <span className={styles.countBadge}>
                        {elderCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              <div className={styles.appointmentsContent}>
                {dataLoading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading elders...</p>
                  </div>
                ) : (
                  <div className={styles.appointmentsGrid}>
                    {/* Limit to only 2 elders */}
                    {elders.slice(0, 2).map((elder, index) => {
                      const imageUrl = getImageSrc(elder.profile_photo, 'elder', elder.gender);
                      
                      return (
                        <div 
                          key={elder.elder_id} 
                          className={styles.appointmentCard}
                          onClick={() => handleElderDetails(elder.elder_id)}
                        >
                          <div className={styles.cardHeader}>
                            <div className={styles.doctorInfo}>
                              <div className={styles.doctorAvatar}>
                                {elder.profile_photo ? (
                                  <img 
                                    src={imageUrl}
                                    alt={elder.name}
                                    className={styles.elderProfilePhoto}
                                    onError={(e) => {
                                      handleImageError(e, 'elder', elder.gender);
                                    }}
                                  />
                                ) : (
                                  <span className={styles.elderInitial}>
                                    {elder.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className={styles.doctorDetails}>
                                <h3>{elder.name}</h3>
                                <p className={styles.specialization}>Elder</p>
                                <p className={styles.institution}>Age: {new Date().getFullYear() - new Date(elder.dob).getFullYear()}</p>
                              </div>
                            </div>
                            <div className={styles.statusContainer}>
                              <span className={styles.statusUpcoming}>
                                ACTIVE
                              </span>
                            </div>
                          </div>
                          
                          <div className={styles.appointmentDetails}>
                            <div className={styles.appointmentMeta}>
                              <div className={styles.dateTimeGroup}>
                                <div className={styles.dateInfo}>
                                  <span className={styles.dateText}>
                                    {elder.gender}
                                  </span>
                                </div>
                                <div className={styles.timeInfo}>
                                  <span className={styles.timeText}>
                                    {new Date(elder.dob).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className={styles.typeIndicator}>
                                <span className={styles.physicalChip}>
                                  👤 Elder
                                </span>
                              </div>
                            </div>
                            
                            <div className={styles.careDetails}>
                              <div className={styles.careInfo}>
                                <span>📞 {elder.contact}</span>
                                {elder.medical_conditions && (
                                  <span>🏥 {elder.medical_conditions.substring(0, 40)}{elder.medical_conditions.length > 40 ? '...' : ''}</span>
                                )}
                                <span>📅 Registered: {new Date(elder.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={styles.cardActions}>
                            <button 
                              className={styles.joinBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleElderDetails(elder.elder_id);
                              }}
                            >
                              👁️ View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {elders.length > 2 && (
                <div className={styles.showAllContainer}>
                  <button 
                    className={styles.showAllBtn}
                    onClick={handleViewElders}
                  >
                    Show All Elders
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Appointments Section - Right Half */}
          <div className={styles.appointmentsSection}>
            <div className={styles.appointmentsHeader}>
              <h2>Upcoming Appointments</h2>
              <div className={styles.appointmentTabs}>
                <button className={`${styles.tabBtn} ${styles.activeTab}`}>
                  Upcoming
                  {appointmentCount > 0 && (
                    <span className={styles.countBadge}>
                      {appointmentCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            <div className={styles.appointmentsContent}>
              {appointmentsLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading appointments...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className={styles.noAppointments}>
                  <div className={styles.noAppointmentsIcon}>📅</div>
                  <h3>No Upcoming Appointments</h3>
                  <p>
                    No upcoming appointments scheduled for your elders.
                    Book an appointment to get started with elder care services.
                  </p>
                </div>
              ) : (
                <div className={styles.appointmentsGrid}>
                  {/* Limit to only 2 appointments */}
                  {appointments.slice(0, 2).map((appointment, index) => (
                    <div 
                      key={appointment.appointment_id} 
                      className={styles.appointmentCard}
                      onClick={() => handleAppointmentDetails(appointment.appointment_id)}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.doctorInfo}>
                          <div className={styles.doctorAvatar}>
                            {getAppointmentTypeIcon(appointment.appointment_type)}
                          </div>
                          <div className={styles.doctorDetails}>
                            <h3>{appointment.doctor_name}</h3>
                            <p className={styles.specialization}>{appointment.specialization || 'Medical'}</p>
                            <p className={styles.institution}>For: {appointment.elder_name}</p>
                          </div>
                        </div>
                        <div className={styles.statusContainer}>
                          <span className={`${styles.statusUpcoming} ${styles['status' + appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)]}`}>
                            {appointment.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className={styles.appointmentDetails}>
                        <div className={styles.appointmentMeta}>
                          <div className={styles.dateTimeGroup}>
                            <div className={styles.dateInfo}>
                              <span className={styles.dateText}>
                                {new Date(appointment.date_time).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className={styles.timeInfo}>
                              <span className={styles.timeText}>
                                {new Date(appointment.date_time).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          <div className={styles.typeIndicator}>
                            <span className={`${styles.typeChip} ${appointment.appointment_type === 'online' ? styles.onlineChip : styles.physicalChip}`}>
                              {appointment.appointment_type === 'online' ? '💻 Online' : '🏥 Physical'}
                            </span>
                          </div>
                        </div>
                        
                        {appointment.notes && (
                          <div className={styles.appointmentNotes}>
                            <p>📝 {appointment.notes}</p>
                          </div>
                        )}
                        
                        <div className={styles.careDetails}>
                          <div className={styles.careInfo}>
                            <span>📍 {appointment.doctor_district}</span>
                            <span>📅 {formatAppointmentDate(appointment.date_time)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.cardActions}>
                        {appointment.status === 'confirmed' ? (
                          appointment.appointment_type === 'online' ? (
                            appointment.meeting_link && appointment.meeting_link.trim() !== '' ? (
                              <button 
                                className={`${styles.joinBtn} ${styles.joinMeetingBtn}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  try {
                                    const meetingUrl = new URL(appointment.meeting_link);
                                    meetingUrl.searchParams.set('userInfo.displayName', appointment.elder_name || 'Patient');
                                    meetingUrl.searchParams.set('userInfo.email', 'patient@silvercare.com');
                                    meetingUrl.searchParams.set('config.prejoinPageEnabled', 'false');
                                    window.open(meetingUrl.toString(), '_blank');
                                  } catch (error) {
                                    console.error('Invalid meeting link:', appointment.meeting_link);
                                    alert('Invalid meeting link. Please contact support.');
                                  }
                                }}
                              >
                                🎥 Join Meeting
                              </button>
                            ) : (
                              <button 
                                className={`${styles.joinBtn} ${styles.pendingBtn}`}
                                disabled
                              >
                                🔗 Waiting for Meeting Link
                              </button>
                            )
                          ) : (
                            <button 
                              className={`${styles.joinBtn} ${styles.confirmedBtn}`}
                              disabled
                            >
                              ✅ Confirmed Physical
                            </button>
                          )
                        ) : appointment.status === 'pending' ? (
                          <button 
                            className={`${styles.joinBtn} ${styles.pendingBtn}`}
                            disabled
                          >
                            ⏳ Pending
                          </button>
                        ) : (
                          <button 
                            className={styles.joinBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentDetails(appointment.appointment_id);
                            }}
                          >
                            👁️ View Details
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {appointments.length > 2 && (
              <div className={styles.showAllContainer}>
                <button 
                  className={styles.showAllBtn}
                  onClick={handleViewAllAppointments}
                >
                  Show All Appointments
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Grid Section - Upcoming Sessions and Care Visits Side by Side */}
        <div className={styles.sectionsContainer}>
          {/* Upcoming Sessions Section */}
          <div className={styles.appointmentsSection}>
            <div className={styles.appointmentsHeader}>
              <h2>Upcoming Sessions</h2>
              <div className={styles.appointmentTabs}>
                <button className={`${styles.tabBtn} ${styles.activeTab}`}>
                  Upcoming
                  {upcomingSessions.length > 0 && (
                    <span className={styles.countBadge}>
                      {upcomingSessions.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            <div className={styles.appointmentsContent}>
              {sessionsLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading sessions...</p>
                </div>
              ) : (
                <div className={styles.appointmentsGrid}>
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.slice(0, 2).map((session, index) => (
                      <div key={session.appointment_id} className={styles.appointmentCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.doctorInfo}>
                            <div className={styles.doctorAvatar}>🧠</div>
                            <div className={styles.doctorDetails}>
                              <h3>{session.counselor_name}</h3>
                              <p className={styles.specialization}>{session.specialization || 'Counseling'}</p>
                              <p className={styles.institution}>For: {session.elder_name}</p>
                            </div>
                          </div>
                          <div className={styles.statusContainer}>
                            <span className={`${styles.statusUpcoming} ${styles['status' + session.status.charAt(0).toUpperCase() + session.status.slice(1)]}`}>
                              {session.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className={styles.appointmentDetails}>
                          <div className={styles.appointmentMeta}>
                            <div className={styles.dateTimeGroup}>
                              <div className={styles.dateInfo}>
                                <span className={styles.dateText}>
                                  {new Date(session.date_time).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                              <div className={styles.timeInfo}>
                                <span className={styles.timeText}>
                                  {new Date(session.date_time).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className={styles.typeIndicator}>
                              <span className={`${styles.typeChip} ${session.appointment_type === 'online' ? styles.onlineChip : styles.physicalChip}`}>
                                {session.appointment_type === 'online' ? '💻 Online' : '🏥 Physical'}
                              </span>
                            </div>
                          </div>
                          
                          {session.notes && (
                            <div className={styles.appointmentNotes}>
                              <p>📝 {session.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className={styles.cardActions}>
                          {session.status === 'confirmed' ? (
                            session.appointment_type === 'online' && session.meeting_link ? (
                              <button 
                                className={`${styles.joinBtn} ${styles.joinMeetingBtn}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const meetingUrl = new URL(session.meeting_link);
                                  meetingUrl.searchParams.set('userInfo.displayName', session.elder_name || 'Patient');
                                  meetingUrl.searchParams.set('userInfo.email', 'patient@silvercare.com');
                                  meetingUrl.searchParams.set('config.prejoinPageEnabled', 'false');
                                  window.open(meetingUrl.toString(), '_blank');
                                }}
                              >
                                🎥 Join Session
                              </button>
                            ) : (
                              <button 
                                className={`${styles.joinBtn} ${styles.confirmedBtn}`}
                                disabled
                              >
                                ✅ Confirmed
                              </button>
                            )
                          ) : session.status === 'pending' ? (
                            <button 
                              className={`${styles.joinBtn} ${styles.pendingBtn}`}
                              disabled
                            >
                              ⏳ Pending
                            </button>
                          ) : (
                            <button 
                              className={styles.joinBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle session details view
                                console.log('View session details:', session.appointment_id);
                              }}
                            >
                              👁️ View Details
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noAppointments}>
                      <div className={styles.noAppointmentsIcon}>🧠</div>
                      <h3>No Upcoming Sessions</h3>
                      <p>
                        No upcoming counseling sessions scheduled for your elders. 
                        Book a new session to get started with mental health support.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {upcomingSessions.length > 2 && (
                <div className={styles.showAllContainer}>
                  <button 
                    className={styles.showAllBtn}
                    onClick={() => navigate('/family-member/sessions')}
                  >
                    Show All Sessions
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Care Visits Section */}
          <div className={styles.appointmentsSection}>
            <div className={styles.appointmentsHeader}>
              <h2>Care Assignments</h2>
              <div className={styles.appointmentTabs}>
                <button className={`${styles.tabBtn} ${styles.activeTab}`}>
                  Upcoming
                  {upcomingCareVisits.length > 0 && (
                    <span className={styles.countBadge}>
                      {upcomingCareVisits.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            <div className={styles.appointmentsContent}>
              {careVisitsLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading care visits...</p>
                </div>
              ) : (
                <div className={styles.appointmentsGrid}>
                  {upcomingCareVisits.length > 0 ? (
                    upcomingCareVisits.slice(0, 2).map((visit, index) => (
                      <div key={visit.request_id} className={styles.appointmentCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.doctorInfo}>
                            <div className={styles.doctorAvatar}>🧑‍🤝‍🧑</div>
                            <div className={styles.doctorDetails}>
                              <h3>{visit.caregiver_name}</h3>
                              <p className={styles.specialization}>Care Assistant</p>
                              <p className={styles.institution}>For: {visit.elder_name}</p>
                            </div>
                          </div>
                          <div className={styles.statusContainer}>
                            <span className={`${styles.statusUpcoming} ${styles['status' + visit.status.charAt(0).toUpperCase() + visit.status.slice(1)]}`}>
                              {visit.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className={styles.appointmentDetails}>
                          <div className={styles.appointmentMeta}>
                            <div className={styles.dateTimeGroup}>
                              <div className={styles.dateInfo}>
                                <span className={styles.dateText}>
                                  {new Date(visit.start_date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                              <div className={styles.timeInfo}>
                                <span className={styles.timeText}>
                                  {visit.duration ? `${visit.duration}h` : 'Full Day'}
                                </span>
                              </div>
                            </div>
                            <div className={styles.typeIndicator}>
                              <span className={styles.physicalChip}>
                                🏠 Home Care
                              </span>
                            </div>
                          </div>
                          
                          <div className={styles.careDetails}>
                            <div className={styles.careInfo}>
                              <span>📍 {visit.caregiver_district}</span>
                              {visit.caregiver_phone && <span>📞 {visit.caregiver_phone}</span>}
                              <span>📅 {new Date(visit.start_date).toLocaleDateString()} - {new Date(visit.end_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noAppointments}>
                      <div className={styles.noAppointmentsIcon}>🧑‍🤝‍🧑</div>
                      <h3>No Care Assignments</h3>
                      <p>
                        No upcoming care visits scheduled for your elders. 
                        Schedule a caregiver visit to provide care support.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {upcomingCareVisits.length > 2 && (
                <div className={styles.showAllContainer}>
                  <button 
                    className={styles.showAllBtn}
                    onClick={() => navigate('/family-member/care-visits')}
                  >
                    Show All Care Visits
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </FamilyMemberLayout>
    </div>
  );
};

export default FamilyMemberDashboard;

