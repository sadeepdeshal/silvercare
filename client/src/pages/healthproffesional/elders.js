import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import HealthProfessionalSidebar from '../../components/HealthProfessionalSidebar';
import { getImageSrc, handleImageError } from '../../utils/imageUtils';
import styles from '../../components/css/doctor/profile.module.css';

const API_BASE = "http://localhost:5000";

const HealthProfessionalElders = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('silvercare_token');
  
  // State management
  const [elders, setElders] = useState([]);
  const [filteredElders, setFilteredElders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counselorId, setCounselorId] = useState(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eldersPerPage = 9;
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch elders data
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

        // Get dashboard data which includes appointments with elder information
        const dashboard = await fetchWithAuth(`${API_BASE}/api/healthprofessional/${cId}/dashboard`);
        if (dashboard?.data) {
          // Extract unique elders from all appointments
          const eldersMap = {};
          [
            ...(dashboard.data.todaysAppointments || []),
            ...(dashboard.data.upcomingAppointments || []),
            ...(dashboard.data.nextAppointment ? [dashboard.data.nextAppointment] : [])
          ].forEach(app => {
            if (app && app.elder_id && !eldersMap[app.elder_id]) {
              eldersMap[app.elder_id] = {
                elder_id: app.elder_id,
                name: app.elder_name,
                dob: app.elder_dob,
                gender: app.elder_gender,
                contact: app.elder_contact,
                address: app.elder_address,
                medical_conditions: app.medical_conditions,
                avatar: app.elder_avatar,
                // Count appointments for this elder
                appointmentCount: 1,
                lastAppointment: app.date_time
              };
            } else if (app && app.elder_id && eldersMap[app.elder_id]) {
              // Increment appointment count
              eldersMap[app.elder_id].appointmentCount++;
              // Update last appointment if this is more recent
              if (new Date(app.date_time) > new Date(eldersMap[app.elder_id].lastAppointment)) {
                eldersMap[app.elder_id].lastAppointment = app.date_time;
              }
            }
          });
          
          setElders(Object.values(eldersMap));
        }
      } catch (err) {
        console.error('Error loading elders:', err);
        if (err.message && err.message.startsWith('<!DOCTYPE')) {
          setError("API endpoint not found or backend not running.");
        } else if (err.message.includes('404')) {
          setError("Health professional profile not set up. Please contact admin.");
        } else {
          setError(err.message || "Failed to load patients.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser, token]);

  // Filter elders based on search and gender
  useEffect(() => {
    let filtered = elders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(elder =>
        elder.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by gender
    if (genderFilter !== "all") {
      filtered = filtered.filter(elder => elder.gender?.toLowerCase() === genderFilter.toLowerCase());
    }

    setFilteredElders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [elders, searchTerm, genderFilter]);

  // Pagination logic
  const indexOfLastElder = currentPage * eldersPerPage;
  const indexOfFirstElder = indexOfLastElder - eldersPerPage;
  const currentElders = filteredElders.slice(indexOfFirstElder, indexOfLastElder);
  const totalPages = Math.ceil(filteredElders.length / eldersPerPage);

  const renderElderCard = (elder) => {
    return (
      <div key={elder.elder_id} className={styles.elderCard}>
        <div className={styles.elderCardHeader}>
          <img
            src={getImageSrc(elder.avatar, 'elder', elder.gender)}
            alt={elder.name}
            className={styles.elderAvatar}
            onError={(e) => handleImageError(e, 'elder', elder.gender)}
          />
          <div className={styles.elderHeaderBadge}>
            <span className={styles.appointmentsBadge}>
              {elder.appointmentCount} {elder.appointmentCount === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
        </div>
        
        <div className={styles.elderCardBody}>
          <h3 className={styles.elderName}>{elder.name}</h3>
          
          <div className={styles.elderDetailsGrid}>
            {elder.gender && (
              <div className={styles.elderDetailItem}>
                <span className={styles.elderDetailLabel}>Gender:</span>
                <span className={styles.elderDetailValue}>{elder.gender}</span>
              </div>
            )}
            {elder.dob && (
              <div className={styles.elderDetailItem}>
                <span className={styles.elderDetailLabel}>Age:</span>
                <span className={styles.elderDetailValue}>{calculateAge(elder.dob)} years</span>
              </div>
            )}
            {elder.contact && (
              <div className={styles.elderDetailItem}>
                <span className={styles.elderDetailLabel}>Contact:</span>
                <span className={styles.elderDetailValue}>{elder.contact}</span>
              </div>
            )}
            {elder.address && (
              <div className={styles.elderDetailItem}>
                <span className={styles.elderDetailLabel}>Address:</span>
                <span className={styles.elderDetailValue}>{elder.address}</span>
              </div>
            )}
          </div>
          
          {elder.medical_conditions && (
            <div className={styles.elderMedicalInfo}>
              <strong>Medical Conditions:</strong>
              <p>{elder.medical_conditions}</p>
            </div>
          )}
        </div>

        <div className={styles.elderCardActions}>
          <button 
            className={styles.viewProfileBtn}
            onClick={() => navigate(`/healthprofessional/elder/${elder.elder_id}`)}
          >
            👤 View Profile
          </button>
          <button 
            className={styles.viewHistoryBtn}
            onClick={() => navigate(`/healthprofessional/sessions`)}
          >
            📋 View Sessions
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <h2>Loading Patients...</h2>
            <p>Please wait while we fetch your patient data.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.errorState}>
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
        <Navbar />
        
        {/* Header Section */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                <span className={styles.avatarIcon}>👥</span>
              </div>
              <div className={styles.avatarInfo}>
                <h1 className={styles.doctorName}>My Patients</h1>
                <p className={styles.specialization}>Manage and view all your assigned patients</p>
                <p className={styles.institution}>Total Patients: {elders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className={styles.profileContent}>
          <div className={styles.profileSection}>
            <div className={styles.sessionFiltersContainer}>
              {/* Search and Filters */}
              <div className={styles.searchFiltersRow}>
                <div className={styles.searchInputWrapper}>
                  <span className={styles.searchIconSpan}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className={styles.typeFilterSelect}
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                {(searchTerm || genderFilter !== "all") && (
                  <button
                    className={styles.clearFiltersButton}
                    onClick={() => {
                      setSearchTerm("");
                      setGenderFilter("all");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Elders List */}
          <div className={styles.profileSection}>
            <h2 className={styles.sectionTitle}>
              👥 Patient List ({filteredElders.length})
            </h2>
            
            {currentElders.length === 0 ? (
              <div className={styles.emptySessionsState}>
                <div className={styles.emptyIcon}>👥</div>
                <h3>No Patients Found</h3>
                <p>
                  {searchTerm || genderFilter !== "all"
                    ? "No patients match your search criteria."
                    : "You don't have any assigned patients yet. Patients will appear here once they book sessions with you."}
                </p>
              </div>
            ) : (
              <>
                <div className={styles.eldersGridContainer}>
                  {currentElders.map(renderElderCard)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.paginationContainer}>
                    <button
                      className={styles.paginationButton}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      ← Previous
                    </button>
                    
                    <div className={styles.paginationInfo}>
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button
                      className={styles.paginationButton}
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

export default HealthProfessionalElders;
