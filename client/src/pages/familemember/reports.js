import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from '../../components/css/familymember/reports.module.css';

const API_BASE = 'http://localhost:5000';

const FamilyMemberReports = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState({
    doctorStats: {
      online: 0,
      physical: 0,
      total: 0
    },
    healthProfessionalStats: {
      online: 0,
      physical: 0,
      total: 0
    },
    totalAppointments: 0
  });

  // Protect the route
  useEffect(() => {
    if (!isAuthenticated || !currentUser || currentUser.role !== 'family_member') {
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, navigate]);

  // Fetch appointment statistics
  useEffect(() => {
    const fetchAppointmentStats = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/family-member/${currentUser.user_id}/appointment-stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('silvercare_token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch appointment statistics');
        }

        const data = await response.json();
        setAppointmentStats(data.stats);
      } catch (err) {
        console.error('Error fetching appointment stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentStats();
  }, [currentUser]);

  // Prepare data for bar chart
  const chartData = [
    {
      name: 'Doctor Appointments',
      Online: appointmentStats.doctorStats.online,
      Physical: appointmentStats.doctorStats.physical,
      total: appointmentStats.doctorStats.total
    },
    {
      name: 'Health Professional Appointments',
      Online: appointmentStats.healthProfessionalStats.online,
      Physical: appointmentStats.healthProfessionalStats.physical,
      total: appointmentStats.healthProfessionalStats.total
    }
  ];

  // Prepare data for pie chart
  const pieData = [
    { name: 'Doctor Online', value: appointmentStats.doctorStats.online, fill: '#8884d8' },
    { name: 'Doctor Physical', value: appointmentStats.doctorStats.physical, fill: '#82ca9d' },
    { name: 'Health Professional Online', value: appointmentStats.healthProfessionalStats.online, fill: '#ffc658' },
    { name: 'Health Professional Physical', value: appointmentStats.healthProfessionalStats.physical, fill: '#ff7c7c' }
  ];

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  if (loading) {
    return (
      <FamilyMemberLayout>
        <div className={styles.container}>
          <Navbar />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading Reports...</h2>
            <p>Fetching your appointment statistics...</p>
          </div>
        </div>
      </FamilyMemberLayout>
    );
  }

  if (error) {
    return (
      <FamilyMemberLayout>
        <div className={styles.container}>
          <Navbar />
          <div className={styles.errorContainer}>
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryBtn}>
              🔄 Retry
            </button>
          </div>
        </div>
      </FamilyMemberLayout>
    );
  }

  return (
    <FamilyMemberLayout>
      <div className={styles.container}>
        <Navbar />
        
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>📊 Appointment Reports</h1>
              <p className={styles.pageSubtitle}>
                View comprehensive statistics about your family's medical appointments
              </p>
              <button 
                className={styles.backBtn}
                onClick={() => navigate('/family-member/dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className={styles.summarySection}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>👨‍⚕️</div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryNumber}>{appointmentStats.doctorStats.total}</h3>
                  <p className={styles.summaryLabel}>Doctor Appointments</p>
                  <div className={styles.summaryBreakdown}>
                    <span>Online: {appointmentStats.doctorStats.online}</span>
                    <span>Physical: {appointmentStats.doctorStats.physical}</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>🧠</div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryNumber}>{appointmentStats.healthProfessionalStats.total}</h3>
                  <p className={styles.summaryLabel}>Health Professional Appointments</p>
                  <div className={styles.summaryBreakdown}>
                    <span>Online: {appointmentStats.healthProfessionalStats.online}</span>
                    <span>Physical: {appointmentStats.healthProfessionalStats.physical}</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>📈</div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryNumber}>{appointmentStats.totalAppointments}</h3>
                  <p className={styles.summaryLabel}>Total Appointments</p>
                  <div className={styles.summaryBreakdown}>
                    <span>All Types Combined</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className={styles.chartsSection}>
            {/* Bar Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>📊 Appointment Distribution</h2>
                <p className={styles.chartSubtitle}>Comparison of online vs physical appointments by provider type</p>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => label}
                    />
                    <Legend />
                    <Bar dataKey="Online" fill="#8884d8" name="Online Appointments" />
                    <Bar dataKey="Physical" fill="#82ca9d" name="Physical Appointments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>🥧 Appointment Breakdown</h2>
                <p className={styles.chartSubtitle}>Overall distribution of appointment types</p>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
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
                  <span className={styles.insightIcon}>📈</span>
                  <div className={styles.insightContent}>
                    <h4>Most Used Service</h4>
                    <p>
                      {appointmentStats.doctorStats.total > appointmentStats.healthProfessionalStats.total 
                        ? 'Doctor appointments are more frequently used'
                        : appointmentStats.healthProfessionalStats.total > appointmentStats.doctorStats.total
                        ? 'Health professional appointments are more frequently used'
                        : 'Both services are used equally'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>💻</span>
                  <div className={styles.insightContent}>
                    <h4>Appointment Preference</h4>
                    <p>
                      {(appointmentStats.doctorStats.online + appointmentStats.healthProfessionalStats.online) > 
                       (appointmentStats.doctorStats.physical + appointmentStats.healthProfessionalStats.physical)
                        ? 'Online appointments are preferred'
                        : (appointmentStats.doctorStats.physical + appointmentStats.healthProfessionalStats.physical) >
                          (appointmentStats.doctorStats.online + appointmentStats.healthProfessionalStats.online)
                        ? 'Physical appointments are preferred'
                        : 'Equal preference for online and physical appointments'
                      }
                    </p>
                  </div>
                </div>

                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>🎯</span>
                  <div className={styles.insightContent}>
                    <h4>Service Utilization</h4>
                    <p>
                      Total of {appointmentStats.totalAppointments} appointments scheduled, 
                      showing active engagement with healthcare services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FamilyMemberLayout>
  );
};

export default FamilyMemberReports;