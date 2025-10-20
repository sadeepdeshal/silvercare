import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caregiverElderMessageApi } from '../../services/caregiverElderMessageApi';
import Navbar from '../../components/navbar';
import ElderLayout from '../../components/ElderLayout';
import CaregiverElderChat from '../../components/Chat/CaregiverElderChat';
import styles from '../../components/css/elder/CaregiverMessages.module.css';

const ElderCaregiverMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [caregivers, setCaregivers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Redirect if not authenticated or not elder
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'elder')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch caregivers when elder is authenticated
  useEffect(() => {
    if (currentUser && currentUser.role === 'elder' && currentUser.elder_id) {
      fetchCaregivers();
    }
  }, [currentUser]);

  const fetchCaregivers = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const response = await caregiverElderMessageApi.getCaregiversForElder(currentUser.elder_id);
      
      if (response.success) {
        setCaregivers(response.caregivers);
      } else {
        setError('Failed to fetch caregivers');
      }
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      setError('Unable to load caregivers. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleCaregiverSelect = (caregiver) => {
    setSelectedCaregiver(caregiver);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedCaregiver(null);
    fetchCaregivers(); // Refresh the list
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return styles.approved;
      case 'completed':
        return styles.completed;
      case 'confirmed':
        return styles.confirmed;
      default:
        return '';
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!isAuthenticated || currentUser?.role !== 'elder') {
    return null;
  }

  // Show loading state
  if (loading || dataLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <ElderLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading caregivers...</h2>
            </div>
          </div>
        </ElderLayout>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <ElderLayout>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>🧑‍💼 Caregiver Messages</h1>
              <p className={styles.subtitle}>
                Connect and chat with your assigned caregivers
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
            {/* Caregivers List */}
            <div className={styles.caregiversSection}>
              <h2 className={styles.sectionTitle}>
                🧑‍💼 Available Caregivers ({caregivers.length})
              </h2>
              
              {caregivers.length === 0 ? (
                <div className={styles.noCaregivers}>
                  <div className={styles.noCaregiversIcon}>🧑‍💼</div>
                  <h3>No Caregivers Available for Chat</h3>
                  <p>
                    You need to have confirmed or active care assignments with caregivers 
                    to start chatting with them.
                  </p>
                  <p>
                    Contact your family member to arrange caregiver services.
                  </p>
                </div>
              ) : (
                <div className={styles.caregiversList}>
                  {caregivers.map((caregiver, index) => (
                    <div
                      key={`caregiver-${caregiver.caregiver_id}-${index}`}
                      className={`${styles.caregiverCard} ${
                        selectedCaregiver?.caregiver_id === caregiver.caregiver_id 
                          ? styles.selectedCaregiver 
                          : ''
                      }`}
                      onClick={() => handleCaregiverSelect(caregiver)}
                    >
                      <div className={styles.caregiverHeader}>
                        <div className={styles.caregiverInfo}>
                          <h3 className={styles.caregiverName}>
                            {caregiver.caregiver_name}
                          </h3>
                          <div className={styles.caregiverDetails}>
                            <span className={styles.location}>
                              � {caregiver.caregiver_district}
                            </span>
                            <span className={styles.status}>
                              Status: {caregiver.assignment_status}
                            </span>
                          </div>
                        </div>
                        <span className={`${styles.statusBadge} ${getStatusClass(caregiver.assignment_status)}`}>
                          {caregiver.assignment_status}
                        </span>
                      </div>

                      <div className={styles.caregiverMeta}>
                        <div className={styles.contactInfo}>
                          <span>📧 {caregiver.caregiver_email}</span>
                          <span>📞 {caregiver.caregiver_phone}</span>
                          {caregiver.fixed_line && (
                            <span>☎️ {caregiver.fixed_line}</span>
                          )}
                        </div>
                        
                        <div className={styles.assignmentDetails}>
                          <div className={styles.assignmentInfo}>
                            <span>Start: {formatDate(caregiver.start_date)}</span>
                            {caregiver.end_date && (
                              <span>End: {formatDate(caregiver.end_date)}</span>
                            )}
                            {caregiver.duration && (
                              <span>Duration: {caregiver.duration} days</span>
                            )}
                          </div>
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
            {selectedCaregiver && showChat ? (
              <div className={styles.chatSection}>
                <CaregiverElderChat
                  caregiverId={selectedCaregiver.caregiver_id}
                  elderUserId={currentUser.elder_id}
                  currentUserRole="elder"
                  currentUserId={currentUser.elder_id}
                  onBack={handleCloseChat}
                />
              </div>
            ) : selectedCaregiver ? (
              <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                  <h2 className={styles.sectionTitle}>
                    💬 Chat with {selectedCaregiver.caregiver_name}
                  </h2>
                  <button 
                    className={styles.startChatButton}
                    onClick={() => setShowChat(true)}
                  >
                    Start Conversation
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.chatSection}>
                <div className={styles.noChatSelected}>
                  <div className={styles.noChatIcon}>💬</div>
                  <h3>Select a Caregiver to Start Chatting</h3>
                  <p>Choose a caregiver from the list to begin your conversation.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ElderLayout>
    </div>
  );
};

export default ElderCaregiverMessages;