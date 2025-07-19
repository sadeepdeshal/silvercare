import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi } from '../../services/appointmentApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/appointments.module.css';

const Appointments = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: false
  });

  // Protect the route
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

  // Fetch appointments and stats
  useEffect(() => {
    const fetchAppointmentsData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        // Fetch appointments and stats in parallel
        const [appointmentsResponse, statsResponse] = await Promise.all([
          appointmentApi.getAllAppointmentsByFamily(currentUser.user_id, {
            status: filters.status,
            type: filters.type,
            limit: pagination.limit,
            offset: pagination.offset
          }),
          appointmentApi.getAppointmentStats(currentUser.user_id)
        ]);
        
        if (appointmentsResponse.success) {
          setAppointments(appointmentsResponse.appointments);
          setPagination(prev => ({
            ...prev,
            total: appointmentsResponse.pagination.total,
            hasMore: appointmentsResponse.pagination.hasMore
          }));
        }
        
        if (statsResponse.success) {
          setStats(statsResponse.stats);
        }
        
      } catch (err) {
        console.error('Error fetching appointments data:', err);
        setError('Failed to load appointments data');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchAppointmentsData();
    }
  }, [currentUser, filters.status, filters.type, pagination.limit, pagination.offset]);

  // Filter appointments by search term
  useEffect(() => {
    if (!filters.search) {
      setFilteredAppointments(appointments);
    } else {
      const searchTerm = filters.search.toLowerCase();
      const filtered = appointments.filter(appointment => 
        appointment.elder_name.toLowerCase().includes(searchTerm) ||
        appointment.doctor_name.toLowerCase().includes(searchTerm) ||
        appointment.specialization.toLowerCase().includes(searchTerm) ||
        appointment.current_institution.toLowerCase().includes(searchTerm)
      );
      setFilteredAppointments(filtered);
    }
  }, [appointments, filters.search]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    // Reset pagination when filters change
    if (filterType !== 'search') {
      setPagination(prev => ({
        ...prev,
        offset: 0
      }));
    }
  };

  const handleAppointmentClick = (appointmentId) => {
    navigate(`/family-member/appointment/${appointmentId}`);
  };

  const handleCancelAppointment = async (appointment, event) => {
    event.stopPropagation(); // Prevent navigation
    
    // Check if cancellation is allowed
    if (!appointment.can_cancel) {
      window.alert(`Cancellation not allowed. This appointment was created ${appointment.days_since_created} days ago. Appointments can only be cancelled within 3 days of booking.`);
      return;
    }
    
    // Show detailed cancellation confirmation
    const confirmMessage = `Are you sure you want to cancel this appointment?

📋 Appointment Details:
• Doctor: ${appointment.doctor_name}
• Patient: ${appointment.elder_name}
• Date: ${new Date(appointment.date_time).toLocaleDateString()}
• Time: ${new Date(appointment.date_time).toLocaleTimeString()}

💰 Refund Information:
${appointment.payment_amount ? `• Amount: Rs. ${appointment.payment_amount}
• Refund will be processed to your original payment method
• Refund typically takes 5-10 business days` : '• No payment found for this appointment'}

⚠️ This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;
    
    const reason = window.prompt('Please provide a reason for cancellation (optional):');
    if (reason === null) return; // User cancelled the prompt
    
    try {
      setCancellingId(appointment.appointment_id);
      
      const response = await appointmentApi.cancelAppointment(appointment.appointment_id, reason);
      
      if (response.success) {
        // Update appointments list
        setAppointments(prev => 
          prev.map(apt => 
            apt.appointment_id === appointment.appointment_id 
              ? { ...apt, status: 'cancelled' }
              : apt
          )
        );
        
        // Show success message with refund info
        let successMessage = 'Appointment cancelled successfully!';
        
        if (response.refund) {
          if (response.refund.error) {
            successMessage += `\n\n⚠️ Refund Issue: ${response.refund.error}`;
          } else {
            successMessage += `\n\n💰 Refund Processed:
• Amount: Rs. ${response.refund.amount}
• Refund ID: ${response.refund.refund_id}
• Expected in: ${response.cancellationInfo.estimatedRefundDays}
• You will receive an email confirmation shortly`;
          }
        }
        
        window.alert(successMessage);
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      
      let errorMessage = 'Failed to cancel appointment.';
      
      if (err.message.includes('not allowed')) {
        errorMessage = err.message;
      } else if (err.message.includes('3 days')) {
        errorMessage = err.message;
      } else {
        errorMessage += ' Please try again or contact support.';
      }
      
      window.alert(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'approved':
      case 'confirmed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      case 'completed': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getAppointmentTypeIcon = (type) => {
    return type === 'online' ? '💻' : '🏥';
  };

  const getCancellationInfo = (appointment) => {
    if (!appointment.can_cancel) {
      return {
        canCancel: false,
        reason: `Created ${appointment.days_since_created} days ago (3-day limit exceeded)`,
        color: '#e74c3c'
      };
    }
    
    const daysLeft = Math.max(0, 3 - appointment.days_since_created);
    return {
      canCancel: true,
      reason: `Can cancel (${daysLeft.toFixed(1)} days left)`,
      color: daysLeft < 1 ? '#f39c12' : '#27ae60'
    };
  };

  const loadMoreAppointments = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
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
    <div className={styles.container}>
      <Navbar />
      <FamilyMemberLayout>
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>📅 Confirmed Appointments</h1>
              <p className={styles.subtitle}>
                Manage and view confirmed appointments for your registered elders
              </p>
              <div className={styles.cancellationPolicy}>
                <span className={styles.policyIcon}>ℹ️</span>
                <span className={styles.policyText}>
                  Appointments can be cancelled within 3 days of booking with full refund
                </span>
              </div>
            </div>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/family-member/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {/* Statistics Cards */}
          {stats && (
            <div className={styles.statsSection}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📊</div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>{stats.total_confirmed_appointments}</h3>
                    <p className={styles.statLabel}>Total Confirmed</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📅</div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>{stats.upcoming_appointments}</h3>
                    <p className={styles.statLabel}>Upcoming</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>💻</div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>{stats.online_appointments}</h3>
                    <p className={styles.statLabel}>Online</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>🏥</div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>{stats.physical_appointments}</h3>
                    <p className={styles.statLabel}>Physical</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className={styles.filtersSection}>
            <div className={styles.filtersContainer}>
              <div className={styles.filterGroup}>
                <label htmlFor="typeFilter">Type:</label>
                <select
                  id="typeFilter"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Types</option>
                  <option value="physical">Physical</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="searchFilter">Search:</label>
                <input
                  id="searchFilter"
                  type="text"
                  placeholder="Search by elder, doctor, or specialization..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className={styles.appointmentsSection}>
            {dataLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <h2>Loading appointments...</h2>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className={styles.noAppointments}>
                <div className={styles.noAppointmentsIcon}>📅</div>
                <h2>No Confirmed Appointments Found</h2>
                <p>
                  {filters.search || filters.type !== 'all'
                    ? 'No appointments match your current filters.'
                    : 'You haven\'t confirmed any appointments yet.'
                  }
                </p>
                <button 
                  className={styles.bookAppointmentButton}
                  onClick={() => navigate('/family-member/elders')}
                >
                  Book New Appointment
                </button>
              </div>
            ) : (
              <>
                <div className={styles.appointmentsList}>
                  {filteredAppointments.map((appointment) => {
                    const { date, time } = formatDateTime(appointment.date_time);
                    const isUpcoming = new Date(appointment.date_time) > new Date();
                    const cancellationInfo = getCancellationInfo(appointment);
                    const isBeingCancelled = cancellingId === appointment.appointment_id;
                    
                    return (
                      <div
                        key={appointment.appointment_id}
                        className={styles.appointmentCard}
                        onClick={() => handleAppointmentClick(appointment.appointment_id)}
                      >
                                                <div className={styles.appointmentHeader}>
                          <div className={styles.appointmentType}>
                            <span className={styles.typeIcon}>
                              {getAppointmentTypeIcon(appointment.appointment_type)}
                            </span>
                            <span className={styles.typeText}>
                              {appointment.appointment_type === 'online' ? 'Online' : 'Physical'} Appointment
                            </span>
                          </div>
                          <div className={styles.appointmentStatusContainer}>
                            <div 
                              className={styles.appointmentStatus}
                              style={{ backgroundColor: getStatusColor(appointment.status) }}
                            >
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </div>
                            {/* Cancellation Status Indicator */}
                            <div 
                              className={styles.cancellationStatus}
                              style={{ color: cancellationInfo.color }}
                              title={cancellationInfo.reason}
                            >
                              {cancellationInfo.canCancel ? '✅' : '❌'} 
                              <span className={styles.cancellationText}>
                                {cancellationInfo.canCancel ? 'Can Cancel' : 'Cannot Cancel'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.appointmentBody}>
                          <div className={styles.appointmentInfo}>
                            <div className={styles.infoRow}>
                              <div className={styles.infoItem}>
                                <span className={styles.infoIcon}>👤</span>
                                <div className={styles.infoContent}>
                                  <span className={styles.infoLabel}>Patient</span>
                                  <span className={styles.infoValue}>{appointment.elder_name}</span>
                                </div>
                              </div>
                              <div className={styles.infoItem}>
                                <span className={styles.infoIcon}>👨‍⚕️</span>
                                <div className={styles.infoContent}>
                                  <span className={styles.infoLabel}>Doctor</span>
                                  <span className={styles.infoValue}>{appointment.doctor_name}</span>
                                </div>
                              </div>
                            </div>

                            <div className={styles.infoRow}>
                              <div className={styles.infoItem}>
                                <span className={styles.infoIcon}>🏥</span>
                                <div className={styles.infoContent}>
                                  <span className={styles.infoLabel}>Specialization</span>
                                  <span className={styles.infoValue}>{appointment.specialization}</span>
                                </div>
                              </div>
                              <div className={styles.infoItem}>
                                <span className={styles.infoIcon}>🏢</span>
                                <div className={styles.infoContent}>
                                  <span className={styles.infoLabel}>Institution</span>
                                  <span className={styles.infoValue}>{appointment.current_institution}</span>
                                </div>
                              </div>
                            </div>

                            <div className={styles.infoRow}>
                              <div className={styles.infoItem}>
                                <span className={styles.infoIcon}>📅</span>
                                <div className={styles.infoContent}>
                                  <span className={styles.infoLabel}>Date</span>
                                  <span className={styles.infoValue}>{date}</span>
                                </div>
                              </div>
                              <div className={styles.infoItem}>
                                <span className={styles.infoIcon}>🕐</span>
                                <div className={styles.infoContent}>
                                  <span className={styles.infoLabel}>Time</span>
                                  <span className={styles.infoValue}>{time}</span>
                                </div>
                              </div>
                            </div>

                            {/* Payment Information */}
                            {appointment.payment_amount && (
                              <div className={styles.infoRow}>
                                <div className={styles.infoItem}>
                                  <span className={styles.infoIcon}>💰</span>
                                  <div className={styles.infoContent}>
                                    <span className={styles.infoLabel}>Payment</span>
                                    <span className={styles.infoValue}>
                                      Rs. {appointment.payment_amount} ({appointment.payment_method})
                                    </span>
                                  </div>
                                </div>
                                <div className={styles.infoItem}>
                                  <span className={styles.infoIcon}>📊</span>
                                  <div className={styles.infoContent}>
                                    <span className={styles.infoLabel}>Payment Status</span>
                                    <span className={styles.infoValue}>
                                      {appointment.payment_status?.charAt(0).toUpperCase() + appointment.payment_status?.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Cancellation Policy Info */}
                            <div className={styles.cancellationPolicyInfo}>
                              <span className={styles.infoIcon}>ℹ️</span>
                              <div className={styles.policyContent}>
                                <span className={styles.infoLabel}>Cancellation Policy</span>
                                <span 
                                  className={styles.policyText}
                                  style={{ color: cancellationInfo.color }}
                                >
                                  {cancellationInfo.reason}
                                  {appointment.payment_amount && cancellationInfo.canCancel && 
                                    ' • Full refund available'
                                  }
                                </span>
                              </div>
                            </div>

                            {appointment.notes && (
                              <div className={styles.appointmentNotes}>
                                <span className={styles.infoIcon}>📝</span>
                                <div className={styles.notesContent}>
                                  <span className={styles.infoLabel}>Notes</span>
                                  <span className={styles.notesText}>
                                    {appointment.notes.length > 100 
                                      ? `${appointment.notes.substring(0, 100)}...` 
                                      : appointment.notes
                                    }
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.appointmentFooter}>
                          <div className={styles.appointmentMeta}>
                            <span className={styles.appointmentId}>
                              ID: #{appointment.appointment_id}
                            </span>
                            <span className={styles.appointmentCreated}>
                              Booked: {new Date(appointment.created_at).toLocaleDateString()}
                              {appointment.days_since_created && (
                                <span className={styles.daysAgo}>
                                  ({appointment.days_since_created} days ago)
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div className={styles.appointmentActions}>
                            {/* Show cancel button only if within 3-day window */}
                            {cancellationInfo.canCancel && isUpcoming && appointment.status === 'confirmed' && (
                              <button
                                className={`${styles.cancelButton} ${isBeingCancelled ? styles.cancelling : ''}`}
                                onClick={(e) => handleCancelAppointment(appointment, e)}
                                disabled={isBeingCancelled}
                              >
                                {isBeingCancelled ? (
                                  <>
                                    <div className={styles.buttonSpinner}></div>
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    Cancel & Refund
                                    {appointment.payment_amount && (
                                      <span className={styles.refundAmount}>
                                        (Rs. {appointment.payment_amount})
                                      </span>
                                    )}
                                  </>
                                )}
                              </button>
                            )}

                            {/* Show why cancellation is not available */}
                            {!cancellationInfo.canCancel && appointment.status === 'confirmed' && (
                              <div className={styles.cannotCancelInfo}>
                                <span className={styles.cannotCancelIcon}>🚫</span>
                                <span className={styles.cannotCancelText}>
                                  Cannot cancel (3-day limit exceeded)
                                </span>
                              </div>
                            )}

                            <button
                              className={styles.viewDetailsButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentClick(appointment.appointment_id);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className={styles.loadMoreSection}>
                    <button 
                      className={styles.loadMoreButton}
                      onClick={loadMoreAppointments}
                      disabled={dataLoading}
                    >
                      {dataLoading ? 'Loading...' : 'Load More Appointments'}
                    </button>
                  </div>
                )}

                {/* Pagination Info */}
                <div className={styles.paginationInfo}>
                  <p>
                    Showing {filteredAppointments.length} of {pagination.total} confirmed appointments
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default Appointments;

