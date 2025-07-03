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
  useEffect(() => {
    const fetchEldersData = async () => {
      if (!currentUser?.id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        // Fetch both elder count and elders list
        const [countResponse, eldersResponse] = await Promise.all([
          elderApi.getElderCount(currentUser.id),
          elderApi.getEldersByFamilyMember(currentUser.id)
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
      <button 
        onClick={handleElderRegistration}
        style={{
          backgroundColor: '#4facfe',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          borderRadius: '8px',
          cursor: 'pointer',
          marginRight: '10px',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#00f2fe';
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#4facfe';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        Register Your Elder
      </button>
      
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

      {/* Main Actions Section */}
      <div className={styles.actionsSection}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <div className={styles.actionCard} onClick={handleElderRegistration}>
            <div className={styles.actionIcon}>➕</div>
            <div className={styles.actionContent}>
              <h3 className={styles.actionTitle}>Register New Elder</h3>
              <p className={styles.actionDescription}>Add a new elderly person to your care network</p>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>

          <div className={styles.actionCard} onClick={handleViewElders}>
            <div className={styles.actionIcon}>👥</div>
            <div className={styles.actionContent}>
              <h3 className={styles.actionTitle}>View My Elders</h3>
              <p className={styles.actionDescription}>
                Manage and monitor {elderCount} registered elderly person{elderCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>

          <div className={styles.actionCard} onClick={handleBookAppointment}>
            <div className={styles.actionIcon}>📅</div>
            <div className={styles.actionContent}>
              <h3 className={styles.actionTitle}>Book Appointment</h3>
              <p className={styles.actionDescription}>Schedule medical appointments and care services</p>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>

          <div className={styles.actionCard} onClick={handleViewReports}>
            <div className={styles.actionIcon}>📊</div>
            <div className={styles.actionContent}>
              <h3 className={styles.actionTitle}>Health Reports</h3>
              <p className={styles.actionDescription}>View health reports and care summaries</p>
            </div>
            <div className={styles.actionArrow}>→</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section - Updated with real elder data */}
      <div className={styles.activitySection}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.activityCard}>
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
                  <div key={elder.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>👤</div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>
                        Elder {elder.full_name} registered successfully
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

      {/* Registered Elders Summary Section */}
      {elders.length > 0 && (
        <div className={styles.eldersSection}>
          <h2 className={styles.sectionTitle}>Your Registered Elders</h2>
          <div className={styles.eldersGrid}>
            {elders.map((elder) => (
              <div key={elder.id} className={styles.elderCard}>
                <div className={styles.elderAvatar}>
                  {elder.profile_photo ? (
                    <img 
                      src={`http://localhost:5000/${elder.profile_photo}`} 
                      alt={elder.full_name}
                      className={styles.elderPhoto}
                    />
                  ) : (
                    <div className={styles.elderInitial}>
                      {elder.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.elderInfo}>
                  <h3 className={styles.elderName}>{elder.full_name}</h3>
                  <p className={styles.elderDetail}>
                    📞 {elder.contact_number}
                  </p>
                  <p className={styles.elderDetail}>
                    🎂 {new Date(elder.date_of_birth).toLocaleDateString()}
                  </p>
                  <p className={styles.elderDetail}>
                    👤 {elder.gender}
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
                    onClick={() => navigate(`/family-member/elder/${elder.id}`)}
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
