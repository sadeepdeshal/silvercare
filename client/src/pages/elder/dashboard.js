import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar";
import {
  getElderDetailsByEmail,
  getElderDashboardStats,
  getUpcomingAppointments,
  getPastAppointments,
  joinAppointment,
  getUpcomingSessions,
  getPastSessions,
  joinSession,
  getCareAssignmentsByWeek,
  getDayCareAssignments,
} from "../../services/elderApi2";
import styles from "../../components/css/elder/dashboard.module.css";
import ElderLayout from "../../components/ElderLayout";
import InfoModal from "../../components/InfoModal.jsx";

const ElderDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [elderDetails, setElderDetails] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [ongoingAppointments, setOngoingAppointments] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [ongoingSessions, setOngoingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [activeSessionTab, setActiveSessionTab] = useState("upcoming");
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Care assignments state
  const [careAssignments, setCareAssignments] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [careAssignmentsLoading, setCareAssignmentsLoading] = useState(false);
  const [selectedDayAssignments, setSelectedDayAssignments] = useState(null);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);

  // Real stats data from backend
  const [statsData, setStatsData] = useState({
    upcomingAppointments: 0,
    upcomingSessions: 0,
    assignedCaregivers: 0,
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);

    // Initialize current week start
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    setCurrentWeekStart(weekStart);
  }, []);

  useEffect(() => {
    const fetchElderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getElderDetailsByEmail(currentUser.email);
        setElderDetails(response.data);

        // Fetch appointments, sessions, and stats after getting elder details
        if (response.data?.elder_id) {
          await Promise.all([
            fetchAppointments(response.data.elder_id),
            fetchSessions(response.data.elder_id),
            fetchDashboardStats(response.data.elder_id),
          ]);
          // Fetch care assignments separately to avoid dependency issues
          await fetchCareAssignments(response.data.elder_id);
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
  }, [currentUser.email]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Fetch appointments
      const [upcomingResponse, pastResponse] = await Promise.all([
        getUpcomingAppointments(elderId, { params: { limit: 10 } }),
        getPastAppointments(elderId, { params: { limit: 10 } }),
      ]);

        const upcomingAppts = upcomingResponse.data.appointments || [];
        const pastAppts = pastResponse.data.appointments || [];

        // Filter ongoing appointments: started and within 30 minutes window
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

        // Check upcoming appointments that may have started (now or in past) but within 30-min window
        const ongoingFromUpcoming = upcomingAppts.filter(appt => {
          const apptTime = new Date(appt.date_time);
          const thirtyMinutesAfterStart = new Date(apptTime.getTime() + 30 * 60 * 1000);
          return apptTime <= now && now <= thirtyMinutesAfterStart;
        });

        // Check past appointments that are still within 30 minutes window from start
        const ongoingFromPast = pastAppts.filter(appt => {
          const apptTime = new Date(appt.date_time);
          const thirtyMinutesAfterStart = new Date(apptTime.getTime() + 30 * 60 * 1000);
          return apptTime <= now && now <= thirtyMinutesAfterStart;
        });      // Combine and deduplicate ongoing
      const ongoing = [...ongoingFromUpcoming, ...ongoingFromPast]
        .filter((appt, index, self) => 
          index === self.findIndex(a => a.appointment_id === appt.appointment_id)
        )
        .slice(0, 2);

      // Filter out ongoing from upcoming
      const upcoming = upcomingAppts
        .filter(appt => {
          const apptTime = new Date(appt.date_time);
          return apptTime > now;
        })
        .slice(0, 2);

      setUpcomingAppointments(upcoming);
      setOngoingAppointments(ongoing);
      setPastAppointments(pastAppts.slice(0, 2));
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchSessions = async (elderId) => {
    try {
      setSessionsLoading(true);

      // Fetch sessions
      const [upcomingResponse, pastResponse] = await Promise.all([
        getUpcomingSessions(elderId, { params: { limit: 10 } }),
        getPastSessions(elderId, { params: { limit: 10 } }),
      ]);

      const upcomingSess = upcomingResponse.data.sessions || [];
      const pastSess = pastResponse.data.sessions || [];

      // Filter ongoing sessions: started and within 30 minutes window
      const now = new Date();

      // Check upcoming sessions that may have started (now or in past) but within 30-min window
      const ongoingFromUpcoming = upcomingSess.filter(sess => {
        const sessTime = new Date(sess.date_time);
        const thirtyMinutesAfterStart = new Date(sessTime.getTime() + 30 * 60 * 1000);
        return sessTime <= now && now <= thirtyMinutesAfterStart;
      });

      // Check past sessions that are still within 30 minutes window from start
      const ongoingFromPast = pastSess.filter(sess => {
        const sessTime = new Date(sess.date_time);
        const thirtyMinutesAfterStart = new Date(sessTime.getTime() + 30 * 60 * 1000);
        return sessTime <= now && now <= thirtyMinutesAfterStart;
      });

      // Combine and deduplicate ongoing
      const ongoing = [...ongoingFromUpcoming, ...ongoingFromPast]
        .filter((sess, index, self) => 
          index === self.findIndex(s => s.session_id === sess.session_id)
        )
        .slice(0, 2);

      // Filter out ongoing from upcoming
      const upcoming = upcomingSess
        .filter(sess => {
          const sessTime = new Date(sess.date_time);
          return sessTime > now;
        })
        .slice(0, 2);

      setUpcomingSessions(upcoming);
      setOngoingSessions(ongoing);
      setPastSessions(pastSess.slice(0, 2));
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchCareAssignments = async (elderId, weekStart = null) => {
    try {
      setCareAssignmentsLoading(true);
      const startDate = weekStart || currentWeekStart;
      const response = await getCareAssignmentsByWeek(
        elderId,
        startDate.toISOString().split("T")[0]
      );

      if (response.data.success) {
        setCareAssignments(response.data.dailyAssignments);
      }
    } catch (error) {
      console.error("Error fetching care assignments:", error);
    } finally {
      setCareAssignmentsLoading(false);
    }
  };

  const handleJoinAppointment = async (appointmentId) => {
    try {
      const response = await joinAppointment(
        elderDetails.elder_id,
        appointmentId
      );
      if (response.data.success) {
        // Open meeting link in new tab
        window.open(response.data.meetingLink, "_blank");
      }
    } catch (error) {
      console.error("Error joining appointment:", error);
      const errorMessage = error.response?.data?.error || "Failed to join appointment";
      setModalMessage(errorMessage);
      setShowInfoModal(true);
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      const response = await joinSession(elderDetails.elder_id, sessionId);
      if (response.data.success) {
        // Open meeting link in new tab
        window.open(response.data.meetingUrl, "_blank");
      }
    } catch (error) {
      console.error("Error joining session:", error);
      const errorMessage = error.response?.data?.error || "Failed to join session";
      setModalMessage(errorMessage);
      setShowInfoModal(true);
    }
  };

  const handleViewProfile = () => {
    navigate("/elder/profile");
  };

  const handleShowAllAppointments = () => {
    // For now, navigate to an empty page as requested
    navigate("/elder/appointments");
  };

  const handleShowAllSessions = () => {
    // Navigate to sessions page
    navigate("/elder/sessions");
  };

  // Care assignment helper functions
  const handleWeekChange = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(
      currentWeekStart.getDate() + (direction === "next" ? 7 : -7)
    );
    setCurrentWeekStart(newWeekStart);

    if (elderDetails?.elder_id) {
      fetchCareAssignments(elderDetails.elder_id, newWeekStart);
    }
  };

  const handleDayClick = async (date, assignments) => {
    if (assignments.length === 0) return;

    try {
      const response = await getDayCareAssignments(elderDetails.elder_id, date);
      if (response.data.success) {
        setSelectedDayAssignments({
          date,
          assignments: response.data.assignments,
          dayName: new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
          }),
        });
        setShowAssignmentDetails(true);
      }
    } catch (error) {
      console.error("Error fetching day assignments:", error);
    }
  };

  const formatWeekRange = (weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startMonth = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endMonth = weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return `${startMonth} - ${endMonth}`;
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    return currentWeekStart.getTime() === thisWeekStart.getTime();
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

    if (diffDays > 7)
      return {
        text: `${diffDays} days`,
        urgent: false,
        detail: "More than a week away",
      };
    if (diffDays > 1)
      return {
        text: `${diffDays} days`,
        urgent: false,
        detail: `${diffHours} hours remaining`,
      };
    if (diffHours > 2)
      return { text: `${diffHours} hours`, urgent: true, detail: "Today" };
    if (diffHours > 0)
      return {
        text: `${diffHours}h ${diffMinutes % 60}m`,
        urgent: true,
        detail: "Very soon!",
      };
    if (diffMinutes > 0)
      return {
        text: `${diffMinutes} minutes`,
        urgent: true,
        detail: "Starting soon!",
      };
    return { text: "Now", urgent: true, detail: "Time to join!" };
  };

  const isUpcomingAppointment = (appointment) => {
    return (
      new Date(appointment.date_time) > new Date() &&
      appointment.status !== "cancelled"
    );
  };

  const canJoinAppointment = (appointment) => {
    // Can join if: online appointment AND (upcoming OR ongoing - within 30 min after start)
    if (appointment.appointment_type !== 'online') return false;
    
    const now = new Date();
    const apptTime = new Date(appointment.date_time);
    const thirtyMinutesAfterStart = new Date(apptTime.getTime() + 30 * 60 * 1000);
    
    // Can join if appointment hasn't started yet OR started but within 30 minutes
    return (apptTime > now || (apptTime <= now && now <= thirtyMinutesAfterStart)) 
           && appointment.status !== "cancelled";
  };

  const isUpcomingSession = (session) => {
    return (
      new Date(session.date_time) > new Date() && session.status !== "cancelled"
    );
  };

  const canJoinSession = (session) => {
    // Can join if: online session AND (upcoming OR ongoing - within 30 min after start)
    if (session.session_type !== 'online') return false;
    
    const now = new Date();
    const sessTime = new Date(session.date_time);
    const thirtyMinutesAfterStart = new Date(sessTime.getTime() + 30 * 60 * 1000);
    
    // Can join if session hasn't started yet OR started but within 30 minutes
    return (sessTime > now || (sessTime <= now && now <= thirtyMinutesAfterStart)) 
           && session.status !== "cancelled";
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
            <p className={styles.specialization}>
              {appointment.specialization}
            </p>
            <p className={styles.institution}>
              {appointment.current_institution}
            </p>
          </div>
        </div>
        <div className={styles.statusContainer}>
          <span
            className={
              appointment.status === "cancelled"
                ? styles.statusCompleted
                : appointment.status === "completed"
                ? styles.statusCompleted
                : styles.statusUpcoming
            }
          >
            {appointment.status.charAt(0).toUpperCase() +
              appointment.status.slice(1)}
          </span>
        </div>
      </div>

      <div className={styles.appointmentDetails}>
        <div className={styles.appointmentMeta}>
          <div className={styles.dateTimeGroup}>
            <div className={styles.dateInfo}>
              <span className={styles.dateText}>
                {formatDate(appointment.date_time)}
              </span>
            </div>
            <div className={styles.timeInfo}>
              <span className={styles.timeText}>
                {formatTime(appointment.date_time)}
              </span>
            </div>
          </div>
          <div className={styles.typeIndicator}>
            <span
              className={`${styles.typeChip} ${
                appointment.appointment_type === "online"
                  ? styles.onlineChip
                  : styles.physicalChip
              }`}
            >
              {appointment.appointment_type === "online"
                ? "Online"
                : "Physical"}
            </span>
          </div>
        </div>

        {isUpcomingAppointment(appointment) && (
          <div className={styles.timeRemainingBanner}>
            <div
              className={`${styles.timeRemainingContent} ${
                getTimeRemaining(appointment.date_time).urgent
                  ? styles.urgent
                  : styles.normal
              }`}
            >
              <div className={styles.timeRemainingLabel}>Starts in</div>
              <div className={styles.timeRemainingValue}>
                {getTimeRemaining(appointment.date_time).text}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        {canJoinAppointment(appointment) && (
          <button
            className={styles.joinBtn}
            onClick={() => handleJoinAppointment(appointment.appointment_id)}
          >
            🎥 Join Now
          </button>
        )}
        <button
          onClick={() =>
            navigate(`/elder/appointment/${appointment.appointment_id}`)
          }
          className={styles.detailsBtn}
        >
          📋 View Details
        </button>
      </div>
    </div>
  );

  const renderSessionCard = (session) => (
    <div key={session.session_id} className={styles.appointmentCard}>
      <div className={styles.cardHeader}>
        <div className={styles.doctorInfo}>
          <div className={styles.doctorAvatar}>👨‍💼</div>
          <div className={styles.doctorDetails}>
            <h3>{session.counselor_name}</h3>
            <p className={styles.specialization}>{session.specialization}</p>
            <p className={styles.institution}>{session.current_institution}</p>
          </div>
        </div>
        <div className={styles.statusContainer}>
          <span
            className={
              session.status === "cancelled"
                ? styles.statusCancelled
                : session.status === "completed"
                ? styles.statusCompleted
                : session.status === "confirmed"
                ? styles.statusConfirmed
                : styles.statusUpcoming
            }
          >
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
        </div>
      </div>

      <div className={styles.appointmentDetails}>
        <div className={styles.appointmentMeta}>
          <div className={styles.dateTimeGroup}>
            <div className={styles.dateInfo}>
              <span className={styles.dateText}>
                {formatDate(session.date_time)}
              </span>
            </div>
            <div className={styles.timeInfo}>
              <span className={styles.timeText}>
                {formatTime(session.date_time)}
              </span>
            </div>
          </div>
          <div className={styles.typeIndicator}>
            <span
              className={`${styles.typeChip} ${
                session.session_type === "online"
                  ? styles.onlineChip
                  : styles.physicalChip
              }`}
            >
              {session.session_type === "online" ? "Online" : "Physical"}
            </span>
          </div>
        </div>

        {isUpcomingSession(session) && (
          <div className={styles.timeRemainingBanner}>
            <div
              className={`${styles.timeRemainingContent} ${
                getTimeRemaining(session.date_time).urgent
                  ? styles.urgent
                  : styles.normal
              }`}
            >
              <div className={styles.timeRemainingLabel}>Starts in</div>
              <div className={styles.timeRemainingValue}>
                {getTimeRemaining(session.date_time).text}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        {canJoinSession(session) && (
          <button
            className={styles.joinBtn}
            onClick={() => handleJoinSession(session.session_id)}
          >
            🎥 Join Now
          </button>
        )}
        <button
          onClick={() => navigate(`/elder/session/${session.session_id}`)}
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
        <ElderLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your dashboard...</p>
        </div>
        </ElderLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Navbar />
        <ElderLayout>
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
        </ElderLayout>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Navbar />
      <ElderLayout>
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
              <div className={styles.statsIcon}>🧑‍🤝‍🧑</div>
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
                    <span className={styles.gender}>
                      {elderDetails?.gender}
                    </span>
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
                    
                    <button 
                      className={styles.messageBtn}
                      onClick={() => navigate('/elder/family-chat')}
                    >
                      💬
                    </button>
                    
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
                  {statsData.upcomingAppointments > 0 && (
                    <span className={styles.countBadge}>
                      {statsData.upcomingAppointments}
                    </span>
                  )}
                </button>
                <button
                  className={`${styles.tabBtn} ${
                    activeTab === "ongoing" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab("ongoing")}
                >
                  Ongoing
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
                          You don't have any upcoming appointments scheduled.
                          Book a new appointment to get started.
                        </p>
                      </div>
                    )
                  ) : activeTab === "ongoing" ? (
                    ongoingAppointments.length > 0 ? (
                      ongoingAppointments.map(renderAppointmentCard)
                    ) : (
                      <div className={styles.noAppointments}>
                        <div className={styles.noAppointmentsIcon}>⏱️</div>
                        <h3>No Ongoing Appointments</h3>
                        <p>
                          You don't have any appointments currently in progress.
                          Check back when your appointment time arrives.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className={styles.noAppointments}>
                      <div className={styles.noAppointmentsIcon}>📋</div>
                      <h3>No Ongoing Appointments</h3>
                      <p>
                        You don't have any appointments currently in progress.
                        Check back when your appointment time arrives.
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

          {/* Care Assignments Section */}
          <div className={styles.appointmentsSection}>
            <div className={styles.appointmentsHeader}>
              <h2>Your Care Assignments</h2>
              <div className={styles.weekNavigation}>
                <button
                  className={styles.weekNavBtn}
                  onClick={() => handleWeekChange("prev")}
                >
                  &#8249; Previous Week
                </button>
                <div className={styles.weekRange}>
                  <span>{formatWeekRange(currentWeekStart)}</span>
                  {!isCurrentWeek() && (
                    <button
                      className={styles.currentWeekBtn}
                      onClick={() => {
                        const today = new Date();
                        const thisWeekStart = new Date(today);
                        thisWeekStart.setDate(today.getDate() - today.getDay());
                        thisWeekStart.setHours(0, 0, 0, 0);
                        setCurrentWeekStart(thisWeekStart);
                        if (elderDetails?.elder_id) {
                          fetchCareAssignments(
                            elderDetails.elder_id,
                            thisWeekStart
                          );
                        }
                      }}
                    >
                      This Week
                    </button>
                  )}
                </div>
                <button
                  className={`${styles.weekNavBtn} ${styles.nextWeekBtn}`}
                  onClick={() => handleWeekChange("next")}
                >
                  Next Week &#8250;
                </button>
              </div>
            </div>

            <div className={styles.careAssignmentContent}>
              {careAssignmentsLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading care assignments...</p>
                </div>
              ) : (
                <div className={styles.weekGrid}>
                  {careAssignments.map((day, index) => (
                    <div
                      key={day.date}
                      className={`${styles.dayCard} ${
                        day.isToday ? styles.todayCard : ""
                      } ${
                        day.assignments.length > 0 ? styles.hasAssignment : ""
                      }`}
                      onClick={() => handleDayClick(day.date, day.assignments)}
                    >
                      <div className={styles.dayHeader}>
                        <div className={styles.dayName}>{day.dayName}</div>
                        <div className={styles.dayDate}>
                          {new Date(day.date).getDate()}
                        </div>
                      </div>
                      <div className={styles.dayContent}>
                        {day.assignments.length > 0 ? (
                          <div className={styles.assignmentsList}>
                            {day.assignments.map((assignment, idx) => (
                              <div key={idx} className={styles.assignmentItem}>
                                <div className={styles.caregiverName}>
                                  {assignment.caregiver_name}
                                </div>
                                {/* Removed duration field from day card */}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.noAssignment}>
                            <span>No caregiver</span>
                          </div>
                        )}
                      </div>
                      {day.isToday && (
                        <div className={styles.todayIndicator}>Today</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sessions Section */}
          <div className={styles.appointmentsSection}>
            <div className={styles.appointmentsHeader}>
              <h2>Your Counselling Sessions</h2>
              <div className={styles.appointmentTabs}>
                <button
                  className={`${styles.tabBtn} ${
                    activeSessionTab === "upcoming" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveSessionTab("upcoming")}
                >
                  Upcoming
                  {statsData.upcomingSessions > 0 && (
                    <span className={styles.countBadge}>
                      {statsData.upcomingSessions}
                    </span>
                  )}
                </button>
                <button
                  className={`${styles.tabBtn} ${
                    activeSessionTab === "ongoing" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveSessionTab("ongoing")}
                >
                  Ongoing
                </button>
              </div>
            </div>

            <div className={styles.appointmentsContent}>
              {sessionsLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading sessions...</p>
                </div>
              ) : (
                <div className={styles.appointmentsGrid}>
                  {activeSessionTab === "upcoming" ? (
                    upcomingSessions.length > 0 ? (
                      upcomingSessions.map(renderSessionCard)
                    ) : (
                      <div className={styles.noAppointments}>
                        <div className={styles.noAppointmentsIcon}>🧠</div>
                        <h3>No Upcoming Sessions</h3>
                        <p>
                          You don't have any upcoming counselling sessions
                          scheduled. Book a new session to get started.
                        </p>
                      </div>
                    )
                  ) : activeSessionTab === "ongoing" ? (
                    ongoingSessions.length > 0 ? (
                      ongoingSessions.map(renderSessionCard)
                    ) : (
                      <div className={styles.noAppointments}>
                        <div className={styles.noAppointmentsIcon}>⏱️</div>
                        <h3>No Ongoing Sessions</h3>
                        <p>
                          You don't have any counselling sessions currently in progress.
                          Check back when your session time arrives.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className={styles.noAppointments}>
                      <div className={styles.noAppointmentsIcon}>📋</div>
                      <h3>No Ongoing Sessions</h3>
                      <p>
                        You don't have any counselling sessions currently in progress.
                        Check back when your session time arrives.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Show All Button */}
              <div className={styles.showAllContainer}>
                <button
                  className={styles.showAllBtn}
                  onClick={handleShowAllSessions}
                >
                  Show All Sessions
                </button>
              </div>
            </div>
          </div>

          {/* Care Assignment Details Modal */}
          {showAssignmentDetails && selectedDayAssignments && (
            <div
              className={styles.modal}
              onClick={() => setShowAssignmentDetails(false)}
            >
              <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h3>
                    Care Assignments for {selectedDayAssignments.dayName}
                    <span className={styles.modalDate}>
                      {new Date(
                        selectedDayAssignments.date
                      ).toLocaleDateString()}
                    </span>
                  </h3>
                  <button
                    className={styles.closeBtn}
                    onClick={() => setShowAssignmentDetails(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.modalBody}>
                  {selectedDayAssignments.assignments.map(
                    (assignment, index) => (
                      <div key={index} className={styles.assignmentDetail}>
                        <div className={styles.caregiverHeader}>
                          <div className={styles.caregiverAvatar}>👨‍⚕️</div>
                          <div className={styles.caregiverInfo}>
                            <h4>{assignment.caregiver_name}</h4>
                            <p className={styles.caregiverDistrict}>
                              {assignment.caregiver_district}
                            </p>
                          </div>
                        </div>
                        <div className={styles.assignmentInfo}>
                          {/* Removed duration field from modal */}
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>
                              Care Period:
                            </span>
                            <span className={styles.infoValue}>
                              {new Date(
                                assignment.start_date
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                assignment.end_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Status:</span>
                            <span
                              className={`${styles.infoValue} ${
                                styles.statusBadge
                              } ${
                                styles[
                                  `status${
                                    assignment.status.charAt(0).toUpperCase() +
                                    assignment.status.slice(1)
                                  }`
                                ]
                              }`}
                            >
                              {assignment.status.charAt(0).toUpperCase() +
                                assignment.status.slice(1)}
                            </span>
                          </div>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Phone:</span>
                            <span className={styles.infoValue}>
                              {assignment.caregiver_phone}
                            </span>
                          </div>
                          {assignment.caregiver_fixed_line && (
                            <div className={styles.infoItem}>
                              <span className={styles.infoLabel}>
                                Fixed Line:
                              </span>
                              <span className={styles.infoValue}>
                                {assignment.caregiver_fixed_line}
                              </span>
                            </div>
                          )}
                          {/* Certifications field removed as requested */}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ElderLayout>
      
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Join Meeting"
        message={modalMessage}
        icon="⏰"
      />
    </div>
  );
};

export default ElderDashboard;
