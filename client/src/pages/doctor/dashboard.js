import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import '../../components/css/doctor/dashboard.css';

const API_BASE = "http://localhost:5000"; // Change if your backend runs elsewhere

const DoctorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const token = localStorage.getItem('silvercare_token');
  const [dashboardData, setDashboardData] = useState({
    todaysAppointments: [],
    upcomingAppointments: [],
    nextAppointment: null,
    counts: {
      todaysAppointments: 0,
      upcomingAppointments: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Wait for auth
        if (!currentUser?.user_id || !token) {
          setError("Not authenticated. Please log in again.");
          setLoading(false);
          return;
        }

        // Get doctor ID
        const doctorData = await fetchWithAuth(`${API_BASE}/api/doctor/user/${currentUser.user_id}`);
        if (!doctorData?.doctor?.doctor_id) {
          setError("Doctor not found for this user.");
          setLoading(false);
          return;
        }
        const doctorId = doctorData.doctor.doctor_id;

        // Get dashboard data
        const dashboard = await fetchWithAuth(`${API_BASE}/api/doctor/${doctorId}/dashboard`);
        if (!dashboard?.data) {
          setError("No dashboard data returned.");
          setLoading(false);
          return;
        }
        setDashboardData(dashboard.data);
      } catch (err) {
        // Try to parse error if it's HTML
        if (err.message && err.message.startsWith('<!DOCTYPE')) {
          setError("API endpoint not found or backend not running.");
        } else {
          setError(err.message || "Failed to load dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser, token]);

  // Extract unique elders from appointments
  const getUniqueElders = () => {
    const eldersMap = {};
    [
      ...(dashboardData.todaysAppointments || []),
      ...(dashboardData.upcomingAppointments || []),
      ...(dashboardData.nextAppointment ? [dashboardData.nextAppointment] : [])
    ].forEach(app => {
      if (app && app.elder_id && !eldersMap[app.elder_id]) {
        eldersMap[app.elder_id] = {
          id: app.elder_id,
          name: app.elder_name,
          dob: app.elder_dob,
          gender: app.elder_gender,
          contact: app.elder_contact,
          address: app.elder_address,
          medical_conditions: app.medical_conditions,
          avatar: app.elder_avatar,
          appointment: app
        };
      }
    });
    return Object.values(eldersMap);
  };

  const elders = getUniqueElders();

  // Next patient: from nextAppointment
  const nextPatient = dashboardData.nextAppointment
    ? {
        name: dashboardData.nextAppointment.elder_name,
        dob: dashboardData.nextAppointment.elder_dob,
        gender: dashboardData.nextAppointment.elder_gender,
        contact: dashboardData.nextAppointment.elder_contact,
        address: dashboardData.nextAppointment.elder_address,
        medical_conditions: dashboardData.nextAppointment.medical_conditions,
        avatar: dashboardData.nextAppointment.elder_avatar,
        appointment: dashboardData.nextAppointment
      }
    : null;

  // Upcoming consultations: from upcomingAppointments
  const consultations = (dashboardData.upcomingAppointments || []).map(app => ({
    id: app.elder_id,
    name: app.elder_name,
    date: formatDate(app.date_time),
    time: formatTime(app.date_time),
    avatar: app.elder_avatar,
    appointment: app
  }));

  // Example tasks (replace with real data if available)
  const tasks = [
    { id: 1, title: "Review today's appointments", time: "08:00 AM" },
    { id: 2, title: "Check medication updates", time: "10:00 AM" },
    { id: 3, title: "Family call follow-up", time: "03:00 PM" },
  ];

  if (loading) return <div style={{textAlign: 'center', marginTop: '2rem'}}>Loading...</div>;
  if (error) return <div style={{color: 'red', textAlign: 'center', marginTop: '2rem'}}>Error: {error}</div>;

  return (
    <div className="doctor-dashboard eldercare-theme">
      <Navbar />
      <div className="dashboard-header">
        <h2>
          Welcome <span className="doctor-name">Dr. {currentUser.name || "Doe"}!</span>
        </h2>
      </div>
      <div className="dashboard-main">
        {/* Left Column */}
        <div className="dashboard-left">
          <div className="card daily-read">
            <img src="https://images.unsplash.com/photo-1588776814546-ec7e8c8b4c2a?auto=format&fit=crop&w=400&q=80" alt="Daily Read" className="daily-read-img" />
            <div>
              <h4>Daily Read</h4>
              <p>DNA origami vaccine: DoNAs pave way for personalized cancer immunotherapy.</p>
              <button className="read-more-btn">Read more</button>
            </div>
          </div>
          <div className="card calendar">
            <div className="calendar-header">
              <span>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button className="add-reminder-btn">+ Add reminder</button>
            </div>
            <div className="calendar-dates">
              {[...Array(4)].map((_, i) => (
                <span key={i} className={`calendar-day${i === 0 ? ' active' : ''}`}>{new Date().getDate() + i}</span>
              ))}
            </div>
            <ul className="calendar-events">
              {(dashboardData.todaysAppointments || []).slice(0, 3).map((app, idx) => (
                <li key={idx}>
                  <strong>{app.elder_name}</strong> <span>{formatTime(app.date_time)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Center Column */}
        <div className="dashboard-center">
          <div className="card tasks">
            <div className="tasks-header">
              <h4>Today's Tasks</h4>
              <span className="tasks-count">{tasks.length}</span>
            </div>
            <ul className="tasks-list">
              {tasks.map(task => (
                <li key={task.id} className="task-item">
                  <span>{task.title}</span>
                  <span className="task-time">{task.time}</span>
                </li>
              ))}
            </ul>
            <a href="#" className="view-all-tasks">View All</a>
          </div>
          <div className="card next-patient">
            <div className="next-patient-header">
              <h4>Next patient's details</h4>
              <span className="next-patient-icon" title="Elderly patient">&#128104;&#8205;&#127979;</span>
            </div>
            {nextPatient ? (
              <>
                <div className="patient-info">
                  <img src={nextPatient.avatar || "https://randomuser.me/api/portraits/men/1.jpg"} alt={nextPatient.name} className="patient-avatar" />
                  <div>
                    <h5>{nextPatient.name}</h5>
                    <p>Age: {calculateAge(nextPatient.dob) || 'N/A'}</p>
                    <p>{nextPatient.address || 'N/A'}</p>
                  </div>
                </div>
                <div className="patient-tabs">
                  <button className="tab active">Summary</button>
                  <button className="tab">Conditions</button>
                  <button className="tab">Notes</button>
                </div>
                <div className="patient-summary">
                  <p>
                    {nextPatient.medical_conditions || 'No summary available for this elder.'}
                  </p>
                </div>
              </>
            ) : (
              <div>No next patient found.</div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          <div className="card upcoming-consult">
            <h4>Upcoming Consultations</h4>
            {consultations.length === 0 ? (
              <div>No upcoming consultations.</div>
            ) : (
              <ul className="consult-list">
                {consultations.map(c => (
                  <li key={c.id + c.date + c.time} className="consult-item">
                    <img src={c.avatar || "https://randomuser.me/api/portraits/men/2.jpg"} alt={c.name} className="consult-avatar" />
                    <div className="consult-info">
                      <span className="consult-name">{c.name}</span>
                      <span className="consult-date">{c.date} | {c.time}</span>
                    </div>
                    <button className="clinical-record-btn">Clinical Record</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <button className="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
};

export default DoctorDashboard;