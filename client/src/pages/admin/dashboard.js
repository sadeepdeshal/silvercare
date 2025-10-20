import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import AdminNavbar from '../../components/AdminNavbar';
import styles from '../../components/css/admin/dashboard.module.css';

// Reusable Modal Component
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State for dashboard data with proper default values
  const [dashboardData, setDashboardData] = useState({
    newBookings: 0,
    monthlySignups: 0,
    pendingDoctors: [],
    pendingHealthProfessionals: [],
    recentRegistrations: [],
    revenue: 0,
    stats: {
      family_members: 0,
      elders: 0,
      caregivers: 0,
      active_doctors: 0,
      pending_doctors: 0,
      upcoming_appointments: 0,
      pending_health_professionals: 0,
      active_health_professionals: 0,
      total_revenue: 0
    }
  });

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add state for modals
  const [showPendingDoctorsModal, setShowPendingDoctorsModal] = useState(false);
  const [showPendingHealthProfessionalsModal, setShowPendingHealthProfessionalsModal] = useState(false);
  const [showMonthlySignupsModal, setShowMonthlySignupsModal] = useState(false);

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
        
        console.log('Fetching dashboard data...');
        const response = await adminApi.getDashboardData();
        console.log('Dashboard API response:', response);

        if (response.success) {
          // Ensure all required properties exist with default values
          const safeData = {
            newBookings: response.data.newBookings || 0,
            monthlySignups: response.data.monthlySignups || 0,
            pendingDoctors: response.data.pendingDoctors || [],
            pendingHealthProfessionals: response.data.pendingHealthProfessionals || [],
            recentRegistrations: response.data.recentRegistrations || [],
            revenue: response.data.revenue || 0,
            stats: {
              family_members: response.data.stats?.family_members || 0,
              elders: response.data.stats?.elders || 0,
              caregivers: response.data.stats?.caregivers || 0,
              active_doctors: response.data.stats?.active_doctors || 0,
              pending_doctors: response.data.stats?.pending_doctors || 0,
              upcoming_appointments: response.data.stats?.upcoming_appointments || 0,
              pending_health_professionals: response.data.stats?.pending_health_professionals || 0,
              active_health_professionals: response.data.stats?.active_health_professionals || 0,
              total_revenue: response.data.stats?.total_revenue || 0
            }
          };

          console.log('Safe data:', safeData);
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
        const updatedData = await adminApi.getDashboardData();
        if (updatedData.success) {
          const safeData = {
            newBookings: updatedData.data.newBookings || 0,
            monthlySignups: updatedData.data.monthlySignups || 0,
            pendingDoctors: updatedData.data.pendingDoctors || [],
            pendingHealthProfessionals: updatedData.data.pendingHealthProfessionals || [],
            recentRegistrations: updatedData.data.recentRegistrations || [],
            stats: {
              family_members: updatedData.data.stats?.family_members || 0,
              elders: updatedData.data.stats?.elders || 0,
              caregivers: updatedData.data.stats?.caregivers || 0,
              active_doctors: updatedData.data.stats?.active_doctors || 0,
              pending_doctors: updatedData.data.stats?.pending_doctors || 0,
              upcoming_appointments: updatedData.data.stats?.upcoming_appointments || 0,
              pending_health_professionals: updatedData.data.stats?.pending_health_professionals || 0,
              active_health_professionals: updatedData.data.stats?.active_health_professionals || 0
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
        const updatedData = await adminApi.getDashboardData();
        if (updatedData.success) {
          const safeData = {
            newBookings: updatedData.data.newBookings || 0,
            monthlySignups: updatedData.data.monthlySignups || 0,
            pendingDoctors: updatedData.data.pendingDoctors || [],
            pendingHealthProfessionals: updatedData.data.pendingHealthProfessionals || [],
            recentRegistrations: updatedData.data.recentRegistrations || [],
            stats: {
              family_members: updatedData.data.stats?.family_members || 0,
              elders: updatedData.data.stats?.elders || 0,
              caregivers: updatedData.data.stats?.caregivers || 0,
              active_doctors: updatedData.data.stats?.active_doctors || 0,
              pending_doctors: updatedData.data.stats?.pending_doctors || 0,
              upcoming_appointments: updatedData.data.stats?.upcoming_appointments || 0,
              pending_health_professionals: updatedData.data.stats?.pending_health_professionals || 0,
              active_health_professionals: updatedData.data.stats?.active_health_professionals || 0
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

  // Handlers to open modals
  const handlePendingDoctorsClick = () => setShowPendingDoctorsModal(true);
  const handlePendingHealthProfessionalsClick = () => setShowPendingHealthProfessionalsModal(true);
  const handleMonthlySignupsClick = () => setShowMonthlySignupsModal(true);

  // Handlers to close modals
  const closePendingDoctorsModal = () => setShowPendingDoctorsModal(false);
  const closePendingHealthProfessionalsModal = () => setShowPendingHealthProfessionalsModal(false);
  const closeMonthlySignupsModal = () => setShowMonthlySignupsModal(false);

  // Navigation handlers
  const handleViewAllUsers = () => navigate('/admin/users');
  const handleViewReports = () => navigate('/admin/reports');
  const handleSystemSettings = () => navigate('/admin/settings');

  if (loading || !isAuthenticated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
        <p>Checking authentication...</p>
      </div>
    );
  }

  const { stats, recentRegistrations, pendingDoctors, pendingHealthProfessionals , revenue } = dashboardData;

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor': return '👨‍⚕️';
      case 'family_member': return '👨‍👩‍👧‍👦';
      case 'caregiver': return '🤝';
      case 'elder': return '👴';
      default: return '👤';
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <AdminNavbar />

      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>Welcome back, {currentUser.name}!</h1>
            <p className={styles.welcomeSubtitle}>Manage the SilverCare platform from your admin dashboard</p>
          </div>
          <div className={styles.welcomeImage}>
            <div className={styles.avatarPlaceholder}>
              <span className={styles.avatarIcon}>🛡️</span>
            </div>
          </div>
        </div>
      </div>

      <main className={styles.mainContent}>
        {/* Quick Stats Section */}
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Dashboard Overview</h2>
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCard1} ${styles.clickableCard}`} onClick={handleMonthlySignupsClick}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>{dataLoading ? '...' : dashboardData.monthlySignups}</h3>
                <p className={styles.statLabel}>Monthly Signups</p>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard2} ${styles.clickableCard}`} onClick={handlePendingDoctorsClick}>
              <div className={styles.statIcon}>👨‍⚕️</div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>{dataLoading ? '...' : stats.pending_doctors}</h3>
                <p className={styles.statLabel}>Pending Doctors</p>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard3} ${styles.clickableCard}`} onClick={handlePendingHealthProfessionalsClick}>
              <div className={styles.statIcon}>🧠</div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>{dataLoading ? '...' : stats.pending_health_professionals}</h3>
                <p className={styles.statLabel}>Pending Health Professionals</p>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard4}`}>
              <div className={styles.statIcon}></div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>{dataLoading ? '...' : dashboardData.revenue}</h3>
                <p className={styles.statLabel}>Total Revenue</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions & Recent Activity */}
        <section className={styles.secondaryContentGrid}>
          <div className={styles.quickActionsContainer}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.quickActionsGrid}>
              <div className={styles.quickActionCard} onClick={handleViewAllUsers}>
                <div className={styles.quickActionIcon}>👥</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>Manage Users</h3>
                  <p className={styles.quickActionDescription}>View and manage all registered users.</p>
                </div>
              </div>
              <div className={styles.quickActionCard} onClick={handleViewReports}>
                <div className={styles.quickActionIcon}>📊</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>View Reports</h3>
                  <p className={styles.quickActionDescription}>Generate and view system reports and analytics.</p>
                </div>
              </div>
              <div className={styles.quickActionCard} onClick={handleSystemSettings}>
                <div className={styles.quickActionIcon}>⚙️</div>
                <div className={styles.quickActionContent}>
                  <h3 className={styles.quickActionTitle}>System Settings</h3>
                  <p className={styles.quickActionDescription}>Configure platform settings and preferences.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.recentActivityContainer}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <div className={styles.activityList}>
              {dataLoading ? (
                <div className={styles.activityItem}>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>Loading recent activity...</p>
                  </div>
                </div>
              ) : recentRegistrations.length > 0 ? (
                recentRegistrations.slice(0, 5).map((registration, index) => (
                  <div key={registration.user_id || index} className={styles.activityItem}>
                    <div className={styles.activityIcon}>{getRoleIcon(registration.role)}</div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>
                        New {registration.role?.replace('_', ' ') || 'user'} registered: <strong>{registration.name || 'Unknown'}</strong>
                      </p>
                      <span className={styles.activityTime}>
                        {registration.created_at ? new Date(registration.created_at).toLocaleDateString() : 'Unknown date'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.activityItem}>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>No recent registrations</p>
                    <span className={styles.activityTime}>System ready</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Pending Doctors Modal */}
      <Modal show={showPendingDoctorsModal} onClose={closePendingDoctorsModal} title="Pending Doctor Approvals">
        {dataLoading ? (
          <div className={styles.modalLoading}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading pending doctors...</p>
          </div>
        ) : pendingDoctors.length > 0 ? (
          <div className={styles.modalProfessionalsList}>
            {pendingDoctors.map((doctor, index) => (
              <div key={doctor.doctor_id || doctor.user_id || index} className={styles.professionalCard}>
                <div className={styles.professionalInfo}>
                  <div className={styles.professionalHeader}>
                    <h3>{doctor.name || 'Unknown Name'}</h3>
                    <span className={`${styles.professionalBadge} ${styles.doctorBadge}`}>👨‍⚕️ Doctor</span>
                  </div>
                  <p><strong>📧 Email:</strong> {doctor.email || 'N/A'}</p>
                  <p><strong>🏥 Specialization:</strong> {doctor.specialization || 'N/A'}</p>
                  <p><strong>📋 License:</strong> {doctor.license_number || 'N/A'}</p>
                </div>
                <div className={styles.professionalActions}>
                  <button className={styles.approveBtn} onClick={() => { handleApproveProfessional('doctor', doctor.doctor_id || doctor.user_id); closePendingDoctorsModal(); }}>Approve</button>
                  <button className={styles.rejectBtn} onClick={() => { handleRejectProfessional('doctor', doctor.doctor_id || doctor.user_id); closePendingDoctorsModal(); }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.modalEmptyState}>
            <h3>No Pending Doctors</h3>
            <p>All doctor applications have been processed.</p>
          </div>
        )}
      </Modal>

      {/* Pending Health Professionals Modal */}
      <Modal show={showPendingHealthProfessionalsModal} onClose={closePendingHealthProfessionalsModal} title="Pending Health Professional Approvals">
        {dataLoading ? (
          <div className={styles.modalLoading}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading pending professionals...</p>
          </div>
        ) : pendingHealthProfessionals.length > 0 ? (
          <div className={styles.modalProfessionalsList}>
            {pendingHealthProfessionals.map((hp, index) => (
              <div key={hp.health_professional_id || hp.user_id || index} className={styles.professionalCard}>
                <div className={styles.professionalInfo}>
                  <div className={styles.professionalHeader}>
                    <h3>{hp.name || 'Unknown Name'}</h3>
                    <span className={`${styles.professionalBadge} ${styles.healthProfessionalBadge}`}>🧠 Mental Health</span>
                  </div>
                  <p><strong>📧 Email:</strong> {hp.email || 'N/A'}</p>
                  <p><strong>🧠 Specialization:</strong> {hp.specialization || 'N/A'}</p>
                  <p><strong>📋 License:</strong> {hp.license_number || 'N/A'}</p>
                </div>
                <div className={styles.professionalActions}>
                  <button className={styles.approveBtn} onClick={() => { handleApproveProfessional('healthprofessional', hp.health_professional_id || hp.user_id); closePendingHealthProfessionalsModal(); }}>Approve</button>
                  <button className={styles.rejectBtn} onClick={() => { handleRejectProfessional('healthprofessional', hp.health_professional_id || hp.user_id); closePendingHealthProfessionalsModal(); }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.modalEmptyState}>
            <h3>No Pending Health Professionals</h3>
            <p>All health professional applications have been processed.</p>
          </div>
        )}
      </Modal>


      {/* Monthly Signups Modal */}
      <Modal show={showMonthlySignupsModal} onClose={closeMonthlySignupsModal} title="Monthly Signups">
        {dataLoading ? (
          <div className={styles.modalLoading}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading monthly signups...</p>
          </div>
        ) : recentRegistrations.length > 0 ? (
          <div className={styles.modalProfessionalsList}>
            {recentRegistrations.map((registration, index) => (
              <div key={registration.user_id || index} className={styles.professionalCard}>
                <div className={styles.professionalInfo}>
                  <div className={styles.professionalHeader}>
                    <h3>{registration.name || 'Unknown Name'}</h3>
                    <span className={`${styles.professionalBadge} ${styles.signupBadge}`}>{getRoleIcon(registration.role)} {registration.role?.replace('_', ' ') || 'User'}</span>
                  </div>
                  <p><strong>📧 Email:</strong> {registration.email || 'N/A'}</p>
                  <p><strong>📅 Registered:</strong> {registration.created_at ? new Date(registration.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.modalEmptyState}>
            <h3>No Recent Signups</h3>
            <p>No users have registered in the past month.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;