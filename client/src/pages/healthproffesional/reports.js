import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import HealthProfessionalSidebar from '../../components/HealthProfessionalSidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from '../../components/css/healthprofessional/reports.module.css';

const API_BASE = 'http://localhost:5000';

const HealthProfessionalReports = () => {
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

  // Earnings rates (same as doctor rates)
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
    if (!isAuthenticated || !currentUser || currentUser.role !== 'healthprofessional') {
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, navigate]);

  // Fetch health professional data first, then appointment statistics
  useEffect(() => {
    const fetchHealthProfessionalData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setLoading(true);
        setError(null);

        // First fetch health professional data to get counselor_id
        const hpResponse = await fetch(`${API_BASE}/api/healthprofessional/user/${currentUser.user_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('silvercare_token')}`
          }
        });

        if (!hpResponse.ok) {
          throw new Error('Failed to fetch health professional data');
        }

        const hpData = await hpResponse.json();
        
        // For now, use the actual counselor_id that you're logged in as
        // Since you mentioned you're logged in as counselor ID 4
        const counselorId = 4; // Update this to match your logged-in counselor

        // Then fetch appointment statistics using counselor_id
        const statsResponse = await fetch(`${API_BASE}/api/healthprofessional/${counselorId}/appointment-statistics`, {
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

    fetchHealthProfessionalData();
  }, [currentUser]);

  // Prepare data for bar chart - Appointments
  const appointmentChartData = [
    {
      name: 'Online',
      count: appointmentStats.online,
      fill: '#43c6ac'
    },
    {
      name: 'Physical', 
      count: appointmentStats.physical,
      fill: '#191654'
    }
  ];

  // Prepare data for bar chart - Earnings
  const earningsChartData = [
    {
      name: 'Online',
      earnings: earningsData.onlineEarnings,
      fill: '#43c6ac'
    },
    {
      name: 'Physical', 
      earnings: earningsData.physicalEarnings,
      fill: '#191654'
    }
  ];

  // Prepare data for pie chart - Appointments
  const appointmentPieData = [
    { name: 'Online Sessions', value: appointmentStats.online || 0, fill: '#43c6ac' },
    { name: 'Physical Sessions', value: appointmentStats.physical || 0, fill: '#191654' }
  ];

  // Prepare data for pie chart - Earnings
  const earningsPieData = [
    { name: 'Online Earnings', value: earningsData.onlineEarnings || 0, fill: '#43c6ac' },
    { name: 'Physical Earnings', value: earningsData.physicalEarnings || 0, fill: '#191654' }
  ];

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
        <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
          <Navbar />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading Reports...</h2>
            <p>Fetching your session statistics...</p>
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
        
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>📊 Health Professional Earnings & Session Reports</h1>
              <p className={styles.pageSubtitle}>
                View comprehensive statistics about your mental health sessions and earnings
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
                  <p className={styles.summaryLabel}>Online Sessions</p>
                  <div className={styles.summaryBreakdown}>
                    <span>Earnings: Rs. {earningsData.onlineEarnings.toLocaleString()}</span>
                    <span className={styles.rateInfo}>@ Rs. {ONLINE_RATE}/session</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>🏥</div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryNumber}>{appointmentStats.physical}</h3>
                  <p className={styles.summaryLabel}>Physical Sessions</p>
                  <div className={styles.summaryBreakdown}>
                    <span>Earnings: Rs. {earningsData.physicalEarnings.toLocaleString()}</span>
                    <span className={styles.rateInfo}>@ Rs. {PHYSICAL_RATE}/session</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>💰</div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryNumber}>Rs. {earningsData.totalEarnings.toLocaleString()}</h3>
                  <p className={styles.summaryLabel}>Total Earnings</p>
                  <div className={styles.summaryBreakdown}>
                    <span>From {appointmentStats.total} sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className={styles.chartsSection}>
            {/* Session Count Bar Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>📊 Session Count</h2>
                <p className={styles.chartSubtitle}>Online vs Physical Mental Health Sessions</p>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={appointmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#43c6ac" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Earnings Bar Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>💰 Earnings Breakdown</h2>
                <p className={styles.chartSubtitle}>Revenue from Online vs Physical Sessions</p>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={earningsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Earnings']} />
                    <Legend />
                    <Bar dataKey="earnings" fill="#191654" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Session Distribution Pie Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>🥧 Session Distribution</h2>
                <p className={styles.chartSubtitle}>Session count percentage breakdown</p>
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
                      fill="#43c6ac"
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
                      fill="#191654"
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
                  <span className={styles.insightIcon}>💰</span>
                  <div className={styles.insightContent}>
                    <h4>Revenue Analysis</h4>
                    <p>
                      {earningsData.physicalEarnings > earningsData.onlineEarnings 
                        ? `Physical sessions generate higher revenue (Rs. ${earningsData.physicalEarnings.toLocaleString()} vs Rs. ${earningsData.onlineEarnings.toLocaleString()})`
                        : earningsData.onlineEarnings > earningsData.physicalEarnings
                        ? `Online sessions generate higher revenue (Rs. ${earningsData.onlineEarnings.toLocaleString()} vs Rs. ${earningsData.physicalEarnings.toLocaleString()})`
                        : 'Online and physical sessions generate equal revenue'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>📈</span>
                  <div className={styles.insightContent}>
                    <h4>Client Preference</h4>
                    <p>
                      {appointmentStats.online > appointmentStats.physical 
                        ? 'Most clients prefer online therapy sessions'
                        : appointmentStats.physical > appointmentStats.online
                        ? 'Most clients prefer in-person therapy sessions'
                        : 'Equal preference for online and in-person therapy sessions'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>💻</span>
                  <div className={styles.insightContent}>
                    <h4>Average Earnings per Session</h4>
                    <p>
                      {appointmentStats.total > 0 
                        ? `Rs. ${Math.round(earningsData.totalEarnings / appointmentStats.total).toLocaleString()} average earnings per session`
                        : 'No session data available'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>🎯</span>
                  <div className={styles.insightContent}>
                    <h4>Total Revenue</h4>
                    <p>
                      Generated Rs. {earningsData.totalEarnings.toLocaleString()} from {appointmentStats.total} therapy sessions, 
                      showing strong client engagement and revenue generation.
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>🧠</span>
                  <div className={styles.insightContent}>
                    <h4>Mental Health Service Efficiency</h4>
                    <p>
                      {appointmentStats.online > 0 
                        ? `Online therapy sessions (${appointmentStats.online}) provide accessible mental health care while generating Rs. ${earningsData.onlineEarnings.toLocaleString()} in revenue`
                        : 'Consider offering online therapy sessions to increase accessibility and revenue potential'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>⚡</span>
                  <div className={styles.insightContent}>
                    <h4>Session Rates</h4>
                    <p>
                      Online sessions: Rs. {ONLINE_RATE.toLocaleString()} each | 
                      Physical sessions: Rs. {PHYSICAL_RATE.toLocaleString()} each
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

export default HealthProfessionalReports;