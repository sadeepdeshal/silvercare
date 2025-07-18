import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/navbar";
import {
  getElderDetailsByEmail,
  getAppointmentById,
  cancelAppointment,
  joinAppointment,
} from "../../services/elderApi2";
import styles from "../../components/css/elder/appointment-details.module.css";

const AppointmentDetails = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  
  // State management
  const [elderDetails, setElderDetails] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get elder details first
        const elderResponse = await getElderDetailsByEmail(currentUser.email);
        setElderDetails(elderResponse.data);

        // Then fetch appointment details
        if (elderResponse.data?.elder_id) {
          const appointmentResponse = await getAppointmentById(elderResponse.data.elder_id, appointmentId);
          setAppointment(appointmentResponse.data.appointment);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.response?.data?.error || "Failed to fetch appointment details");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.email && appointmentId) {
      fetchData();
    }
  }, [currentUser.email, appointmentId]);

  const handleCancelAppointment = async () => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      setActionLoading(true);
      await cancelAppointment(elderDetails.elder_id, appointmentId);
      
      // Refresh appointment data
      const appointmentResponse = await getAppointmentById(elderDetails.elder_id, appointmentId);
      setAppointment(appointmentResponse.data.appointment);
      
      alert("Appointment cancelled successfully");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinAppointment = async () => {
    try {
      setActionLoading(true);
      const response = await joinAppointment(elderDetails.elder_id, appointmentId);
      if (response.data.success) {
        window.open(response.data.meetingLink, '_blank');
      }
    } catch (error) {
      console.error("Error joining appointment:", error);
      alert(error.response?.data?.error || "Failed to join appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
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

  const getStatusBadgeClass = (status, dateTime) => {
    if (status === "cancelled") return styles.statusCancelled;
    if (status === "completed") return styles.statusCompleted;
    if (new Date(dateTime) < new Date()) return styles.statusPast;
    return styles.statusUpcoming;
  };

  const getStatusText = (status, dateTime) => {
    if (status === "cancelled") return "Cancelled";
    if (status === "completed") return "Completed";
    if (new Date(dateTime) < new Date()) return "Past";
    return "Upcoming";
  };

  const canCancelAppointment = (appointment) => {
    if (!appointment) return false;
    if (appointment.status === "cancelled" || appointment.status === "completed") return false;
    return new Date(appointment.date_time) > new Date();
  };

  const isUpcomingAppointment = (appointment) => {
    if (!appointment) return false;
    return new Date(appointment.date_time) > new Date() && appointment.status !== "cancelled";
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Error Loading Appointment</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/elder/appointments")} className={styles.retryBtn}>
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>📅</div>
          <h2>Appointment Not Found</h2>
          <p>The appointment you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/elder/appointments")} className={styles.retryBtn}>
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      
      <div className={styles.contentContainer}>
        {/* Header */}
        <div className={styles.header}>
          <button 
            onClick={() => navigate("/elder/appointments")}
            className={styles.backBtn}
          >
            ← Back to Appointments
          </button>
          <div className={styles.headerContent}>
            <h1>Appointment Details</h1>
            <div className={styles.statusBadge}>
              <span className={getStatusBadgeClass(appointment.status, appointment.date_time)}>
                {getStatusText(appointment.status, appointment.date_time)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          {/* Doctor Information Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>👨‍⚕️</div>
              <h2>Doctor Information</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.doctorProfile}>
                <div className={styles.doctorAvatar}>
                  {appointment.doctor_name.charAt(0)}
                </div>
                <div className={styles.doctorInfo}>
                  <h3>Dr. {appointment.doctor_name}</h3>
                  <p className={styles.specialization}>{appointment.specialization}</p>
                  <p className={styles.institution}>{appointment.current_institution}</p>
                </div>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Years of Experience:</span>
                  <span className={styles.infoValue}>{appointment.experience_years || 'N/A'} years</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Contact:</span>
                  <span className={styles.infoValue}>{appointment.doctor_contact || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Information Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>📅</div>
              <h2>Appointment Information</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Date:</span>
                  <span className={styles.infoValue}>{formatDate(appointment.date_time)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Time:</span>
                  <span className={styles.infoValue}>{formatTime(appointment.date_time)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Type:</span>
                  <span className={`${styles.infoValue} ${
                    appointment.appointment_type === 'online' 
                      ? styles.onlineType 
                      : styles.physicalType
                  }`}>
                    {appointment.appointment_type === 'online' ? '💻 Online Meeting' : '🏥 Physical Visit'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Appointment ID:</span>
                  <span className={styles.infoValue}>#{appointment.appointment_id}</span>
                </div>
              </div>
              
              {/* Time Remaining for Upcoming Appointments */}
              {isUpcomingAppointment(appointment) && (
                <div className={styles.timeRemainingSection}>
                  <div className={`${styles.timeRemainingBanner} ${
                    getTimeRemaining(appointment.date_time).urgent ? styles.urgent : styles.normal
                  }`}>
                    <div className={styles.timeRemainingContent}>
                      <div className={styles.timeRemainingLabel}>Appointment starts in</div>
                      <div className={styles.timeRemainingValue}>
                        {getTimeRemaining(appointment.date_time).text}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes and Additional Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>📝</div>
              <h2>Additional Information</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Notes:</span>
                  <span className={styles.infoValue}>{appointment.notes || 'No notes provided'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Created:</span>
                  <span className={styles.infoValue}>
                    {new Date(appointment.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {appointment.appointment_type === 'physical' && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Location:</span>
                    <span className={styles.infoValue}>
                      {appointment.current_institution}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>⚡</div>
              <h2>Actions</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.actionsGrid}>
                {appointment.appointment_type === 'online' && isUpcomingAppointment(appointment) && (
                  <button
                    onClick={handleJoinAppointment}
                    disabled={actionLoading}
                    className={`${styles.actionBtn} ${styles.joinBtn}`}
                  >
                    {actionLoading ? (
                      <>
                        <div className={styles.buttonSpinner}></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        🎥 Join Online Meeting
                      </>
                    )}
                  </button>
                )}
                {canCancelAppointment(appointment) && (
                  <button
                    onClick={handleCancelAppointment}
                    disabled={actionLoading}
                    className={`${styles.actionBtn} ${styles.cancelBtn}`}
                  >
                    {actionLoading ? (
                      <>
                        <div className={styles.buttonSpinner}></div>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        ❌ Cancel Appointment
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => navigate("/elder/appointments")}
                  className={`${styles.actionBtn} ${styles.backToListBtn}`}
                >
                  📋 Back to All Appointments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
