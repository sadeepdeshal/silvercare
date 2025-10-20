import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import { caregiverApi } from '../../services/caregiverApi';
import { appointmentApi } from '../../services/appointmentApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/familymember/dashboard.module.css';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';

const FamilyMemberDashboard = () => {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [elderCount, setElderCount] = useState(0);
  const [elders, setElders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentCount, setAppointmentCount] = useState(0);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  const [historyAppointments, setHistoryAppointments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'cancelled'
=======
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
>>>>>>> Stashed changes
=======
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
>>>>>>> Stashed changes
  const [activeCaregiverCount, setActiveCaregiverCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [caregiversLoading, setCaregiversLoading] = useState(true);
  const [error, setError] = useState(null);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
  const [upcomingCareVisits, setUpcomingCareVisits] = useState([]);
  const [careVisitsLoading, setCareVisitsLoading] = useState(true);
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  // Fetch appointment history (completed + cancelled) across all elders under this family member
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?.user_id) return;
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const response = await appointmentApi.getAppointmentHistory(currentUser.user_id, {
          status: historyFilter === 'all' ? undefined : 'cancelled'
        });
        if (response.success) {
          setHistoryAppointments(response.appointments || []);
        } else {
          setHistoryAppointments([]);
        }
      } catch (err) {
        console.error('Error fetching appointment history:', err);
        setHistoryError('Failed to load appointment history');
        setHistoryAppointments([]);
=======
  // Fetch upcoming counselor sessions (across all elders under this family member)
  useEffect(() => {
=======
  // Fetch upcoming counselor sessions (across all elders under this family member)
  useEffect(() => {
>>>>>>> Stashed changes
    const fetchUpcomingSessions = async () => {
      if (!currentUser?.user_id) return;
      try {
        setSessionsLoading(true);
        setSessionsError(null);
        const res = await familyMemberApi.getUpcomingSessions(currentUser.user_id);
        if (res?.success) {
          setUpcomingSessions(res.sessions || []);
        } else {
          setUpcomingSessions([]);
        }
      } catch (err) {
        console.error('Error fetching upcoming sessions:', err);
        setSessionsError('Failed to load upcoming sessions');
        setUpcomingSessions([]);
>>>>>>> Stashed changes
      } finally {
        setHistoryLoading(false);
      }
    };
    if (currentUser && currentUser.role === 'family_member') {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      fetchHistory();
    }
  }, [currentUser, historyFilter]);
=======
=======
>>>>>>> Stashed changes
      fetchUpcomingSessions();
    }
  }, [currentUser]);

  // (deduplicated) Fetch upcoming sessions data handled above

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
>>>>>>> Stashed changes

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

  const handleViewFullHistory = () => {
    navigate('/family-member/appointment-history');
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

  // Function to get the correct image URL - FIXED VERSION
  const getElderImageUrl = (profilePhoto) => {
    if (!profilePhoto) return null;
    
    console.log('Profile photo path from database:', profilePhoto);
    
    // If the path already includes the full URL, return as is
    if (profilePhoto.startsWith('http')) {
      return profilePhoto;
    }
    
    // Convert backslashes to forward slashes for web URLs
    const normalizedPath = profilePhoto.replace(/\\/g, '/');
    
    // If the path starts with uploads/, construct the full URL
    if (normalizedPath.startsWith('uploads/')) {
      return `http://localhost:5000/${normalizedPath}`;
    }
    
    // If it's just the filename, construct the full path
    return `http://localhost:5000/uploads/profiles/${normalizedPath}`;
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
                    <h3 className={styles.quickActionTitle}>Health Reports</h3>
                    <p className={styles.quickActionDescription}>View health reports and care summaries</p>
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
        <div className={styles.bottomGridSection}>
          {/* Registered Elders Section - Left Half */}
          {elders.length > 0 && (
            <div className={styles.eldersSection}>
              <div className={styles.eldersSectionHeader}>
                <h2 className={styles.sectionTitle}>Your Registered Elders</h2>
                <p className={styles.eldersSubtitle}>
                  {elders.length <= 2 
                    ? "Click on any elder to view their detailed information" 
                    : `Showing 2 of ${elderCount} registered elders. Click "View All Elders" to see more.`
                  }
                </p>
              </div>
              
              <div className={styles.eldersLinkContainer}>
                {dataLoading ? (
                  <div className={styles.loadingElders}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading elders...</p>
                  </div>
                ) : (
                  <div className={styles.eldersLinkList}>
                    {/* Limit to only 2 elders */}
                    {elders.slice(0, 2).map((elder, index) => {
                      const imageUrl = getElderImageUrl(elder.profile_photo);
                      console.log('Elder:', elder.name, 'Image URL:', imageUrl);
                      
                      return (
                        <div 
                          key={elder.elder_id} 
                          className={styles.elderLinkItem}
                          onClick={() => handleElderDetails(elder.elder_id)}
                        >
                          <div className={styles.elderLinkContent}>
                            <div className={styles.elderLinkLeft}>
                              <div className={styles.elderLinkAvatar}>
                                {elder.profile_photo ? (
                                  <>
                                    <img 
                                      src={imageUrl}
                                      alt={elder.name}
                                      className={styles.elderLinkPhoto}
                                      onLoad={() => {
                                        console.log('Image loaded successfully:', imageUrl);
                                      }}
                                      onError={(e) => {
                                        console.log('Image failed to load:', imageUrl);
                                        console.log('Original path:', elder.profile_photo);
                                        e.target.style.display = 'none';
                                        const fallback = e.target.parentNode.querySelector('.fallback-initial');
                                        if (fallback) {
                                          fallback.style.display = 'flex';
                                        }
                                      }}
                                    />
                                    <div 
                                      className={`${styles.elderLinkInitial} fallback-initial`}
                                      style={{ display: 'none' }}
                                    >
                                      {elder.name.charAt(0).toUpperCase()}
                                    </div>
                                  </>
                                ) : (
                                  <div className={styles.elderLinkInitial}>
                                    {elder.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className={styles.elderLinkInfo}>
                                <h3 className={styles.elderLinkName}>{elder.name}</h3>
                                <div className={styles.elderLinkDetails}>
                                  <span className={styles.elderLinkDetail}>
                                    📞 {elder.contact}
                                  </span>
                                  <span className={styles.elderLinkDetail}>
                                    🎂 {new Date(elder.dob).toLocaleDateString()}
                                  </span>
                                  <span className={styles.elderLinkDetail}>
                                    👤 {elder.gender}
                                  </span>
                                </div>
                                {elder.medical_conditions && (
                                  <p className={styles.elderLinkMedical}>
                                    🏥 {elder.medical_conditions.substring(0, 80)}
                                    {elder.medical_conditions.length > 80 ? '...' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className={styles.elderLinkRight}>
                              <div className={styles.elderLinkArrow}>
                                <span>→</span>
                              </div>
                              <div className={styles.elderLinkAction}>
                                <span>View Details</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.elderLinkDivider}></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Show "View All Elders" button if there are more than 2 elders */}
              {elders.length > 2 && (
                <div className={styles.viewAllElders}>
                  <button 
                    className={styles.viewAllButton}
                    onClick={handleViewElders}
                  >
                    View All Elders ({elderCount})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Appointments Section - Right Half - UPDATED WITH REAL DATA */}
          <div className={styles.appointmentsSection}>
            <div className={styles.appointmentsSectionHeader}>
              <h2 className={styles.sectionTitle}>Upcoming Appointments</h2>
              <p className={styles.appointmentsSubtitle}>
                {appointments.length === 0 
                  ? "No upcoming appointments scheduled" 
                  : appointments.length <= 2
                    ? "Click on any appointment to view details"
                    : `Showing 2 of ${appointmentCount} upcoming appointments. Click "View All" to see more.`
                }
              </p>
            </div>
            
            <div className={styles.appointmentsContainer}>
              {appointmentsLoading ? (
                <div className={styles.loadingAppointments}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading appointments...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className={styles.noAppointments}>
                  <div className={styles.noAppointmentsIcon}>📅</div>
                  <p className={styles.noAppointmentsText}>No upcoming appointments</p>
                  <p className={styles.noAppointmentsSubtext}>
                    Book an appointment to get started with elder care services
                  </p>
                </div>
              ) : (
                <div className={styles.appointmentsList}>
                  {/* Limit to only 2 appointments */}
                  {appointments.slice(0, 2).map((appointment, index) => (
                    <div 
                      key={appointment.appointment_id} 
                      className={styles.appointmentItem}
                      onClick={() => handleAppointmentDetails(appointment.appointment_id)}
                    >
                      <div className={styles.appointmentContent}>
                        <div className={styles.appointmentLeft}>
                          <div className={styles.appointmentIcon}>
                            {getAppointmentTypeIcon(appointment.appointment_type)}
                          </div>
                          <div className={styles.appointmentInfo}>
                            <h3 className={styles.appointmentTitle}>
                              {appointment.specialization || 'Medical Appointment'}
                            </h3>
                            <div className={styles.appointmentDetails}>
                              <span className={styles.appointmentDetail}>
                                👤 {appointment.elder_name}
                              </span>
                              <span className={styles.appointmentDetail}>
                                👨‍⚕️ {appointment.doctor_name}
                              </span>
                              <span className={styles.appointmentDetail}>
                                📅 {formatAppointmentDate(appointment.date_time)}
                              </span>
                              <span className={styles.appointmentDetail}>
                                📍 {appointment.doctor_district}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className={styles.appointmentNotes}>
                                📝 {appointment.notes.substring(0, 60)}
                                {appointment.notes.length > 60 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={styles.appointmentRight}>
                          {appointment.status === 'confirmed' ? (
                            <div className={styles.appointmentActions}>
                              {appointment.appointment_type === 'online' && appointment.meeting_link ? (
                                <button 
                                  className={`${styles.primaryBtn} ${styles.joinMeetingBtn}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const meetingUrl = new URL(appointment.meeting_link);
                                    meetingUrl.searchParams.set('userInfo.displayName', appointment.elder_name || 'Patient');
                                    meetingUrl.searchParams.set('userInfo.email', 'patient@silvercare.com');
                                    meetingUrl.searchParams.set('config.prejoinPageEnabled', 'false');
                                    window.open(meetingUrl.toString(), '_blank');
                                  }}
                                >
                                  🎥 Join Meeting
                                </button>
                              ) : (
                                <button className={styles.secondaryBtn} style={{pointerEvents: 'none'}}>
                                  Confirmed
                                </button>
                              )}
                            </div>
                          ) : (
                            <div 
                              className={`${styles.appointmentStatus} ${styles[appointment.status]}`}
                              style={{ backgroundColor: getStatusColor(appointment.status) }}
                            >
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </div>
                          )}
                          <div className={styles.appointmentArrow}>
                            <span>→</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.appointmentDivider}></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Show "View All Appointments" button if there are more than 2 appointments */}
            {appointments.length > 2 && (
              <div className={styles.viewAllAppointments}>
                <button 
                  className={styles.viewAllAppointmentsButton}
                  onClick={handleViewAllAppointments}
                >
                  View All Appointments ({appointmentCount})
                </button>
              </div>
            )}
          </div>

          {/* Appointment History Section - Right Half (below upcoming) */}
          <div className={styles.appointmentsSection}>
            <div className={styles.appointmentsSectionHeader}>
              <h2 className={styles.sectionTitle}>Appointment History</h2>
              <p className={styles.appointmentsSubtitle}>
                View completed and cancelled appointments across all elders
              </p>
            </div>

            {/* Simple filter for All vs Cancelled */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
              <button
                className={styles.viewAllAppointmentsButton}
                style={{
                  background: historyFilter === 'all' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '',
                  color: historyFilter === 'all' ? '#fff' : ''
                }}
                onClick={() => setHistoryFilter('all')}
              >
                All History
              </button>
              <button
                className={styles.viewAllAppointmentsButton}
                style={{
                  background: historyFilter === 'cancelled' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '',
                  color: historyFilter === 'cancelled' ? '#fff' : ''
                }}
                onClick={() => setHistoryFilter('cancelled')}
              >
                Cancelled Only
              </button>
            </div>

            <div className={styles.appointmentsContainer}>
              {historyLoading ? (
                <div className={styles.loadingAppointments}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading appointment history...</p>
                </div>
              ) : historyError ? (
                <div className={styles.noAppointments}>
                  <div className={styles.noAppointmentsIcon}>📋</div>
                  <p className={styles.noAppointmentsText}>{historyError}</p>
                </div>
              ) : historyAppointments.length === 0 ? (
                <div className={styles.noAppointments}>
                  <div className={styles.noAppointmentsIcon}>📋</div>
                  <p className={styles.noAppointmentsText}>
                    {historyFilter === 'all' ? 'No completed or cancelled appointments found.' : 'No cancelled appointments found.'}
                  </p>
                </div>
              ) : (
                <div className={styles.appointmentsList}>
                  {historyAppointments.slice(0, 5).map((appointment) => (
                    <div 
                      key={appointment.appointment_id} 
                      className={styles.appointmentItem}
                      onClick={() => handleAppointmentDetails(appointment.appointment_id)}
                    >
                      <div className={styles.appointmentContent}>
                        <div className={styles.appointmentLeft}>
                          <div className={styles.appointmentIcon} style={{ background: appointment.status === 'cancelled' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : undefined }}>
                            {getAppointmentTypeIcon(appointment.appointment_type)}
                          </div>
                          <div className={styles.appointmentInfo}>
                            <h3 className={styles.appointmentTitle}>
                              {appointment.specialization || 'Medical Appointment'}
                            </h3>
                            <div className={styles.appointmentDetails}>
                              <span className={styles.appointmentDetail}>👤 {appointment.elder_name}</span>
                              <span className={styles.appointmentDetail}>👨‍⚕️ {appointment.doctor_name}</span>
                              <span className={styles.appointmentDetail}>📅 {formatAppointmentDate(appointment.date_time)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.appointmentRight}>
                          <div 
                            className={styles.appointmentStatus}
                            style={{ backgroundColor: getStatusColor(appointment.status), color: '#fff' }}
                          >
                            {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                          </div>
                          <div className={styles.appointmentArrow}>
                            <span>→</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.appointmentDivider}></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View full history */}
            {historyAppointments.length > 0 && (
              <div className={styles.viewAllAppointments}>
                <button 
                  className={styles.viewAllAppointmentsButton}
                  onClick={handleViewFullHistory}
                >
                  View Full History
                </button>
              </div>
            )}
          </div>
        </div>

      </FamilyMemberLayout>
    </div>
  );
};

export default FamilyMemberDashboard;

