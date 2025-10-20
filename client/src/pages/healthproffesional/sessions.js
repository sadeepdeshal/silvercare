import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import HealthProfessionalSidebar from '../../components/HealthProfessionalSidebar';
import { getImageSrc, handleImageError } from '../../utils/imageUtils';
import styles from '../../components/css/doctor/dashboard.module.css';
import sessionStyles from '../../components/css/elder/sessions.module.css';

const API_BASE = "http://localhost:5000";

const HealthProfessionalSessions = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('silvercare_token');
  
  // State management
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counselorId, setCounselorId] = useState(null);
  
  // Filter and search states
  const [activeFilter, setActiveFilter] = useState("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 6;
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Meeting state
  const [joinMeetingLoading, setJoinMeetingLoading] = useState({});

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

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch sessions data
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
        
        const cId = counselorData.healthprofessional.counselor_id || currentUser.user_id;
        setCounselorId(cId);

        // Get dashboard data which includes all appointments
        const dashboard = await fetchWithAuth(`${API_BASE}/api/healthprofessional/${cId}/dashboard`);
        if (dashboard?.data) {
          // Combine today's and upcoming appointments
          const allSessions = [
            ...(dashboard.data.todaysAppointments || []),
            ...(dashboard.data.upcomingAppointments || [])
          ];
          setSessions(allSessions);
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
        if (err.message && err.message.startsWith('<!DOCTYPE')) {
          setError("API endpoint not found or backend not running.");
        } else if (err.message.includes('404')) {
          setError("Health professional profile not set up. Please contact admin.");
        } else {
          setError(err.message || "Failed to load sessions.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser, token]);

  // Filter sessions based on status, search, date, and type
  useEffect(() => {
    let filtered = sessions;

    // Filter by status
    if (activeFilter !== "all") {
      if (activeFilter === "upcoming") {
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.date_time);
          const now = new Date();
          return sessionDate > now && session.status !== 'cancelled';
        });
      } else if (activeFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.date_time);
          return sessionDate >= today && sessionDate < tomorrow && session.status !== 'cancelled';
        });
      } else if (activeFilter === "past") {
        const now = new Date();
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.date_time);
          return sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
        });
      } else {
        filtered = filtered.filter(session => session.status === activeFilter);
      }
    }

    // Filter by search term (elder name)
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.elder_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.date_time).toDateString();
        return sessionDate === filterDate;
      });
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(session => 
        session.appointment_type === typeFilter || session.session_type === typeFilter
      );
    }

    setFilteredSessions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [sessions, activeFilter, searchTerm, dateFilter, typeFilter]);

  // Pagination logic
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = filteredSessions.slice(
    indexOfFirstSession,
    indexOfLastSession
  );
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);

  // Handle joining a meeting
  const handleJoinMeeting = async (session) => {
    const sessionId = session.appointment_id;
    
    try {
      setJoinMeetingLoading(prev => ({ ...prev, [sessionId]: true }));
      
      if (!session.meeting_link) {
        alert('No meeting link available for this session');
        return;
      }
      
      // Create meeting URL with counselor parameters for Jitsi Meet
      const meetingUrl = new URL(session.meeting_link);
      meetingUrl.searchParams.set('userInfo.displayName', `Counselor ${currentUser.name || 'Professional'}`);
      meetingUrl.searchParams.set('userInfo.email', currentUser.email || 'counselor@silvercare.com');
      meetingUrl.searchParams.set('config.prejoinPageEnabled', 'false');
      
      // Open meeting in new tab
      window.open(meetingUrl.toString(), '_blank');
    } catch (err) {
      console.error('Error joining meeting:', err);
      alert(err.message || 'Failed to join meeting');
    } finally {
      setJoinMeetingLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const renderSessionCard = (session) => {
    const sessionDate = new Date(session.date_time);
    const now = new Date();
    const isUpcoming = sessionDate > now;
    const sessionType = session.appointment_type || session.session_type;
    
    return (
      <div key={session.appointment_id} className={sessionStyles.sessionCard}>
        <div className={sessionStyles.sessionHeader}>
          <div className={sessionStyles.sessionInfo}>
            <img
              src={getImageSrc(session.elder_avatar, 'elder', session.elder_gender)}
              alt={session.elder_name}
              className={sessionStyles.elderAvatar}
              onError={(e) => handleImageError(e, 'elder', session.elder_gender)}
            />
            <div className={sessionStyles.sessionDetails}>
              <h3 className={sessionStyles.elderName}>{session.elder_name}</h3>
              <p className={sessionStyles.sessionType}>
                {sessionType === 'online' ? '💻 Online Session' : '🏥 In-Person Session'}
              </p>
              <p className={sessionStyles.sessionDate}>
                📅 {formatDate(session.date_time)} at {formatTime(session.date_time)}
              </p>
            </div>
          </div>
          <div className={sessionStyles.sessionStatus}>
            <span className={`${sessionStyles.statusBadge} ${sessionStyles[session.status]}`}>
              {session.status}
            </span>
          </div>
        </div>

        <div className={sessionStyles.sessionBody}>
          {session.elder_gender && (
            <p className={sessionStyles.sessionDetail}>
              <strong>Gender:</strong> {session.elder_gender}
            </p>
          )}
          {session.elder_dob && (
            <p className={sessionStyles.sessionDetail}>
              <strong>Age:</strong> {calculateAge(session.elder_dob)} years
            </p>
          )}
          {session.elder_contact && (
            <p className={sessionStyles.sessionDetail}>
              <strong>Contact:</strong> {session.elder_contact}
            </p>
          )}
          {session.medical_conditions && (
            <p className={sessionStyles.sessionDetail}>
              <strong>Medical Conditions:</strong> {session.medical_conditions}
            </p>
          )}
          {session.notes && (
            <p className={sessionStyles.sessionDetail}>
              <strong>Notes:</strong> {session.notes}
            </p>
          )}
        </div>

        <div className={sessionStyles.sessionActions}>
          {sessionType === 'online' && session.status === 'confirmed' && isUpcoming && (
            <button
              className={sessionStyles.joinBtn}
              onClick={() => handleJoinMeeting(session)}
              disabled={joinMeetingLoading[session.appointment_id]}
            >
              {joinMeetingLoading[session.appointment_id] ? (
                <>
                  <span className={sessionStyles.spinner}></span>
                  Joining...
                </>
              ) : (
                <>🎥 Join Meeting</>
              )}
            </button>
          )}
          <button className={sessionStyles.detailsBtn}>
            📋 View Details
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading Sessions...</h2>
            <p>Please wait while we fetch your session data.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
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
      <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
        <Navbar />
        
        <div className={sessionStyles.sessionsContainer}>
          {/* Header */}
          <div className={sessionStyles.sessionsHeader}>
            <h1 className={sessionStyles.pageTitle}>My Sessions</h1>
            <p className={sessionStyles.pageSubtitle}>
              Manage and view all your counseling sessions
            </p>
          </div>

          {/* Filters and Search */}
          <div className={sessionStyles.filtersSection}>
            {/* Status Filter Tabs */}
            <div className={sessionStyles.filterTabs}>
              <button
                className={`${sessionStyles.filterTab} ${activeFilter === "all" ? sessionStyles.active : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All Sessions
                <span className={sessionStyles.tabCount}>{sessions.length}</span>
              </button>
              <button
                className={`${sessionStyles.filterTab} ${activeFilter === "upcoming" ? sessionStyles.active : ""}`}
                onClick={() => setActiveFilter("upcoming")}
              >
                Upcoming
                <span className={sessionStyles.tabCount}>
                  {sessions.filter(s => new Date(s.date_time) > new Date() && s.status !== 'cancelled').length}
                </span>
              </button>
              <button
                className={`${sessionStyles.filterTab} ${activeFilter === "today" ? sessionStyles.active : ""}`}
                onClick={() => setActiveFilter("today")}
              >
                Today
                <span className={sessionStyles.tabCount}>
                  {sessions.filter(s => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const sessionDate = new Date(s.date_time);
                    return sessionDate >= today && sessionDate < tomorrow && s.status !== 'cancelled';
                  }).length}
                </span>
              </button>
              <button
                className={`${sessionStyles.filterTab} ${activeFilter === "past" ? sessionStyles.active : ""}`}
                onClick={() => setActiveFilter("past")}
              >
                Past
                <span className={sessionStyles.tabCount}>
                  {sessions.filter(s => new Date(s.date_time) < new Date() || s.status === 'completed' || s.status === 'cancelled').length}
                </span>
              </button>
            </div>

            {/* Search and Additional Filters */}
            <div className={sessionStyles.additionalFilters}>
              <div className={sessionStyles.searchBox}>
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={sessionStyles.searchInput}
                />
                <span className={sessionStyles.searchIcon}>🔍</span>
              </div>

              <div className={sessionStyles.dateFilterBox}>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={sessionStyles.dateInput}
                />
              </div>

              <div className={sessionStyles.typeFilterBox}>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={sessionStyles.typeSelect}
                >
                  <option value="all">All Types</option>
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>

              {(searchTerm || dateFilter || typeFilter !== "all") && (
                <button
                  className={sessionStyles.clearFiltersBtn}
                  onClick={() => {
                    setSearchTerm("");
                    setDateFilter("");
                    setTypeFilter("all");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Sessions List */}
          <div className={sessionStyles.sessionsContent}>
            {currentSessions.length === 0 ? (
              <div className={sessionStyles.emptyState}>
                <div className={sessionStyles.emptyIcon}>🗓️</div>
                <h3>No Sessions Found</h3>
                <p>
                  {activeFilter === "all"
                    ? "You don't have any sessions yet."
                    : activeFilter === "upcoming"
                    ? "No upcoming sessions scheduled."
                    : activeFilter === "today"
                    ? "No sessions scheduled for today."
                    : "No past sessions to display."}
                </p>
              </div>
            ) : (
              <>
                <div className={sessionStyles.sessionsGrid}>
                  {currentSessions.map(renderSessionCard)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={sessionStyles.pagination}>
                    <button
                      className={sessionStyles.paginationBtn}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      ← Previous
                    </button>
                    
                    <div className={sessionStyles.paginationInfo}>
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button
                      className={sessionStyles.paginationBtn}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthProfessionalSessions;
