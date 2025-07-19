import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar";
import {
  getElderDetailsByEmail,
  getElderDashboardStats,
  getUpcomingAppointments,
  getPastAppointments,
  cancelAppointment,
  joinAppointment,
} from "../../services/elderApi2";
import styles from "../../components/css/elder/dashboard.module.css";

const ElderDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [elderDetails, setElderDetails] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Real stats data from backend
  const [statsData, setStatsData] = useState({
    upcomingAppointments: 0,
    upcomingSessions: 0,
    upcomingCampaigns: 0,
    assignedCaregivers: 0,
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchElderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getElderDetailsByEmail(currentUser.email);
        setElderDetails(response.data);

        // Fetch appointments and stats after getting elder details
        if (response.data?.elder_id) {
          await Promise.all([
            fetchAppointments(response.data.elder_id),
            fetchDashboardStats(response.data.elder_id),
          ]);
        }
      } catch (error) {
        console.error("Error fetching elder details:", error);
        setError(
          error.response?.data?.error || "Failed to fetch elder details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.email) {
      fetchElderDetails();
    }
  }, [currentUser.email]);

  const fetchDashboardStats = async (elderId) => {
    try {
      setStatsLoading(true);
      console.log("Fetching dashboard stats for elder:", elderId);

      const response = await getElderDashboardStats(elderId);
      console.log("Dashboard stats response:", response.data);

      if (response.data.success) {
        setStatsData(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Keep default values if stats fetch fails
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAppointments = async (elderId) => {
    try {
      setAppointmentsLoading(true);

      // Fetch only 2 appointments for dashboard display
      const [upcomingResponse, pastResponse] = await Promise.all([
        getUpcomingAppointments(elderId, { params: { limit: 2 } }),
        getPastAppointments(elderId, { params: { limit: 2 } }),
      ]);

      setUpcomingAppointments(upcomingResponse.data.appointments || []);
      setPastAppointments(pastResponse.data.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await cancelAppointment(elderDetails.elder_id, appointmentId);
      // Refresh appointments and stats
      await Promise.all([
        fetchAppointments(elderDetails.elder_id),
        fetchDashboardStats(elderDetails.elder_id),
      ]);
      alert("Appointment cancelled successfully");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment");
    }
  };

  const handleJoinAppointment = async (appointmentId) => {
    try {
      const response = await joinAppointment(elderDetails.elder_id, appointmentId);
      if (response.data.success) {
        // Open meeting link in new tab
        window.open(response.data.meetingLink, '_blank');
      }
    } catch (error) {
      console.error("Error joining appointment:", error);
      alert(error.response?.data?.error || "Failed to join appointment");
    }
  };

  const handleViewProfile = () => {
    navigate("/elder/profile");
  };

  const handleShowAllAppointments = () => {
    // For now, navigate to an empty page as requested
    navigate("/elder/appointments");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (dateString) => {
    if (!dateString) return { text: "N/A", urgent: false, detail: "" };
    const now = new Date();
    const appointmentDate = new Date(dateString);
    const diffTime = appointmentDate - now;

    if (diffTime < 0) return { text: "Past due", urgent: false, detail: "" };

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 7) return { text: `${diffDays} days`, urgent: false, detail: "More than a week away" };
    if (diffDays > 1) return { text: `${diffDays} days`, urgent: false, detail: `${diffHours} hours remaining` };
    if (diffHours > 2) return { text: `${diffHours} hours`, urgent: true, detail: "Today" };
    if (diffHours > 0) return { text: `${diffHours}h ${diffMinutes % 60}m`, urgent: true, detail: "Very soon!" };
    if (diffMinutes > 0) return { text: `${diffMinutes} minutes`, urgent: true, detail: "Starting soon!" };
    return { text: "Now", urgent: true, detail: "Time to join!" };
  };

  const isUpcomingAppointment = (appointment) => {
    return new Date(appointment.date_time) > new Date() && appointment.status !== "cancelled";
  };

  const getAge = (dob) => {
    if (!dob) return "N/A";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const renderAppointmentCard = (appointment) => (
    <div key={appointment.appointment_id} className={styles.appointmentCard}>
      <div className={styles.cardHeader}>
        <div className={styles.doctorInfo}>
          <div className={styles.doctorAvatar}>👨‍⚕️</div>
          <div className={styles.doctorDetails}>
            <h3>Dr. {appointment.doctor_name}</h3>
            <p className={styles.specialization}>{appointment.specialization}</p>
            <p className={styles.institution}>{appointment.current_institution}</p>
          </div>
        </div>
        <div className={styles.statusContainer}>
          <span className={
            appointment.status === "completed" || appointment.status === "cancelled"
              ? styles.statusCompleted
              : styles.statusUpcoming
          }>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
        </div>
      </div>

      <div className={styles.appointmentDetails}>
        <div className={styles.appointmentMeta}>
          <div className={styles.dateTimeGroup}>
            <div className={styles.dateInfo}>
              <span className={styles.dateText}>{formatDate(appointment.date_time)}</span>
            </div>
            <div className={styles.timeInfo}>
              <span className={styles.timeText}>{formatTime(appointment.date_time)}</span>
            </div>
          </div>
          <div className={styles.typeIndicator}>
            <span className={`${styles.typeChip} ${
              appointment.appointment_type === 'online' 
                ? styles.onlineChip 
                : styles.physicalChip
            }`}>
              {appointment.appointment_type === 'online' ? 'Online' : 'Physical'}
            </span>
          </div>
        </div>
        
        {isUpcomingAppointment(appointment) && (
          <div className={styles.timeRemainingBanner}>
            <div className={`${styles.timeRemainingContent} ${
              getTimeRemaining(appointment.date_time).urgent ? styles.urgent : styles.normal
            }`}>
              <div className={styles.timeRemainingLabel}>Starts in</div>
              <div className={styles.timeRemainingValue}>
                {getTimeRemaining(appointment.date_time).text}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        {appointment.appointment_type === 'online' && isUpcomingAppointment(appointment) && (
          <button
            className={styles.joinBtn}
            onClick={() => handleJoinAppointment(appointment.appointment_id)}
          >
            🎥 Join Meeting
          </button>
        )}
        {isUpcomingAppointment(appointment) && (
          <button
            className={styles.cancelBtn}
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to cancel this appointment?"
                )
              ) {
                handleCancelAppointment(appointment.appointment_id);
              }
            }}
          >
            ❌ Cancel
          </button>
        )}
        <button 
          onClick={() => navigate(`/elder/appointment/${appointment.appointment_id}`)}
          className={styles.detailsBtn}
        >
          📋 View Details
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Navbar />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryBtn}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Navbar />

      <div className={styles.dashboardContent}>
        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statsCard}>
            <div className={styles.statsIcon}>🩺</div>
            <div className={styles.statsContent}>
              <h3>Upcoming Appointments</h3>
              <p className={styles.statsNumber}>
                {statsLoading ? "..." : statsData.upcomingAppointments}
              </p>
            </div>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statsIcon}>🧠</div>
            <div className={styles.statsContent}>
              <h3>Upcoming Sessions</h3>
              <p className={styles.statsNumber}>
                {statsLoading ? "..." : statsData.upcomingSessions}
              </p>
            </div>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statsIcon}>📢</div>
            <div className={styles.statsContent}>
              <h3>Upcoming Activities</h3>
              <p className={styles.statsNumber}>
                {statsLoading ? "..." : statsData.upcomingCampaigns}
              </p>
            </div>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statsIcon}>📅</div>
            <div className={styles.statsContent}>
              <h3>Caregiver Visits</h3>
              <p className={styles.statsNumber}>
                {statsLoading ? "..." : statsData.assignedCaregivers}
              </p>
            </div>
          </div>
        </div>

        {/* Profile and Family Cards Container */}
        <div className={styles.profileFamilyContainer}>
          {/* Profile Summary Card */}
          <div className={styles.profileSummaryCard}>
            <div className={styles.profileSummaryContent}>
              <div className={styles.profileImageSection}>
                {elderDetails?.profile_photo ? (
                  <img
                    src={`http://localhost:5000/uploads/profiles/${elderDetails.profile_photo}`}
                    alt="Profile"
                    className={styles.profileImage}
                  />
                ) : (
                  <div className={styles.profilePlaceholder}>
                    <span>{elderDetails?.name?.charAt(0) || "E"}</span>
                  </div>
                )}
                <div className={styles.statusIndicator}></div>
              </div>

              <div className={styles.profileInfo}>
                <h2>Welcome {elderDetails?.name}</h2>
                <div className={styles.profileMeta}>
                  <span className={styles.age}>
                    Age: {getAge(elderDetails?.dob)}
                  </span>
                  <span className={styles.gender}>{elderDetails?.gender}</span>
                </div>
                <div className={styles.memberSince}>
                  Member since {formatMemberSince(elderDetails?.created_at)}
                </div>
              </div>
            </div>
          </div>

                    {/* Family Member Card */}
          {elderDetails?.family_member && (
            <div className={styles.familyMemberCard}>
              <div className={styles.familyMemberHeader}>
                <div className={styles.familyIcon}>👨‍👩‍👧‍👦</div>
                <div>
                  <h3>Your Family Contact</h3>
                  <p>Always here to help you</p>
                </div>
              </div>
              <div className={styles.familyMemberInfo}>
                <div className={styles.familyDetail}>
                  <strong>{elderDetails.family_member.name}</strong>
                </div>
                <div className={styles.familyActions}>
                  <button className={styles.callBtn}>📞</button>
                  <button className={styles.messageBtn}>💬</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appointments Section */}
        <div className={styles.appointmentsSection}>
          <div className={styles.appointmentsHeader}>
            <h2>Your Appointments</h2>
            <div className={styles.appointmentTabs}>
              <button
                className={`${styles.tabBtn} ${
                  activeTab === "upcoming" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`${styles.tabBtn} ${
                  activeTab === "past" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("past")}
              >
                Past
              </button>
            </div>
          </div>

          <div className={styles.appointmentsContent}>
            {appointmentsLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading appointments...</p>
              </div>
            ) : (
              <div className={styles.appointmentsGrid}>
                {activeTab === "upcoming" ? (
                  upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map(renderAppointmentCard)
                  ) : (
                    <div className={styles.noAppointments}>
                      <div className={styles.noAppointmentsIcon}>📅</div>
                      <h3>No Upcoming Appointments</h3>
                      <p>
                        You don't have any upcoming appointments scheduled. Book
                        a new appointment to get started.
                      </p>
                    </div>
                  )
                ) : pastAppointments.length > 0 ? (
                  pastAppointments.map(renderAppointmentCard)
                ) : (
                  <div className={styles.noAppointments}>
                    <div className={styles.noAppointmentsIcon}>📋</div>
                    <h3>No Past Appointments</h3>
                    <p>
                      You haven't had any appointments yet. Your appointment
                      history will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Show All Button */}
            <div className={styles.showAllContainer}>
              <button 
                className={styles.showAllBtn}
                onClick={handleShowAllAppointments}
              >
                Show All Appointments
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ElderDashboard;

