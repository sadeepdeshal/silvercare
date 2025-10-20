import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import DoctorSidebar from '../../components/doctor_sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from '../../components/css/doctor/reports.module.css';

const API_BASE = 'http://localhost:5000';

const DoctorReports = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [appointmentStats, setAppointmentStats] = useState({
    online: 0,
    physical: 0,
    total: 0
  });

  // Earnings rates
  const ONLINE_RATE = 1800;  // Rs. 1800 per online appointment
  const PHYSICAL_RATE = 2500; // Rs. 2500 per physical appointment

  // Calculate earnings
  const earningsData = {
    onlineEarnings: appointmentStats.online * ONLINE_RATE,
    physicalEarnings: appointmentStats.physical * PHYSICAL_RATE,
    totalEarnings: (appointmentStats.online * ONLINE_RATE) + (appointmentStats.physical * PHYSICAL_RATE)
  };

  // Protect the route
  useEffect(() => {
    if (!isAuthenticated || !currentUser || currentUser.role !== 'doctor') {
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, navigate]);

  // Fetch doctor data first, then appointment statistics
  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setLoading(true);
        setError(null);

        // First fetch doctor data to get doctor_id
        const doctorResponse = await fetch(`${API_BASE}/api/doctor/user/${currentUser.user_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('silvercare_token')}`
          }
        });

        if (!doctorResponse.ok) {
          throw new Error('Failed to fetch doctor data');
        }

        const doctorData = await doctorResponse.json();
        
        if (!doctorData?.doctor?.doctor_id) {
          throw new Error('Doctor ID not found');
        }

        const doctorId = doctorData.doctor.doctor_id;

        // Then fetch appointment statistics using doctor_id
        const statsResponse = await fetch(`${API_BASE}/api/doctor/${doctorId}/appointment-statistics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('silvercare_token')}`
          }
        });

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch appointment statistics');
        }

        const data = await statsResponse.json();
        setAppointmentStats(data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [currentUser]);

  // Prepare data for bar chart - Appointments
  const appointmentChartData = [
    {
      name: 'Online',
      count: appointmentStats.online,
      fill: '#8884d8'
    },
    {
      name: 'Physical', 
      count: appointmentStats.physical,
      fill: '#82ca9d'
    }
  ];

  // Prepare data for bar chart - Earnings
  const earningsChartData = [
    {
      name: 'Online',
      earnings: earningsData.onlineEarnings,
      fill: '#8884d8'
    },
    {
      name: 'Physical', 
      earnings: earningsData.physicalEarnings,
      fill: '#82ca9d'
    }
  ];

  // Prepare data for pie chart - Appointments
  const appointmentPieData = [
    { name: 'Online Appointments', value: appointmentStats.online || 0, fill: '#8884d8' },
    { name: 'Physical Appointments', value: appointmentStats.physical || 0, fill: '#82ca9d' }
  ];

  // Prepare data for pie chart - Earnings
  const earningsPieData = [
    { name: 'Online Earnings', value: earningsData.onlineEarnings || 0, fill: '#8884d8' },
    { name: 'Physical Earnings', value: earningsData.physicalEarnings || 0, fill: '#82ca9d' }
  ];

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading Reports...</h2>
            <p>Fetching your appointment statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
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
      <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
        <Navbar />
        
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>📊 Doctor Earnings & Appointment Reports</h1>
              <p className={styles.pageSubtitle}>
                View comprehensive statistics about your medical appointments and earnings
              </p>

            </div>
          </div>

          {/* Summary Statistics */}
          <div className={styles.summarySection}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>💻</div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryNumber}>{appointmentStats.online}</h3>
                  <p className={styles.summaryLabel}>Online Appointments</p>
                  <div className={styles.summaryBreakdown}>
                    <span>Earnings: Rs. {earningsData.onlineEarnings.toLocaleString()}</span>
                    <span className={styles.rateInfo}>@ Rs. {ONLINE_RATE}/appointment</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>🏥</div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryNumber}>{appointmentStats.physical}</h3>
                  <p className={styles.summaryLabel}>Physical Appointments</p>
                  <div className={styles.summaryBreakdown}>
                    <span>Earnings: Rs. {earningsData.physicalEarnings.toLocaleString()}</span>
                    <span className={styles.rateInfo}>@ Rs. {PHYSICAL_RATE}/appointment</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>�</div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryNumber}>Rs. {earningsData.totalEarnings.toLocaleString()}</h3>
                  <p className={styles.summaryLabel}>Total Earnings</p>
                  <div className={styles.summaryBreakdown}>
                    <span>From {appointmentStats.total} appointments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className={styles.chartsSection}>
            {/* Appointment Count Bar Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>📊 Appointment Count</h2>
                <p className={styles.chartSubtitle}>Online vs Physical Appointments</p>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={appointmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Earnings Bar Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>💰 Earnings Breakdown</h2>
                <p className={styles.chartSubtitle}>Revenue from Online vs Physical Appointments</p>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={earningsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Earnings']} />
                    <Legend />
                    <Bar dataKey="earnings" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Appointment Distribution Pie Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>🥧 Appointment Distribution</h2>
                <p className={styles.chartSubtitle}>Appointment count percentage breakdown</p>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={appointmentPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appointmentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Earnings Distribution Pie Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>💰 Earnings Distribution</h2>
                <p className={styles.chartSubtitle}>Revenue percentage breakdown</p>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={earningsPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name.replace(' Earnings', '')} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#82ca9d"
                      dataKey="value"
                    >
                      {earningsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Earnings']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>



          {/* Insights Section */}
          <div className={styles.insightsSection}>
            <div className={styles.insightsCard}>
              <h2 className={styles.insightsTitle}>💡 Key Insights</h2>
              <div className={styles.insightsList}>
                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>�</span>
                  <div className={styles.insightContent}>
                    <h4>Revenue Analysis</h4>
                    <p>
                      {earningsData.physicalEarnings > earningsData.onlineEarnings 
                        ? `Physical appointments generate higher revenue (Rs. ${earningsData.physicalEarnings.toLocaleString()} vs Rs. ${earningsData.onlineEarnings.toLocaleString()})`
                        : earningsData.onlineEarnings > earningsData.physicalEarnings
                        ? `Online appointments generate higher revenue (Rs. ${earningsData.onlineEarnings.toLocaleString()} vs Rs. ${earningsData.physicalEarnings.toLocaleString()})`
                        : 'Online and physical appointments generate equal revenue'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>�📈</span>
                  <div className={styles.insightContent}>
                    <h4>Appointment Preference</h4>
                    <p>
                      {appointmentStats.online > appointmentStats.physical 
                        ? 'Most patients prefer online consultations'
                        : appointmentStats.physical > appointmentStats.online
                        ? 'Most patients prefer physical consultations'
                        : 'Equal preference for online and physical consultations'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>💻</span>
                  <div className={styles.insightContent}>
                    <h4>Average Earnings per Appointment</h4>
                    <p>
                      {appointmentStats.total > 0 
                        ? `Rs. ${Math.round(earningsData.totalEarnings / appointmentStats.total).toLocaleString()} average earnings per appointment`
                        : 'No appointment data available'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>🎯</span>
                  <div className={styles.insightContent}>
                    <h4>Total Revenue</h4>
                    <p>
                      Generated Rs. {earningsData.totalEarnings.toLocaleString()} from {appointmentStats.total} appointments, 
                      showing strong patient engagement and revenue generation.
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>🏥</span>
                  <div className={styles.insightContent}>
                    <h4>Service Efficiency</h4>
                    <p>
                      {appointmentStats.online > 0 
                        ? `Online consultations (${appointmentStats.online}) provide convenient care while generating Rs. ${earningsData.onlineEarnings.toLocaleString()} in revenue`
                        : 'Consider offering online consultations to increase accessibility and revenue potential'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>⚡</span>
                  <div className={styles.insightContent}>
                    <h4>Revenue Rates</h4>
                    <p>
                      Online appointments: Rs. {ONLINE_RATE.toLocaleString()} each | 
                      Physical appointments: Rs. {PHYSICAL_RATE.toLocaleString()} each
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorReports;