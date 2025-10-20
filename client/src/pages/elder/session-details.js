import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from "../../components/navbar";
import { useAuth } from '../../context/AuthContext';
import { 
  getElderDetailsByEmail, 
  getSessionById, 
  joinSession 
} from '../../services/elderApi2';
import styles from '../../components/css/elder/session-details.module.css';
import ElderLayout from '../../components/ElderLayout';
import InfoModal from '../../components/InfoModal.jsx';

const SessionDetails = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  // State management
  const [elderDetails, setElderDetails] = useState(null);
  const [session, setSession] = useState(null);
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
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        setError(null);

      // Get elder details by email
      const elderResponse = await getElderDetailsByEmail(currentUser.email);
      const elderData = elderResponse.data;
      setElderDetails(elderData);

      if (elderData?.elder_id) {
        // Get session details
        const sessionResponse = await getSessionById(elderData.elder_id, sessionId);          if (sessionResponse.data.success) {
            setSession(sessionResponse.data.session);
          } else {
            setError(sessionResponse.data.error || 'Session not found');
          }
        }
      } catch (err) {
        console.error('Error fetching session details:', err);
        setError('Failed to load session details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.email && sessionId) {
      fetchSessionDetails();
    }
  }, [currentUser.email, sessionId]);

  const handleJoinSession = async () => {
    try {
      setActionLoading(true);
      
      if (!elderDetails?.elder_id) {
        setModalMessage('Elder details not found');
        setShowInfoModal(true);
        return;
      }

      console.log('Attempting to join session:', sessionId, 'for elder:', elderDetails.elder_id);
      const response = await joinSession(elderDetails.elder_id, sessionId);
      
      console.log('Join session response:', response.data);
      
      if (response.data.success) {
        // Redirect to the meeting link
        window.open(response.data.meetingUrl, '_blank');
      } else {
        console.error('Session join failed:', response.data);
        setModalMessage(response.data.error || 'Failed to join session');
        setShowInfoModal(true);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      console.error('Error response:', error.response?.data);
      
      // Show the actual error message from the server
      const errorMessage = error.response?.data?.error || 'Failed to join session. Please try again.';
      setModalMessage(errorMessage);
      setShowInfoModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeRemaining = (dateString) => {
    const sessionDate = new Date(dateString);
    const now = new Date();
    const diff = sessionDate - now;

    if (diff <= 0) return { text: "Session has passed", urgent: false };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return { text: `${days} day${days > 1 ? 's' : ''} remaining`, urgent: false };
    } else if (hours > 1) {
      return { text: `${hours} hour${hours > 1 ? 's' : ''} remaining`, urgent: false };
    } else if (hours === 1) {
      return { text: `1 hour ${minutes} min remaining`, urgent: true };
    } else {
      return { text: `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`, urgent: true };
    }
  };

  const getStatusBadgeClass = (status, dateTime) => {
    // Return actual database status
    switch (status) {
      case 'confirmed':
        return styles.statusConfirmed;
      case 'completed':
        return styles.statusCompleted;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusUpcoming;
    }
  };

  const getStatusText = (status, dateTime) => {
    // Return actual database status
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const isUpcomingSession = (session) => {
    const sessionDate = new Date(session.date_time);
    const now = new Date();
    return sessionDate > now && session.status !== 'cancelled';
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <ElderLayout>
        <div className={styles.contentContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading session details...</p>
          </div>
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
        <div className={styles.contentContainer}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>❌</div>
            <h2>Error Loading Session</h2>
            <p>{error}</p>
            <button 
              className={styles.retryBtn}
              onClick={() => window.location.reload()}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
        </ElderLayout>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <ElderLayout>
        <div className={styles.contentContainer}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>📅</div>
            <h2>Session Not Found</h2>
            <p>The session you're looking for doesn't exist or has been removed.</p>
            <button 
              className={styles.backToListBtn}
              onClick={() => navigate('/elder/sessions')}
            >
              ← Back to Sessions
            </button>
          </div>
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
            <h1>Session Details</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={styles.statusBadge}>
                <span className={getStatusBadgeClass(session.status, session.date_time)}>
                  {getStatusText(session.status, session.date_time)}
                </span>
              </div>
              <button 
                onClick={() => navigate('/elder/sessions')}
                className={styles.backBtn}
                style={{ marginBottom: 0 }}
              >
                ← Back to Sessions
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className={styles.detailsGrid}>
          {/* Key Session Information - Most Important First */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>👨‍💼</div>
              <h2>Your Session Details</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Date & Day:</span>
                  <span className={styles.infoValue}>{formatDate(session.date_time)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Time:</span>
                  <span className={styles.infoValue}>{formatTime(session.date_time)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Session Type:</span>
                  <span className={`${styles.infoValue} ${
                    session.session_type === 'online' 
                      ? styles.onlineType 
                      : styles.physicalType
                  }`}>
                    {session.session_type === 'online' ? '💻 Video Call Session' : '🏥 In-Person Session'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Session Number:</span>
                  <span className={styles.infoValue}>#{session.session_id}</span>
                </div>
              </div>
              
              {/* Time Remaining for Upcoming Sessions */}
              {isUpcomingSession(session) && (
                <div className={styles.timeRemainingSection}>
                  <div className={`${styles.timeRemainingBanner} ${
                    getTimeRemaining(session.date_time).urgent ? styles.urgent : styles.normal
                  }`}>
                    <div className={styles.timeRemainingContent}>
                      <div className={styles.timeRemainingLabel}>Your session starts in</div>
                      <div className={styles.timeRemainingValue}>
                        {getTimeRemaining(session.date_time).text}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Counselor Information Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>👨‍💼</div>
              <h2>Your Counselor</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.counselorProfile}>
                <div className={styles.counselorAvatar}>
                  {session.counselor_name.charAt(0)}
                </div>
                <div className={styles.counselorInfo}>
                  <h3>{session.counselor_name}</h3>
                  <p className={styles.specialization}>{session.specialization}</p>
                  <p className={styles.institution}>{session.current_institution}</p>
                </div>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Experience:</span>
                  <span className={styles.infoValue}>{session.years_of_experience || 'N/A'} years</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>District:</span>
                  <span className={styles.infoValue}>{session.counselor_district || 'N/A'}</span>
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
                  <span className={styles.infoLabel}>Session Notes:</span>
                  <span className={styles.infoValue}>{session.session_notes || 'No special notes'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Session Booked:</span>
                  <span className={styles.infoValue}>
                    {new Date(session.created_at).toLocaleDateString("en-US", {
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

          {/* Session Notes - Actions Card */}
          {session.session_notes && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>📋</div>
                <h2>Session Notes</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.infoItem}>
                  <span className={styles.infoValue}>{session.session_notes}</span>
                </div>
              </div>
            </div>
          )}

          

          {/* Contact Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>📞</div>
              <h2>Contact Information</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{session.counselor_email}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue}>{session.counselor_phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionsGrid}>
          {session.session_type === 'online' && isUpcomingSession(session) && (
            <button
              className={`${styles.actionBtn} ${styles.joinBtn}`}
              onClick={handleJoinSession}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Joining...
                </>
              ) : (
                <>
                  🎥 Join Session
                </>
              )}
            </button>
          )}
          
          <button 
            className={`${styles.actionBtn} ${styles.backToListBtn}`}
            onClick={() => navigate('/elder/sessions')}
          >
            📋 Back to All Sessions
          </button>
        </div>
      </div>
      </ElderLayout>
      
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Session Join"
        message={modalMessage}
        icon="⏰"
      />
    </div>
  );
};

export default SessionDetails;
