import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caregiverElderMessageApi } from '../../services/caregiverElderMessageApi';
import Navbar from '../../components/navbar';
import CaregiverLayout from '../../components/CaregiverLayout';
import CaregiverElderChat from '../../components/Chat/CaregiverElderChat';
import styles from '../../components/css/caregiver/CaregiverElderMessages.module.css';

const CaregiverElderMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [elders, setElders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedElder, setSelectedElder] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Redirect if not authenticated or not caregiver
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'caregiver')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch elders when caregiver is authenticated
  useEffect(() => {
    if (currentUser && currentUser.role === 'caregiver' && currentUser.caregiver_id) {
      fetchElders();
    }
  }, [currentUser]);

  const fetchElders = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const response = await caregiverElderMessageApi.getEldersForCaregiver(currentUser.caregiver_id);
      
      if (response.success) {
        setElders(response.elders);
      } else {
        setError('Failed to fetch elders');
      }
    } catch (error) {
      console.error('Error fetching elders:', error);
      setError('Unable to load elders. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleElderSelect = (elder) => {
    setSelectedElder(elder);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedElder(null);
    fetchElders(); // Refresh the list
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
  if (!isAuthenticated || currentUser?.role !== 'caregiver') {
    return null;
  }



  return (
    <>
      <Navbar />
      <CaregiverLayout>
      <div className={styles.container}>
        <div className={styles.content}>
          <button 
              className={styles.backButton}
              onClick={() => navigate('/caregiver/dashboard')}
            >
              ← Back to Dashboard
            </button>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Elder Messages</h1>
              <p className={styles.subtitle}>
                Connect and chat with elders you're assigned to care for
              </p>
            </div>
            
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
                👴🏻 Assigned Elders ({elders.length})
              </h2>
              
              {dataLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <h2>Loading your assigned elders...</h2>
                </div>
              ) : elders.length === 0 ? (
                <div className={styles.noElders}>
                  <div className={styles.noEldersIcon}>👴🏻</div>
                  <h3>No Elders Assigned</h3>
                  <p>
                    You don't have any active elder assignments yet. 
                    Once you're assigned to care for elders, you'll be able to message them here.
                  </p>
                  <p>
                    Check your dashboard for new care requests or contact your supervisor for more information.
                  </p>
                </div>
              ) : (
                <div className={styles.eldersList}>
                  {elders.map((elder, index) => (
                    <div 
                      key={`elder-${elder.elder_id}-${index}`} 
                      className={`${styles.elderCard} ${selectedElder?.elder_id === elder.elder_id ? styles.selectedElder : ''}`}
                      onClick={() => handleElderSelect(elder)}
                    >
                      <div className={styles.elderInfo}>
                        <div className={styles.elderHeader}>
                          <h3 className={styles.elderName}>{elder.elder_name}</h3>
                          <span className={`${styles.statusBadge} ${getStatusClass(elder.assignment_status)}`}>
                            {elder.assignment_status}
                          </span>
                        </div>
                        
                        <div className={styles.elderDetails}>
                          <p><strong>Age:</strong> <span>{elder.age} years</span></p>
                          <p><strong>Email:</strong> <span>{elder.elder_email}</span></p>
                          <p><strong>Phone:</strong> <span>{elder.elder_phone}</span></p>
                          <p><strong>District:</strong> <span>{elder.district}</span></p>
                          <p><strong>Address:</strong> <span>{elder.address}</span></p>
                          <p><strong>Family Contact:</strong> <span>{elder.family_member_name}</span></p>
                        </div>

                        {elder.medical_conditions && (
                          <div className={styles.medicalConditions}>
                            <p><strong>Medical Conditions:</strong> <span>{elder.medical_conditions}</span></p>
                          </div>
                        )}
                        
                        <div className={styles.elderStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{elder.total_assignments}</span>
                            <span className={styles.statLabel}>Assignments</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{elder.duration || 'N/A'}</span>
                            <span className={styles.statLabel}>Duration (days)</span>
                          </div>
                        </div>
                        
                        <div className={styles.assignmentInfo}>
                          <div className={styles.assignmentDates}>
                            <div>Start: {formatDate(elder.start_date)}</div>
                            {elder.end_date && <div>End: {formatDate(elder.end_date)}</div>}
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
            {selectedElder && showChat ? (
              <div className={styles.chatSection}>
                <CaregiverElderChat
                  caregiverId={currentUser.caregiver_id}
                  elderUserId={selectedElder.elder_id}
                  currentUserRole="caregiver"
                  currentUserId={currentUser.caregiver_id}
                  onBack={handleBackToList}
                />
              </div>
            ) : selectedElder ? (
              <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                  <h2 className={styles.sectionTitle}>
                    💬 Chat with {selectedElder.elder_name}
                  </h2>
                  <button 
                    className={styles.startChatButton}
                    onClick={() => setShowChat(true)}
                  >
                    Start Conversation
                  </button>
                </div>

                <div className={styles.chatInterface}>
                  <div className={styles.comingSoon}>
                    <h4>💬 Ready to Chat!</h4>
                    <p>Click the chat button to start messaging {selectedElder.elder_name}</p>
                    <div className={styles.contactInfo}>
                      <p><strong>Contact {selectedElder.elder_name}:</strong></p>
                      <p>📧 {selectedElder.elder_email}</p>
                      <p>📞 {selectedElder.elder_phone}</p>
                      <p>🏠 {selectedElder.address}</p>
                      <p>👨‍👩‍👧‍👦 Family: {selectedElder.family_member_name}</p>
                      <p>⚕️ Assignment: {selectedElder.assignment_status}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.chatSection}>
                <div className={styles.noChatSelected}>
                  <div className={styles.noChatIcon}>💬</div>
                  <h3>Select an Elder to Start Chatting</h3>
                  <p>Choose an elder from the list to begin your conversation.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CaregiverLayout>
    
  </>
  );
};

export default CaregiverElderMessages;