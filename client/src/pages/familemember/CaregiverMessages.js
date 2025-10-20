import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caregivermessageApi } from '../../services/caregivermessageApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import CaregiverChat from '../../components/Chat/CaregiverChat';
import styles from '../../components/css/familymember/CaregiverMessages.module.css';

const CaregiverMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [caregivers, setCaregivers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Redirect if not authenticated or not family member
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'family_member')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch caregivers with assignments
  useEffect(() => {
    const fetchCaregiversWithAssignments = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await caregivermessageApi.getCaregiversWithAssignments(currentUser.user_id);
        
        if (response.success) {
          setCaregivers(response.caregivers);
        }
        
      } catch (err) {
        console.error('Error fetching caregivers with assignments:', err);
        setError('Failed to load caregivers');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchCaregiversWithAssignments();
    }
  }, [currentUser]);

  // Handle caregiver selection and show chat
  const handleCaregiverSelect = async (caregiver) => {
    setSelectedCaregiver(caregiver);
    setShowChat(true);
  };

  // Handle closing chat
  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedCaregiver(null);
  };

  const formatDate = (dateString) => {
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
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading caregivers...</h2>
            </div>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <FamilyMemberLayout>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>🤝 Caregiver Messages</h1>
              <p className={styles.subtitle}>
                Chat with caregivers who are caring for your registered elders
              </p>
            </div>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/family-member/dashboard')}
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
                👩‍⚕️ Available Caregivers ({caregivers.length})
              </h2>
              
              {caregivers.length === 0 ? (
                <div className={styles.noCaregivers}>
                  <div className={styles.noCaregiversIcon}>👩‍⚕️</div>
                  <h3>No Caregivers Available for Chat</h3>
                  <p>
                    You can only message caregivers who have ongoing or completed 
                    care assignments with your registered elders.
                  </p>
                  <button 
                    className={styles.bookCareButton}
                    onClick={() => navigate('/family-member/caregivers')}
                  >
                    Find Caregivers
                  </button>
                </div>
              ) : (
                <div className={styles.caregiversList}>
                  {caregivers.map((caregiver) => (
                    <div 
                      key={caregiver.caregiver_id} 
                      className={`${styles.caregiverCard} ${selectedCaregiver?.caregiver_id === caregiver.caregiver_id ? styles.selectedCaregiver : ''}`}
                      onClick={() => handleCaregiverSelect(caregiver)}
                    >
                      <div className={styles.caregiverInfo}>
                        <div className={styles.caregiverHeader}>
                          <h3 className={styles.caregiverName}>{caregiver.caregiver_name}</h3>
                          <div className={styles.statusContainer}>
                            <span className={styles.availability}>{caregiver.availability}</span>
                          </div>
                        </div>
                        
                        <div className={styles.caregiverDetails}>
                          <p><strong>District:</strong> <span>{caregiver.district}</span></p>
                          <p><strong>Availability:</strong> <span>{caregiver.availability}</span></p>
                          <p><strong>Caring for:</strong> <span>{caregiver.assigned_elders}</span></p>
                        </div>
                        
                        <div className={styles.assignmentStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{caregiver.total_assignments}</span>
                            <span className={styles.statLabel}>Total</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{caregiver.active_assignments}</span>
                            <span className={styles.statLabel}>Active</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{caregiver.completed_assignments}</span>
                            <span className={styles.statLabel}>Completed</span>
                          </div>
                        </div>
                        
                        <div className={styles.lastAssignment}>
                          Latest assignment: {formatDate(caregiver.latest_assignment_date)}
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

            {/* Chat/History Section */}
            {selectedCaregiver && showChat ? (
              <div className={styles.chatSection}>
                <CaregiverChat 
                  currentUser={currentUser}
                  selectedCaregiver={selectedCaregiver}
                  onClose={handleCloseChat}
                />
              </div>
            ) : selectedCaregiver ? (
              <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                  <h2 className={styles.sectionTitle}>
                    💬 Chat with {selectedCaregiver.caregiver_name}
                  </h2>
                </div>

                <div className={styles.caregiverDetails}>
                  <div className={styles.chatInterface}>
                    <div className={styles.comingSoon}>
                      <h4>💬 Ready to Chat!</h4>
                      <p>Click the chat button to start messaging {selectedCaregiver.caregiver_name}</p>
                      <button 
                        className={styles.startChatButton}
                        onClick={() => setShowChat(true)}
                      >
                        Start Conversation
                      </button>
                      <div className={styles.contactInfo}>
                        <p><strong>Contact {selectedCaregiver.caregiver_name}:</strong></p>
                        <p>📧 {selectedCaregiver.caregiver_email}</p>
                        <p>📞 {selectedCaregiver.caregiver_phone}</p>
                        <p>🏠 {selectedCaregiver.district}</p>
                        <p>📊 {selectedCaregiver.availability}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default CaregiverMessages;