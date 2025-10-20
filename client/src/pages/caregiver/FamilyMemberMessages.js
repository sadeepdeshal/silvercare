import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caregivermessageApi } from '../../services/caregivermessageApi';
import Navbar from '../../components/navbar';
import CaregiverLayout from '../../components/CaregiverLayout';
import FamilyMemberChatForCaregiver from '../../components/Chat/FamilyMemberChatForCaregiver';
import styles from '../../components/css/caregiver/FamilyMemberMessages.module.css';

const FamilyMemberMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [familyMembers, setFamilyMembers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Redirect if not authenticated or not caregiver
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'caregiver')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch family members for this caregiver
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (!currentUser?.caregiver_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await caregivermessageApi.getFamilyMembersForCaregiver(currentUser.caregiver_id);
        
        if (response.success) {
          setFamilyMembers(response.familyMembers);
        }
        
      } catch (err) {
        console.error('Error fetching family members:', err);
        setError('Failed to load family members');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'caregiver' && currentUser.caregiver_id) {
      fetchFamilyMembers();
    }
  }, [currentUser]);

  // Handle family member selection and show chat
  const handleFamilyMemberSelect = async (familyMember) => {
    setSelectedFamilyMember(familyMember);
    setShowChat(true);
  };

  // Handle closing chat
  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedFamilyMember(null);
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
        <CaregiverLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading family members...</h2>
            </div>
          </div>
        </CaregiverLayout>
      </div>
    );
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
              <h1 className={styles.title}>Family Member Messages</h1>
              <p className={styles.subtitle}>
                Chat with family members of elders you are caring for
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
            {/* Family Members List */}
            <div className={styles.familyMembersSection}>
              <h2 className={styles.sectionTitle}>
                👨‍👩‍👧‍👦 Family Members ({familyMembers.length})
              </h2>
              
              {familyMembers.length === 0 ? (
                <div className={styles.noFamilyMembers}>
                  <div className={styles.noFamilyMembersIcon}>👨‍👩‍👧‍👦</div>
                  <h3>No Family Members Available for Chat</h3>
                  <p>
                    You can only message family members of elders you have 
                    ongoing or completed care assignments with.
                  </p>
                  <button 
                    className={styles.viewAssignmentsButton}
                    onClick={() => navigate('/caregiver/assignments')}
                  >
                    View Care Assignments
                  </button>
                </div>
              ) : (
                <div className={styles.familyMembersList}>
                  {familyMembers.map((familyMember) => (
                    <div 
                      key={familyMember.family_id} 
                      className={`${styles.familyMemberCard} ${selectedFamilyMember?.family_id === familyMember.family_id ? styles.selectedFamilyMember : ''}`}
                      onClick={() => handleFamilyMemberSelect(familyMember)}
                    >
                      <div className={styles.familyMemberInfo}>
                        <div className={styles.familyMemberHeader}>
                          <h3 className={styles.familyMemberName}>{familyMember.family_member_name}</h3>
                          <span className={styles.relationship}>{familyMember.relationship}</span>
                        </div>
                        
                        <div className={styles.familyMemberDetails}>
                          <p><strong>Email:</strong> <span>{familyMember.family_member_email}</span></p>
                          <p><strong>Phone:</strong> <span>{familyMember.family_member_phone}</span></p>
                          <p><strong>Elders I care for:</strong> <span>{familyMember.elders_cared_for}</span></p>
                        </div>
                        
                        <div className={styles.assignmentStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{familyMember.total_assignments}</span>
                            <span className={styles.statLabel}>Total</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{familyMember.active_assignments}</span>
                            <span className={styles.statLabel}>Active</span>
                          </div>
                        </div>
                        
                        <div className={styles.assignmentInfo}>
                          <div className={styles.lastAssignment}>
                            Latest: {formatDate(familyMember.latest_assignment_date)}
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

            {/* Chat/History Section */}
            {selectedFamilyMember && showChat ? (
              <div className={styles.chatSection}>
                <FamilyMemberChatForCaregiver 
                  currentUser={currentUser}
                  selectedFamilyMember={selectedFamilyMember}
                  onClose={handleCloseChat}
                />
              </div>
            ) : selectedFamilyMember ? (
              <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                  <h2 className={styles.sectionTitle}>
                    💬 Chat with {selectedFamilyMember.family_member_name}
                  </h2>
                </div>

                <div className={styles.familyMemberDetails}>
                  <div className={styles.chatInterface}>
                    <div className={styles.comingSoon}>
                      <h4>💬 Ready to Chat!</h4>
                      <p>Click the chat button to start messaging {selectedFamilyMember.family_member_name}</p>
                      <button 
                        className={styles.startChatButton}
                        onClick={() => setShowChat(true)}
                      >
                        Start Conversation
                      </button>
                      <div className={styles.contactInfo}>
                        <p><strong>Contact {selectedFamilyMember.family_member_name}:</strong></p>
                        <p>📧 {selectedFamilyMember.family_member_email}</p>
                        <p>📞 {selectedFamilyMember.family_member_phone}</p>
                        <p>👨‍👩‍👧‍👦 Relationship: {selectedFamilyMember.relationship}</p>
                        <p>👴 Elders: {selectedFamilyMember.elders_cared_for}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.chatSection}>
                <div className={styles.noChatSelected}>
                  <div className={styles.noChatIcon}>💬</div>
                  <h3>Select a Family Member to Start Chatting</h3>
                  <p>Choose a family member from the list to begin your conversation.</p>
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

export default FamilyMemberMessages;