import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { counselorElderChatApi } from '../../services/counselorElderChatApi';
import Navbar from '../../components/navbar';
import HealthProfessionalSidebar from '../../components/HealthProfessionalSidebar';
import CounselorElderChat from '../../components/Chat/CounselorElderChat';
import styles from './ElderMessages.module.css';

const ElderMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [elders, setElders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedElder, setSelectedElder] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [counselorInfo, setCounselorInfo] = useState(null);

  // Redirect if not authenticated or not health professional
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'healthprofessional')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch elders for chat
  useEffect(() => {
    const fetchEldersForChat = async () => {
      if (!currentUser?.counselor_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching elders for counselor:', currentUser.counselor_id);
        const response = await counselorElderChatApi.getEldersWithAppointments(currentUser.counselor_id);
        
        if (response.success) {
          setElders(response.elders);
          setCounselorInfo({
            counselor_id: currentUser.counselor_id,
            counselor_name: currentUser.name
          });
        }
        
      } catch (err) {
        console.error('Error fetching elders for chat:', err);
        setError('Failed to load elders');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'healthprofessional') {
      fetchEldersForChat();
    }
  }, [currentUser]);

  // Handle elder selection and show chat
  const handleElderSelect = async (elder) => {
    setSelectedElder(elder);
    setShowChat(true);
  };

  // Handle closing chat
  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedElder(null);
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
          <HealthProfessionalSidebar />
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading elders...</h2>
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
        <HealthProfessionalSidebar />
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>👴 Elder Chat</h1>
              <p className={styles.subtitle}>
                Connect with your elder patients
              </p>
            </div>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/healthprofessional/dashboard')}
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
            {/* Elders List */}
            <div className={styles.eldersSection}>
              <h2 className={styles.sectionTitle}>
                👴 Available Elders ({elders.length})
              </h2>
              
              {elders.length === 0 ? (
                <div className={styles.noElders}>
                  <div className={styles.noEldersIcon}>👴</div>
                  <h3>No Elders Available for Chat</h3>
                  <p>
                    No elders are currently available for chat. Elders appear here when you have confirmed or completed appointments with them.
                  </p>
                </div>
              ) : (
                <div className={styles.eldersList}>
                  {elders.map((elder) => (
                    <div 
                      key={elder.elder_id} 
                      className={`${styles.elderCard} ${selectedElder?.elder_id === elder.elder_id ? styles.selectedElder : ''}`}
                      onClick={() => handleElderSelect(elder)}
                    >
                      <div className={styles.elderInfo}>
                        <div className={styles.elderHeader}>
                          <div className={styles.elderAvatar}>
                            {elder.profile_photo ? (
                              <img 
                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/profiles/${elder.profile_photo}`}
                                alt={elder.elder_name}
                                className={styles.avatarImage}
                              />
                            ) : (
                              <span className={styles.avatarPlaceholder}>👴</span>
                            )}
                          </div>
                          <div className={styles.elderBasicInfo}>
                            <h3 className={styles.elderName}>{elder.elder_name}</h3>
                            <span className={styles.appointmentCount}>{elder.total_appointments} Session(s)</span>
                          </div>
                        </div>
                        
                        <div className={styles.elderDetails}>
                          <p><strong>Email:</strong> <span>{elder.elder_email}</span></p>
                          <p><strong>Contact:</strong> <span>{elder.elder_contact}</span></p>
                          <p><strong>Age:</strong> <span>{elder.age} years</span></p>
                          <p><strong>Gender:</strong> <span>{elder.gender}</span></p>
                          <p><strong>District:</strong> <span>{elder.elder_district}</span></p>
                          {elder.medical_conditions && (
                            <p><strong>Medical Conditions:</strong> <span>{elder.medical_conditions}</span></p>
                          )}
                          <p><strong>Latest Session:</strong> <span>{formatDate(elder.latest_appointment_date)}</span></p>
                        </div>
                        
                        <div className={styles.elderStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{elder.total_appointments}</span>
                            <span className={styles.statLabel}>Total</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{elder.confirmed_appointments}</span>
                            <span className={styles.statLabel}>Confirmed</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{elder.completed_appointments}</span>
                            <span className={styles.statLabel}>Completed</span>
                          </div>
                        </div>
                        
                        <div className={styles.registeredSince}>
                          Patient since: {formatDate(elder.elder_registered_at)}
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
            {selectedElder && showChat ? (
              <div className={styles.chatSection}>
                <CounselorElderChat 
                  currentUser={currentUser}
                  selectedElder={selectedElder}
                  onClose={handleCloseChat}
                />
              </div>
            ) : selectedElder ? (
              <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                  <h2 className={styles.sectionTitle}>
                    💬 Chat with {selectedElder.elder_name}
                  </h2>
                </div>

                <div className={styles.chatInterface}>
                  <div className={styles.comingSoon}>
                    <h4>💬 Ready to Chat!</h4>
                    <p>Click the chat button to start messaging {selectedElder.elder_name}</p>
                    <button 
                      className={styles.startChatButton}
                      onClick={() => setShowChat(true)}
                    >
                      Start Conversation
                    </button>
                    <div className={styles.contactInfo}>
                      <p><strong>Elder Information:</strong></p>
                      <p>👴 {selectedElder.elder_name}</p>
                      <p>📧 {selectedElder.elder_email}</p>
                      <p>📞 {selectedElder.elder_contact}</p>
                      <p>🎂 {selectedElder.age} years old</p>
                      <p>⚧ {selectedElder.gender}</p>
                      <p>📍 {selectedElder.elder_district}</p>
                      {selectedElder.medical_conditions && (
                        <p>🏥 Medical Conditions: {selectedElder.medical_conditions}</p>
                      )}
                      <p>📅 {selectedElder.total_appointments} total sessions</p>
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

export default ElderMessages;
