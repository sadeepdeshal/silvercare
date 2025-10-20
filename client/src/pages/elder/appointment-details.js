import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/navbar";
import {
  getElderDetailsByEmail,
  getAppointmentById,
  joinAppointment,
} from "../../services/elderApi2";
import styles from "../../components/css/elder/appointment-details.module.css";
import ElderLayout from "../../components/ElderLayout";
import InfoModal from "../../components/InfoModal.jsx";

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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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

  const handleJoinAppointment = async () => {
    try {
      setActionLoading(true);
      const response = await joinAppointment(elderDetails.elder_id, appointmentId);
      if (response.data.success) {
        window.open(response.data.meetingLink, '_blank');
      }
    } catch (error) {
      console.error("Error joining appointment:", error);
      const errorMessage = error.response?.data?.error || "Failed to join appointment";
      setModalMessage(errorMessage);
      setShowInfoModal(true);
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
    if (status === "confirmed") return styles.statusConfirmed;
    if (new Date(dateTime) < new Date()) return styles.statusPast;
    return styles.statusUpcoming;
  };

  const getStatusText = (status, dateTime) => {
    if (status === "cancelled") return "Cancelled";
    if (status === "completed") return "Completed";
    if (status === "confirmed") return "Confirmed";
    if (new Date(dateTime) < new Date()) return "Past";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isUpcomingAppointment = (appointment) => {
    if (!appointment) return false;
    return new Date(appointment.date_time) > new Date() && appointment.status !== "cancelled";
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <ElderLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading appointment details...</p>
        </div>
        </ElderLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <ElderLayout>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Error Loading Appointment</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/elder/appointments")} className={styles.retryBtn}>
            Back to Appointments
          </button>
        </div>
        </ElderLayout>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <ElderLayout>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>📅</div>
          <h2>Appointment Not Found</h2>
          <p>The appointment you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/elder/appointments")} className={styles.retryBtn}>
            Back to Appointments
          </button>
        </div>
        </ElderLayout>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <ElderLayout>
      <div className={styles.contentContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Appointment Details</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={styles.statusBadge}>
                <span className={getStatusBadgeClass(appointment.status, appointment.date_time)}>
                  {getStatusText(appointment.status, appointment.date_time)}
                </span>
              </div>
              <button 
                onClick={() => navigate("/elder/appointments")}
                className={styles.backBtn}
                style={{ marginBottom: 0 }}
              >
                ← Back to Appointments
              </button>
            </div>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          {/* Key Appointment Information - Most Important First */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>📅</div>
              <h2>Your Appointment Details</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Date & Day:</span>
                  <span className={styles.infoValue}>{formatDate(appointment.date_time)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Time:</span>
                  <span className={styles.infoValue}>{formatTime(appointment.date_time)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Meeting Type:</span>
                  <span className={`${styles.infoValue} ${
                    appointment.appointment_type === 'online' 
                      ? styles.onlineType 
                      : styles.physicalType
                  }`}>
                    {appointment.appointment_type === 'online' ? '💻 Video Call Meeting' : '🏥 Home Visit'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Appointment Number:</span>
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
                      <div className={styles.timeRemainingLabel}>Your appointment starts in</div>
                      <div className={styles.timeRemainingValue}>
                        {getTimeRemaining(appointment.date_time).text}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Doctor Information Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>👨‍⚕️</div>
              <h2>Your Doctor</h2>
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
                  <span className={styles.infoLabel}>Experience:</span>
                  <span className={styles.infoValue}>{appointment.years_experience || 'N/A'} years</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Contact Number:</span>
                  <span className={styles.infoValue}>{appointment.doctor_contact || 'Will be provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>📝</div>
              <h2>Additional Information</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Special Notes:</span>
                  <span className={styles.infoValue}>{appointment.notes || 'No special instructions'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Appointment Booked:</span>
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
              </div>
            </div>
          </div>

          {/* What You Can Do - Actions Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>⚡</div>
              <h2>What You Can Do</h2>
            </div>
            <div className={styles.cardContent}>
              {!isUpcomingAppointment(appointment) && (
                <div className={styles.physicalInstructions}>
                  <div className={styles.instructionHeader}>
                    <div className={styles.instructionIcon}>✅</div>
                    <h3>Appointment Status</h3>
                  </div>
                  <div className={styles.instructionList}>
                    <p>• Your appointment has ended.</p>
                    <p>• You can view all appointments in the "All Appointments" section.</p>
                    <p>• If you need another appointment, please book a new one.</p>
                  </div>
                </div>
              )}

              {/* Instructions for Physical Appointments */}
              {appointment.appointment_type === 'physical' && isUpcomingAppointment(appointment) && (
                <div className={styles.physicalInstructions}>
                  <div className={styles.instructionHeader}>
                    <div className={styles.instructionIcon}>🧑‍🏫</div>
                    <h3>For Your Home Visit</h3>
                  </div>
                  <div className={styles.instructionList}>
                    <p>• The doctor will come to your home at the scheduled appointment time.</p>
                    <p>• Please ensure someone is available to welcome the doctor.</p>
                    <p>• Have your identification and any previous medical records ready if available.</p>
                    <p>• If you have pets, please secure them for the doctor's visit.</p>
                    <p>• If you have questions, contact the service provider directly.</p>
                  </div>
                </div>
              )}

              {/* Instructions for Online Appointments */}
              {appointment.appointment_type === 'online' && isUpcomingAppointment(appointment) && (
                <div className={styles.onlineInstructions}>
                  <div className={styles.instructionHeader}>
                    <div className={styles.instructionIcon}>💻</div>
                    <h3>For Your Video Call</h3>
                  </div>
                  <div className={styles.instructionList}>
                    <p>• Make sure your device (phone, tablet, or computer) is charged and has a stable internet connection.</p>
                    <p>• Find a quiet and comfortable place for your appointment.</p>
                    <p>• Keep your camera and microphone enabled for the call.</p>
                    <p>• Have your identification and any medical records ready if needed.</p>
                    <p>• Click the "Join Video Call Now" button below when it's time for your appointment.</p>
                  </div>
                </div>
              )}

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
                        Connecting...
                      </>
                    ) : (
                      <>
                        🎥 Join Video Call Now
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => navigate("/elder/appointments")}
                  className={`${styles.actionBtn} ${styles.backToListBtn}`}
                >
                  📋 View All My Appointments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </ElderLayout>
      
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Join Appointment"
        message={modalMessage}
        icon="⏰"
      />
    </div>
  );
};

export default AppointmentDetails;
