import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import DoctorSidebar from '../../components/doctor_sidebar';
import { getImageSrc, handleImageError } from '../../utils/imageUtils';
import styles from '../../components/css/doctor/dashboard.module.css';

const API_BASE = "http://localhost:5000";

const DoctorAppointmentHistory = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('silvercare_token');
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

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

  // Get status badge style
  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: 'completedBadge',
      cancelled: 'cancelledBadge'
    };
    return statusStyles[status] || 'defaultBadge';
  };

  // Get appointment type badge style
  const getTypeBadge = (type) => {
    return type === 'online' ? 'onlineBadge' : 'physicalBadge';
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

  // Load appointment history
  useEffect(() => {
    const loadAppointmentHistory = async () => {
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

        console.log('Fetching appointment history for doctor:', doctorId);

        const response = await fetchWithAuth(
          `${API_BASE}/api/doctor/${doctorId}/history`
        );

        console.log('Appointment history response:', response);
        setAppointmentHistory(response.appointments || []);
      } catch (error) {
        console.error('Error loading appointment history:', error);
        setError('Failed to load appointment history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAppointmentHistory();
  }, [currentUser, token]);

  // Filter appointments based on search and filters
  const filteredAppointments = appointmentHistory.filter(appointment => {
    const matchesSearch = appointment.elder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.medical_conditions?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesType = filterType === 'all' || appointment.appointment_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
    const date = formatDate(appointment.date_time);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {});

  // Handle sidebar toggle
  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading appointment history...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Navbar />
      <div className={styles.dashboardContent}>
        <DoctorSidebar onToggleCollapse={handleSidebarToggle} />
        <main className={`${styles.mainContent} ${sidebarCollapsed ? styles.expandedContent : ''}`}>
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>📚 Appointment History</h1>
              <p className={styles.pageSubtitle}>
                View your past appointments and patient interactions
              </p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.appointmentCount}>
                Total: {filteredAppointments.length} appointments
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className={styles.filtersSection}>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search by patient name or medical conditions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.filterControls}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Types</option>
                <option value="online">Online</option>
                <option value="physical">Physical</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}

          {/* History Content */}
          <div className={styles.historyContent}>
            {Object.keys(groupedAppointments).length === 0 ? (
              <div className={styles.noDataContainer}>
                <div className={styles.noDataIcon}>📅</div>
                <h3>No appointment history found</h3>
                <p>No past appointments match your current filters.</p>
              </div>
            ) : (
              Object.entries(groupedAppointments)
                .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                .map(([date, appointments]) => (
                  <div key={date} className={styles.dateGroup}>
                    <div className={styles.dateHeader}>
                      <h3 className={styles.groupDate}>
                        {formatFullDate(appointments[0].date_time)}
                      </h3>
                      <span className={styles.appointmentCount}>
                        {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className={styles.appointmentsList}>
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className={styles.appointmentCard}>
                          <div className={styles.appointmentHeader}>
                            <div className={styles.patientInfo}>
                              <img
                                src={getImageSrc(appointment.elder_avatar, 'elder')}
                                alt={appointment.elder_name}
                                className={styles.patientAvatar}
                                onError={handleImageError}
                              />
                              <div className={styles.patientDetails}>
                                <h4 className={styles.patientName}>
                                  {appointment.elder_name || 'Unknown Patient'}
                                </h4>
                                <p className={styles.appointmentTime}>
                                  {formatTime(appointment.date_time)}
                                </p>
                              </div>
                            </div>
                            <div className={styles.appointmentBadges}>
                              <span className={`${styles.badge} ${styles[getStatusBadge(appointment.status)]}`}>
                                {appointment.status?.toUpperCase()}
                              </span>
                              <span className={`${styles.badge} ${styles[getTypeBadge(appointment.appointment_type)]}`}>
                                {appointment.appointment_type?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          {appointment.medical_conditions && (
                            <div className={styles.medicalInfo}>
                              <strong>Medical Conditions:</strong>
                              <p>{appointment.medical_conditions}</p>
                            </div>
                          )}
                          
                          {appointment.notes && (
                            <div className={styles.appointmentNotes}>
                              <strong>Notes:</strong>
                              <p>{appointment.notes}</p>
                            </div>
                          )}
                          
                          <div className={styles.appointmentActions}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => console.log('View patient details:', appointment.elder_id)}
                            >
                              View Patient Details
                            </button>
                            {appointment.status === 'completed' && (
                              <button
                                className={styles.actionBtn}
                                onClick={() => console.log('View appointment summary:', appointment.id)}
                              >
                                View Summary
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorAppointmentHistory;