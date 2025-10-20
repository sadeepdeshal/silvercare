import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderCounselorChatApi } from '../../services/elderCounselorChatApi';
import Navbar from '../../components/navbar';
import ElderSidebar from '../../components/elder_sidebar';
import ElderCounselorChat from '../../components/Chat/ElderCounselorChat';
import styles from '../elder/CounselorMessages.module.css';

const CounselorMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [counselors, setCounselors] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [elderInfo, setElderInfo] = useState(null);

  // Redirect if not authenticated or not elder
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'elder')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch counselors for chat
  useEffect(() => {
    const fetchCounselorsForChat = async () => {
      if (!currentUser?.elder_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching counselors for elder:', currentUser.elder_id);
        const response = await elderCounselorChatApi.getCounselorsWithAppointments(currentUser.elder_id);
        
        if (response.success) {
          setCounselors(response.counselors);
          setElderInfo({
            elder_id: currentUser.elder_id,
            elder_name: currentUser.name
          });
        }
        
      } catch (err) {
        console.error('Error fetching counselors for chat:', err);
        setError('Failed to load counselors');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'elder') {
      fetchCounselorsForChat();
    }
  }, [currentUser]);

  // Handle counselor selection and show chat
  const handleCounselorSelect = async (counselor) => {
    setSelectedCounselor(counselor);
    setShowChat(true);
  };

  // Handle closing chat
  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedCounselor(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || dataLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.layout}>
          <ElderSidebar />
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading counselors...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.layout}>
        <ElderSidebar />
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>🧠 Counselor Chat</h1>
              <p className={styles.subtitle}>
                Connect with your mental health counselors
              </p>
            </div>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/elder/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div className={styles.mainContent}>
            {/* Counselors List */}
            <div className={styles.counselorsSection}>
              <h2 className={styles.sectionTitle}>
                🧠 Available Counselors ({counselors.length})
              </h2>
              
              {counselors.length === 0 ? (
                <div className={styles.noCounselors}>
                  <div className={styles.noCounselorsIcon}>🧠</div>
                  <h3>No Counselors Available for Chat</h3>
                  <p>
                    No counselors are currently available for chat. Counselors appear here when you have confirmed or completed appointments with them.
                  </p>
                </div>
              ) : (
                <div className={styles.counselorsList}>
                  {counselors.map((counselor) => (
                    <div 
                      key={counselor.counselor_id} 
                      className={`${styles.counselorCard} ${selectedCounselor?.counselor_id === counselor.counselor_id ? styles.selectedCounselor : ''}`}
                      onClick={() => handleCounselorSelect(counselor)}
                    >
                      <div className={styles.counselorInfo}>
                        <div className={styles.counselorHeader}>
                          <h3 className={styles.counselorName}>{counselor.counselor_name}</h3>
                          <span className={styles.appointmentCount}>{counselor.total_appointments} Session(s)</span>
                        </div>
                        
                        <div className={styles.counselorDetails}>
                          <p><strong>Email:</strong> <span>{counselor.counselor_email}</span></p>
                          <p><strong>Contact:</strong> <span>{counselor.counselor_contact}</span></p>
                        </div>
                        
                        <div className={styles.counselorStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{counselor.total_appointments}</span>
                            <span className={styles.statLabel}>Total</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{counselor.confirmed_appointments}</span>
                            <span className={styles.statLabel}>Confirmed</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{counselor.completed_appointments}</span>
                            <span className={styles.statLabel}>Completed</span>
                          </div>
                        </div>
                        
                        <div className={styles.registeredSince}>
                          Counselor since: {formatDate(counselor.counselor_registered_at)}
                        </div>
                      </div>
                      
                      <button className={styles.chatButton}>
                        💬 Chat
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Section */}
            {selectedCounselor && showChat ? (
              <div className={styles.chatSection}>
                <ElderCounselorChat 
                  currentUser={currentUser}
                  selectedCounselor={selectedCounselor}
                  onClose={handleCloseChat}
                />
              </div>
            ) : selectedCounselor ? (
              <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                  <h2 className={styles.sectionTitle}>
                    💬 Chat with {selectedCounselor.counselor_name}
                  </h2>
                </div>

                <div className={styles.chatInterface}>
                  <div className={styles.comingSoon}>
                    <h4>💬 Ready to Chat!</h4>
                    <p>Click the chat button to start messaging {selectedCounselor.counselor_name}</p>
                    <button 
                      className={styles.startChatButton}
                      onClick={() => setShowChat(true)}
                    >
                      Start Conversation
                    </button>
                    <div className={styles.contactInfo}>
                      <p><strong>Counselor Information:</strong></p>
                      <p>👨‍⚕️ {selectedCounselor.counselor_name}</p>
                      <p>📧 {selectedCounselor.counselor_email}</p>
                      <p>📞 {selectedCounselor.counselor_contact}</p>
                      <p>🎓 {selectedCounselor.specialization}</p>
                      <p>💼 {selectedCounselor.years_of_experience} years experience</p>
                      <p>🏥 {selectedCounselor.current_institution}</p>
                      <p>📜 License: {selectedCounselor.license_number}</p>
                      <p>📍 {selectedCounselor.counselor_district}</p>
                      <p>📅 {selectedCounselor.total_appointments} total sessions</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorMessages;
