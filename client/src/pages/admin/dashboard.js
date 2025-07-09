import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/admin/dashboard.module.css';

const AdminDashboard = () => {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State for dashboard data with proper default values
  const [dashboardData, setDashboardData] = useState({
    newBookings: 0,
    monthlySignups: 0,
    pendingDoctors: [],
    recentRegistrations: [],
    stats: {
      family_members: 0,
      elders: 0,
      caregivers: 0,
      active_doctors: 0,
      pending_doctors: 0,
      upcoming_appointments: 0
    }
  });
  
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Protect the dashboard route
  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated || !currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (currentUser.role !== 'admin') {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate]);

  // Fetch dashboard data when component mounts
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser || currentUser.role !== 'admin') return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await adminApi.getDashboardData();
        
        if (response.success) {
          // Ensure all required properties exist with default values
          const safeData = {
            newBookings: response.data.newBookings || 0,
            monthlySignups: response.data.monthlySignups || 0,
            pendingDoctors: response.data.pendingDoctors || [],
            recentRegistrations: response.data.recentRegistrations || [],
            stats: {
              family_members: response.data.stats?.family_members || 0,
              elders: response.data.stats?.elders || 0,
              caregivers: response.data.stats?.caregivers || 0,
              active_doctors: response.data.stats?.active_doctors || 0,
              pending_doctors: response.data.stats?.pending_doctors || 0,
              upcoming_appointments: response.data.stats?.upcoming_appointments || 0
            }
          };
          setDashboardData(safeData);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'admin') {
      fetchDashboardData();
    }
  }, [currentUser]);

  // Handle professional approval
  const handleApproveProfessional = async (type, professionalId) => {
    try {
      const response = await adminApi.approveProfessional(type, professionalId);
      
      if (response.success) {
        // Refresh dashboard data
        const updatedData = await adminApi.getDashboardData();
        if (updatedData.success) {
          const safeData = {
            newBookings: updatedData.data.newBookings || 0,
            monthlySignups: updatedData.data.monthlySignups || 0,
            pendingDoctors: updatedData.data.pendingDoctors || [],
            recentRegistrations: updatedData.data.recentRegistrations || [],
            stats: {
              family_members: updatedData.data.stats?.family_members || 0,
              elders: updatedData.data.stats?.elders || 0,
              caregivers: updatedData.data.stats?.caregivers || 0,
              active_doctors: updatedData.data.stats?.active_doctors || 0,
              pending_doctors: updatedData.data.stats?.pending_doctors || 0,
              upcoming_appointments: updatedData.data.stats?.upcoming_appointments || 0
            }
          };
          setDashboardData(safeData);
        }
        alert(`${type} approved successfully!`);
      } else {
        alert('Failed to approve professional');
      }
    } catch (error) {
      console.error('Error approving professional:', error);
      alert('Error approving professional');
    }
  };

  // Handle professional rejection
  const handleRejectProfessional = async (type, professionalId) => {
    try {
      const response = await adminApi.rejectProfessional(type, professionalId);
      
      if (response.success) {
        // Refresh dashboard data
        const updatedData = await adminApi.getDashboardData();
        if (updatedData.success) {
          const safeData = {
            newBookings: updatedData.data.newBookings || 0,
            monthlySignups: updatedData.data.monthlySignups || 0,
            pendingDoctors: updatedData.data.pendingDoctors || [],
            recentRegistrations: updatedData.data.recentRegistrations || [],
            stats: {
              family_members: updatedData.data.stats?.family_members || 0,
              elders: updatedData.data.stats?.elders || 0,
              caregivers: updatedData.data.stats?.caregivers || 0,
              active_doctors: updatedData.data.stats?.active_doctors || 0,
              pending_doctors: updatedData.data.stats?.pending_doctors || 0,
              upcoming_appointments: updatedData.data.stats?.upcoming_appointments || 0
            }
          };
          setDashboardData(safeData);
        }
        alert(`${type} rejected successfully!`);
      } else {
        alert('Failed to reject professional');
      }
    } catch (error) {
      console.error('Error rejecting professional:', error);
      alert('Error rejecting professional');
    }
  };

  // Navigation handlers
  const handleViewAllUsers = () => {
    navigate('/admin/users');
  };

  const handleViewReports = () => {
    navigate('/admin/reports');
  };

  const handleManageAppointments = () => {
    navigate('/admin/appointments');
  };

  const handleSystemSettings = () => {
    navigate('/admin/settings');
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
  if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // Safe access to arrays with default empty arrays
  const pendingDoctors = dashboardData.pendingDoctors || [];
  const recentRegistrations = dashboardData.recentRegistrations || [];
  const stats = dashboardData.stats || {};

  return (
    <div className={styles.dashboardContainer}>
      <Navbar />
      
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>Welcome back, {currentUser.name}!</h1>
            <p className={styles.welcomeSubtitle}>Manage the SilverCare platform from your admin dashboard</p>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>📧 {currentUser.email}</span>
              <span className={styles.userRole}>👤 {currentUser.role.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          <div className={styles.welcomeImage}>
            <div className={styles.avatarPlaceholder}>
              <span className={styles.avatarIcon}>⚙️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>{dataLoading ? '...' : dashboardData.newBookings}</h3>
              <p className={styles.statLabel}>New Bookings (7 days)</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>{dataLoading ? '...' : dashboardData.monthlySignups}</h3>
              <p className={styles.statLabel}>Monthly Signups</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>
                {dataLoading ? '...' : stats.pending_doctors}
              </h3>
              <p className={styles.statLabel}>Pending Doctor Approvals</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏥</div>
            <div className={styles.statContent}>
              <h3 className={styles.statNumber}>
                {dataLoading ? '...' : stats.active_doctors}
              </h3>
              <p className={styles.statLabel}>Active Doctors</p>
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
            <h2 className={styles.sectionTitle}>⚡ Quick Actions</h2>
            <div className={styles.quickActionsGrid}>
              <div className={styles.quickActionCard} onClick={handleViewAllUsers}>
                <div className={styles.quickActionIcon}>👥</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>Manage Users</h3>
                  <p className={styles.quickActionDescription}>
                    View and manage all {(stats.family_members || 0) + (stats.elders || 0) + (stats.caregivers || 0)} registered users
                  </p>
                </div>
              </div>
              
              <div className={styles.quickActionCard} onClick={handleManageAppointments}>
                <div className={styles.quickActionIcon}>📅</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>Manage Appointments</h3>
                  <p className={styles.quickActionDescription}>
                    Oversee {stats.upcoming_appointments || 0} upcoming appointments
                  </p>
                </div>
              </div>
              
              <div className={styles.quickActionCard} onClick={handleViewReports}>
                <div className={styles.quickActionIcon}>📊</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>View Reports</h3>
                  <p className={styles.quickActionDescription}>Generate and view system reports and analytics</p>
                </div>
              </div>
              
              <div className={styles.quickActionCard} onClick={handleSystemSettings}>
                <div className={styles.quickActionIcon}>⚙️</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>System Settings</h3>
                  <p className={styles.quickActionDescription}>Configure platform settings and preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section - Right Half */}
        <div className={styles.recentActivityContainer}>
          <div className={styles.activityCard}>
            <h2 className={styles.sectionTitle}>📈 Recent Activity</h2>
            <div className={styles.activityList}>
              {dataLoading ? (
                <div className={styles.activityItem}>
                  <div className={styles.activityIcon}>⏳</div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>Loading recent activity...</p>
                  </div>
                </div>
              ) : recentRegistrations.length > 0 ? (
                <>
                  {recentRegistrations.slice(0, 5).map((registration, index) => (
                    <div key={registration.user_id || index} className={styles.activityItem}>
                      <div className={styles.activityIcon}>
                        {registration.role === 'doctor' ? '👨‍⚕️' : 
                         registration.role === 'family_member' ? '👨‍👩‍👧‍👦' :
                         registration.role === 'caregiver' ? '🤝' :
                         registration.role === 'elder' ? '👴' : '👤'}
                      </div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityText}>
                          New {registration.role?.replace('_', ' ') || 'user'} registered: {registration.name || 'Unknown'}
                        </p>
                        <span className={styles.activityTime}>
                          {registration.created_at ? new Date(registration.created_at).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className={styles.activityItem}>
                  <div className={styles.activityIcon}>📝</div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>No recent registrations</p>
                    <span className={styles.activityTime}>System ready</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingDoctors.length > 0 && (
        <div className={styles.pendingApprovalsSection}>
          <div className={styles.approvalsContainer}>
            <h2 className={styles.sectionTitle}>⏳ Pending Approvals</h2>
            <div className={styles.approvalsGrid}>
              {/* Pending Doctors */}
              {dashboardData.pendingDoctors.map((doctor) => (
                <div key={doctor.doctor_id} className={styles.approvalCard}>
                  <div className={styles.approvalHeader}>
                    <div className={styles.approvalInfo}>
                      <h3>{doctor.name}</h3>
                      <p>📧 {doctor.email}</p>
                      <p>📞 {doctor.phone}</p>
                      <p>🏥 {doctor.specialization}</p>
                      <p>📋 License: {doctor.license_number}</p>
                      <p>🎓 Experience: {doctor.years_experience} years</p>
                    </div>
                    <span className={`${styles.approvalBadge} ${styles.doctor}`}>Doctor</span>
                  </div>
                  <div className={styles.approvalActions}>
                    <button 
                      className={styles.approveBtn}
                      onClick={() => handleApproveProfessional('doctor', doctor.doctor_id)}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className={styles.rejectBtn}
                      onClick={() => handleRejectProfessional('doctor', doctor.doctor_id)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}

              {/* Pending Health Professionals */}
              {dashboardData.pendingHealthProfessionals.map((hp) => (
                <div key={hp.health_professional_id} className={styles.approvalCard}>
                  <div className={styles.approvalHeader}>
                    <div className={styles.approvalInfo}>
                      <h3>{hp.name}</h3>
                      <p>📧 {hp.email}</p>
                      <p>📞 {hp.phone}</p>
                      <p>🧠 {hp.specialization}</p>
                      <p>📋 License: {hp.license_number}</p>
                      <p>🎓 Experience: {hp.years_experience} years</p>
                    </div>
                    <span className={`${styles.approvalBadge} ${styles.healthprofessional}`}>Mental Health</span>
                  </div>
                  <div className={styles.approvalActions}>
                    <button 
                      className={styles.approveBtn}
                      onClick={() => handleApproveProfessional('healthprofessional', hp.health_professional_id)}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className={styles.rejectBtn}
                      onClick={() => handleRejectProfessional('healthprofessional', hp.health_professional_id)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
