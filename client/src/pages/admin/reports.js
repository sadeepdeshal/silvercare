import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/admin/reports.module.css';

const AdminReports = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State for reports data
  const [reportsData, setReportsData] = useState({
    userStats: {
      totalUsers: 0,
      familyMembers: 0,
      elders: 0,
      doctors: 0,
      caregivers: 0,
      healthProfessionals: 0,
      newUsersThisMonth: 0,
      activeUsers: 0
    },
    appointmentStats: {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      pendingAppointments: 0,
      appointmentsThisMonth: 0,
      averageAppointmentsPerDay: 0
    },
    systemStats: {
      totalLogins: 0,
      averageSessionDuration: 0,
      errorRate: 0,
      systemUptime: 0,
      dataStorageUsed: 0,
      backupStatus: 'Success'
    },
    monthlyData: [],
    recentActivities: [],
    topDoctors: [],
    emergencyAlerts: []
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Protect the reports route
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

  // Fetch reports data when component mounts
  useEffect(() => {
    const fetchReportsData = async () => {
      if (!currentUser || currentUser.role !== 'admin') return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching reports data...');
        // For now, we'll use mock data since the API might not exist yet
        // const response = await adminApi.getReportsData(dateRange);
        
        // Mock data - replace with actual API call
        const mockData = {
          userStats: {
            totalUsers: 1247,
            familyMembers: 456,
            elders: 234,
            doctors: 89,
            caregivers: 156,
            healthProfessionals: 45,
            newUsersThisMonth: 67,
            activeUsers: 892
          },
          appointmentStats: {
            totalAppointments: 2156,
            completedAppointments: 1834,
            cancelledAppointments: 234,
            pendingAppointments: 88,
            appointmentsThisMonth: 189,
            averageAppointmentsPerDay: 12.4
          },
          systemStats: {
            totalLogins: 15678,
            averageSessionDuration: 24.5,
            errorRate: 0.02,
            systemUptime: 99.8,
            dataStorageUsed: 67.3,
            backupStatus: 'Success'
          },
          monthlyData: [
            { month: 'Jan', users: 45, appointments: 156, revenue: 12500 },
            { month: 'Feb', users: 52, appointments: 178, revenue: 14200 },
            { month: 'Mar', users: 48, appointments: 165, revenue: 13100 },
            { month: 'Apr', users: 61, appointments: 203, revenue: 16800 },
            { month: 'May', users: 58, appointments: 189, revenue: 15600 },
            { month: 'Jun', users: 67, appointments: 234, revenue: 18900 }
          ],
          recentActivities: [
            { id: 1, type: 'user_registration', description: 'New family member registered: John Doe', timestamp: '2024-01-15 10:30:00' },
            { id: 2, type: 'appointment_booked', description: 'Appointment booked with Dr. Smith', timestamp: '2024-01-15 09:45:00' },
            { id: 3, type: 'doctor_approved', description: 'Dr. Jane Wilson approved', timestamp: '2024-01-15 08:20:00' },
            { id: 4, type: 'emergency_alert', description: 'Emergency alert resolved for Elder #234', timestamp: '2024-01-14 16:15:00' },
            { id: 5, type: 'system_backup', description: 'Daily backup completed successfully', timestamp: '2024-01-14 02:00:00' }
          ],
          topDoctors: [
            { id: 1, name: 'Dr. Michael Johnson', specialization: 'Cardiology', appointments: 45, rating: 4.8 },
            { id: 2, name: 'Dr. Sarah Williams', specialization: 'Geriatrics', appointments: 38, rating: 4.9 },
            { id: 3, name: 'Dr. Robert Brown', specialization: 'Internal Medicine', appointments: 32, rating: 4.7 },
            { id: 4, name: 'Dr. Emily Davis', specialization: 'Neurology', appointments: 28, rating: 4.6 },
            { id: 5, name: 'Dr. James Wilson', specialization: 'Orthopedics', appointments: 25, rating: 4.5 }
          ],
          emergencyAlerts: [
            { id: 1, elderName: 'Mary Johnson', type: 'Medical Emergency', status: 'Resolved', timestamp: '2024-01-15 14:30:00' },
            { id: 2, elderName: 'Robert Smith', type: 'Fall Detection', status: 'In Progress', timestamp: '2024-01-15 12:15:00' },
            { id: 3, elderName: 'Alice Brown', type: 'Medication Alert', status: 'Resolved', timestamp: '2024-01-14 18:45:00' }
          ]
        };
        
        setTimeout(() => {
          setReportsData(mockData);
          setDataLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error fetching reports data:', err);
        setError('Failed to load reports data');
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'admin') {
      fetchReportsData();
    }
  }, [currentUser, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle export functionality
  const handleExportReport = async (format) => {
    try {
      setExportLoading(true);
      
      // Here you would call the API to export reports
      // const response = await adminApi.exportReports(format, dateRange);
      
      // Mock export functionality
      setTimeout(() => {
        const filename = `silvercare_report_${dateRange.startDate}_to_${dateRange.endDate}.${format}`;
        alert(`Report exported successfully as ${filename}`);
        setExportLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report');
      setExportLoading(false);
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
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

  const renderOverviewTab = () => (
    <div className={styles.overviewContent}>
      {/* Key Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>👥</div>
          <div className={styles.metricContent}>
            <h3>{reportsData.userStats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            <span className={styles.metricChange}>+{reportsData.userStats.newUsersThisMonth} this month</span>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📅</div>
          <div className={styles.metricContent}>
            <h3>{reportsData.appointmentStats.totalAppointments.toLocaleString()}</h3>
            <p>Total Appointments</p>
            <span className={styles.metricChange}>+{reportsData.appointmentStats.appointmentsThisMonth} this month</span>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>👨‍⚕️</div>
          <div className={styles.metricContent}>
            <h3>{reportsData.userStats.doctors}</h3>
            <p>Active Doctors</p>
            <span className={styles.metricChange}>85% completion rate</span>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>⚡</div>
          <div className={styles.metricContent}>
            <h3>{reportsData.systemStats.systemUptime}%</h3>
            <p>System Uptime</p>
            <span className={styles.metricChange}>Last 30 days</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <h3>📈 Monthly Growth Trends</h3>
          <div className={styles.chartContainer}>
            <div className={styles.mockChart}>
              {reportsData.monthlyData.map((data, index) => (
                <div key={index} className={styles.chartBar}>
                  <div 
                    className={styles.barFill} 
                    style={{ height: `${(data.users / 70) * 100}%` }}
                  ></div>
                  <span className={styles.barLabel}>{data.month}</span>
                  <span className={styles.barValue}>{data.users}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>🥧 User Distribution</h3>
          <div className={styles.pieChartContainer}>
            <div className={styles.pieChart}>
              <div className={styles.pieSlice} style={{ '--percentage': '36.6%', '--color': '#007bff' }}></div>
              <div className={styles.pieSlice} style={{ '--percentage': '18.8%', '--color': '#28a745' }}></div>
              <div className={styles.pieSlice} style={{ '--percentage': '12.5%', '--color': '#ffc107' }}></div>
              <div className={styles.pieSlice} style={{ '--percentage': '7.1%', '--color': '#dc3545' }}></div>
              <div className={styles.pieSlice} style={{ '--percentage': '3.6%', '--color': '#6f42c1' }}></div>
            </div>
            <div className={styles.pieLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: '#007bff' }}></span>
                <span>Family Members ({reportsData.userStats.familyMembers})</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: '#28a745' }}></span>
                <span>Elders ({reportsData.userStats.elders})</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: '#ffc107' }}></span>
                <span>Caregivers ({reportsData.userStats.caregivers})</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: '#dc3545' }}></span>
                <span>Doctors ({reportsData.userStats.doctors})</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: '#6f42c1' }}></span>
                <span>Health Professionals ({reportsData.userStats.healthProfessionals})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className={styles.activitiesSection}>
        <div className={styles.activitiesCard}>
          <h3>📋 Recent System Activities</h3>
          <div className={styles.activitiesList}>
            {reportsData.recentActivities.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.type === 'user_registration' && '👤'}
                  {activity.type === 'appointment_booked' && '📅'}
                  {activity.type === 'doctor_approved' && '✅'}
                  {activity.type === 'emergency_alert' && '🚨'}
                  {activity.type === 'system_backup' && '💾'}
                </div>
                <div className={styles.activityContent}>
                  <p>{activity.description}</p>
                  <span className={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className={styles.usersContent}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>👥 Total Users</h3>
            <span className={styles.statNumber}>{reportsData.userStats.totalUsers.toLocaleString()}</span>
          </div>
          <div className={styles.statBreakdown}>
            <div className={styles.breakdownItem}>
              <span>Family Members:</span>
              <span>{reportsData.userStats.familyMembers}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span>Elders:</span>
              <span>{reportsData.userStats.elders}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span>Caregivers:</span>
              <span>{reportsData.userStats.caregivers}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span>Doctors:</span>
              <span>{reportsData.userStats.doctors}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span>Health Professionals:</span>
              <span>{reportsData.userStats.healthProfessionals}</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>📈 User Growth</h3>
            <span className={styles.statNumber}>+{reportsData.userStats.newUsersThisMonth}</span>
          </div>
          <div className={styles.growthChart}>
            {reportsData.monthlyData.map((data, index) => (
              <div key={index} className={styles.growthBar}>
                <div 
                  className={styles.growthFill} 
                  style={{ height: `${(data.users / 70) * 100}%` }}
                ></div>
                <span>{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>🎯 Active Users</h3>
            <span className={styles.statNumber}>{reportsData.userStats.activeUsers}</span>
          </div>
          <div className={styles.activityMetrics}>
            <div className={styles.metricItem}>
              <span>Daily Active:</span>
              <span>234</span>
            </div>
            <div className={styles.metricItem}>
              <span>Weekly Active:</span>
              <span>567</span>
            </div>
            <div className={styles.metricItem}>
              <span>Monthly Active:</span>
              <span>{reportsData.userStats.activeUsers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppointmentsTab = () => (
    <div className={styles.appointmentsContent}>
      <div className={styles.appointmentStats}>
        <div className={styles.appointmentCard}>
          <div className={styles.appointmentIcon}>📅</div>
          <div className={styles.appointmentInfo}>
            <h3>Total Appointments</h3>
            <span className={styles.appointmentNumber}>{reportsData.appointmentStats.totalAppointments.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.appointmentCard}>
          <div className={styles.appointmentIcon}>✅</div>
          <div className={styles.appointmentInfo}>
            <h3>Completed</h3>
            <span className={styles.appointmentNumber}>{reportsData.appointmentStats.completedAppointments.toLocaleString()}</span>
            <span className={styles.appointmentPercentage}>
              {((reportsData.appointmentStats.completedAppointments / reportsData.appointmentStats.totalAppointments) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={styles.appointmentCard}>
          <div className={styles.appointmentIcon}>❌</div>
          <div className={styles.appointmentInfo}>
            <h3>Cancelled</h3>
            <span className={styles.appointmentNumber}>{reportsData.appointmentStats.cancelledAppointments}</span>
            <span className={styles.appointmentPercentage}>
              {((reportsData.appointmentStats.cancelledAppointments / reportsData.appointmentStats.totalAppointments) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={styles.appointmentCard}>
          <div className={styles.appointmentIcon}>⏳</div>
          <div className={styles.appointmentInfo}>
            <h3>Pending</h3>
            <span className={styles.appointmentNumber}>{reportsData.appointmentStats.pendingAppointments}</span>
            <span className={styles.appointmentPercentage}>
              {((reportsData.appointmentStats.pendingAppointments / reportsData.appointmentStats.totalAppointments) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className={styles.topDoctorsSection}>
        <h3>🏆 Top Performing Doctors</h3>
        <div className={styles.doctorsList}>
          {reportsData.topDoctors.map((doctor, index) => (
            <div key={doctor.id} className={styles.doctorCard}>
              <div className={styles.doctorRank}>#{index + 1}</div>
              <div className={styles.doctorInfo}>
                <h4>{doctor.name}</h4>
                <p>{doctor.specialization}</p>
              </div>
              <div className={styles.doctorStats}>
                <div className={styles.doctorStat}>
                  <span>Appointments</span>
                  <span>{doctor.appointments}</span>
                </div>
                <div className={styles.doctorStat}>
                  <span>Rating</span>
                  <span>⭐ {doctor.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className={styles.systemContent}>
      <div className={styles.systemStats}>
        <div className={styles.systemCard}>
          <div className={styles.systemIcon}>🔐</div>
          <div className={styles.systemInfo}>
            <h3>Total Logins</h3>
            <span className={styles.systemNumber}>{reportsData.systemStats.totalLogins.toLocaleString()}</span>
            <span className={styles.systemDetail}>This month</span>
          </div>
        </div>

        <div className={styles.systemCard}>
          <div className={styles.systemIcon}>⏱️</div>
          <div className={styles.systemInfo}>
            <h3>Avg Session Duration</h3>
            <span className={styles.systemNumber}>{reportsData.systemStats.averageSessionDuration} min</span>
            <span className={styles.systemDetail}>Per user session</span>
          </div>
        </div>

        <div className={styles.systemCard}>
          <div className={styles.systemIcon}>⚡</div>
          <div className={styles.systemInfo}>
            <h3>System Uptime</h3>
            <span className={styles.systemNumber}>{reportsData.systemStats.systemUptime}%</span>
            <span className={styles.systemDetail}>Last 30 days</span>
          </div>
        </div>

        <div className={styles.systemCard}>
          <div className={styles.systemIcon}>💾</div>
          <div className={styles.systemInfo}>
            <h3>Storage Used</h3>
            <span className={styles.systemNumber}>{reportsData.systemStats.dataStorageUsed}%</span>
            <span className={styles.systemDetail}>Of total capacity</span>
          </div>
        </div>

        <div className={styles.systemCard}>
          <div className={styles.systemIcon}>🚨</div>
          <div className={styles.systemInfo}>
            <h3>Error Rate</h3>
            <span className={styles.systemNumber}>{(reportsData.systemStats.errorRate * 100).toFixed(2)}%</span>
            <span className={styles.systemDetail}>System errors</span>
          </div>
        </div>

        <div className={styles.systemCard}>
          <div className={styles.systemIcon}>🔄</div>
          <div className={styles.systemInfo}>
            <h3>Backup Status</h3>
            <span className={styles.systemNumber}>{reportsData.systemStats.backupStatus}</span>
            <span className={styles.systemDetail}>Last backup: Today</span>
          </div>
        </div>
      </div>

      <div className={styles.emergencySection}>
        <h3>🚨 Recent Emergency Alerts</h3>
        <div className={styles.emergencyList}>
          {reportsData.emergencyAlerts.map((alert) => (
            <div key={alert.id} className={styles.emergencyCard}>
              <div className={styles.emergencyIcon}>
                {alert.status === 'Resolved' ? '✅' : '⚠️'}
              </div>
              <div className={styles.emergencyInfo}>
                <h4>{alert.elderName}</h4>
                <p>{alert.type}</p>
                <span className={styles.emergencyTime}>
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
              <div className={`${styles.emergencyStatus} ${styles[alert.status.toLowerCase().replace(' ', '')]}`}>
                {alert.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.reportsContainer}>
      <Navbar />
      
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <button className={styles.backButton} onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>📊 Reports & Analytics</h1>
            <p className={styles.pageSubtitle}>Comprehensive insights into platform performance and usage</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.dateRangeSelector}>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className={styles.dateInput}
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.exportButtons}>
              <button 
                className={styles.exportButton}
                onClick={() => handleExportReport('pdf')}
                disabled={exportLoading}
              >
                {exportLoading ? '📄 Exporting...' : '📄 Export PDF'}
              </button>
              <button 
                className={styles.exportButton}
                onClick={() => handleExportReport('csv')}
                disabled={exportLoading}
              >
                {exportLoading ? '📊 Exporting...' : '📊 Export CSV'}
              </button>
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

      {/* Loading State */}
      {dataLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <h2>Loading Reports...</h2>
          <p>Generating analytics and insights...</p>
        </div>
      ) : (
        <>
          {/* Reports Navigation Tabs */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabsWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Overview
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('users')}
              >
                👥 Users
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'appointments' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                📅 Appointments
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'system' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('system')}
              >
                ⚙️ System
              </button>
            </div>
          </div>

          {/* Reports Content */}
          <div className={styles.reportsContent}>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'appointments' && renderAppointmentsTab()}
            {activeTab === 'system' && renderSystemTab()}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;