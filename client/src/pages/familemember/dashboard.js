import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/familymember/dashboard.module.css';

const FamilyMemberDashboard = () => {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [elderCount, setElderCount] = useState(0);
  const [elders, setElders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
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
  // Update the useEffect to use user_id instead of family_id
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


  const handleElderRegistration = () => {
    navigate('/family-member/elder-signup');
  };

  const handleViewElders = () => {
    // Navigate to elders list page
    navigate('/family-member/elders');
  };

  const handleBookAppointment = () => {
    // Navigate to appointment booking
    navigate('/family-member/appointments');
  };

  const handleViewReports = () => {
    // Navigate to reports page
    navigate('/family-member/reports');
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
    <div className={styles.dashboardContainer}>
      <Navbar />

      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>Welcome back, {currentUser.name}!</h1>
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
              <h3 className={styles.statNumber}>3</h3>
              <p className={styles.statLabel}>Upcoming Appointments</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏥</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>5</h3>
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

              <div className={styles.quickActionCard} onClick={handleViewElders}>
                <div className={styles.quickActionIcon}>👥</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>View My Elders</h3>
                  <p className={styles.quickActionDescription}>
                    Manage {elderCount} registered elder{elderCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className={styles.quickActionCard} onClick={handleBookAppointment}>
                <div className={styles.quickActionIcon}>📅</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>Book Appointment</h3>
                  <p className={styles.quickActionDescription}>Schedule medical appointments and care services</p>
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
                  <div className={styles.activityItem}>
                    <div className={styles.activityIcon}>📅</div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>Appointment scheduled with Dr. Smith</p>
                      <span className={styles.activityTime}>1 day ago</span>
                    </div>
                  </div>
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

      {/* Registered Elders Summary Section */}
      {elders.length > 0 && (
        <div className={styles.eldersSection}>
          <h2 className={styles.sectionTitle}>Your Registered Elders</h2>
          <div className={styles.eldersGrid}>
            {elders.map((elder) => (
              <div key={elder.elder_id} className={styles.elderCard}>
                <div className={styles.elderAvatar}>
                  {elder.profile_photo ? (
                    <img 
                      src={`http://localhost:5000/${elder.profile_photo}`} 
                      alt={elder.name}
                      className={styles.elderPhoto}
                    />
                  ) : (
                    <div className={styles.elderInitial}>
                      {elder.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.elderInfo}>
                  <h3 className={styles.elderName}>{elder.name}</h3>
                  <p className={styles.elderDetail}>
                    📞 {elder.contact}
                  </p>
                  <p className={styles.elderDetail}>
                    🎂 {new Date(elder.dob).toLocaleDateString()}
                  </p>
                  <p className={styles.elderDetail}>
                    👤 {elder.gender}
                  </p>
                  <p className={styles.elderDetail}>
                    🆔 {elder.nic}
                  </p>
                  {elder.medical_conditions && (
                    <p className={styles.elderMedical}>
                      🏥 {elder.medical_conditions.substring(0, 50)}
                      {elder.medical_conditions.length > 50 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className={styles.elderActions}>
                  <button 
                    className={styles.elderActionBtn}
                    onClick={() => navigate(`/family-member/elder/${elder.elder_id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberDashboard;

