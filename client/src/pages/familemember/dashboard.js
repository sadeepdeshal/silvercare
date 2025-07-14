import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import { caregiverApi } from '../../services/caregiverApi';
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
  const [activeCaregiverCount, setActiveCaregiverCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [caregiversLoading, setCaregiversLoading] = useState(true);
  const [error, setError] = useState(null);

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
    navigate('/family-member/appointments');
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
                    {elders.slice(0, 2).map((elder, index) => (
                      <div 
                        key={elder.elder_id} 
                        className={styles.elderLinkItem}
                        onClick={() => handleElderDetails(elder.elder_id)}
                      >
                        <div className={styles.elderLinkContent}>
                          <div className={styles.elderLinkLeft}>
                            <div className={styles.elderLinkAvatar}>
                              {elder.profile_photo ? (
                                <img 
                                  src={`http://localhost:5000/${elder.profile_photo}`} 
                                  alt={elder.name}
                                  className={styles.elderLinkPhoto}
                                />
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
                    ))}
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
                                🏥 {appointment.current_institution}
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
                          <div 
                            className={`${styles.appointmentStatus} ${styles[appointment.status]}`}
                            style={{ backgroundColor: getStatusColor(appointment.status) }}
                          >
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
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
        </div>

      </FamilyMemberLayout>
    </div>
  );
};

export default FamilyMemberDashboard;


