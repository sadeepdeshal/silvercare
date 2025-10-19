import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderFamilyChatApi } from '../../services/elderFamilyChatApi';
import Navbar from '../../components/navbar';
import ElderLayout from '../../components/ElderLayout';
import FamilyChat from '../../components/Chat/FamilyChat';
import styles from '../../components/css/elder/FamilyMessages.module.css';

const FamilyMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [familyMembers, setFamilyMembers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [elderInfo, setElderInfo] = useState(null);

  // Redirect if not authenticated or not elder
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'elder')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch family members for chat
  useEffect(() => {
    const fetchFamilyMembersForChat = async () => {
      if (!currentUser?.elder_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching family members for elder:', currentUser.elder_id);
        const response = await elderFamilyChatApi.getFamilyMembersForChat(currentUser.elder_id);
        
        if (response.success) {
          setFamilyMembers(response.familyMembers);
          setElderInfo(response.elderInfo);
        }
        
      } catch (err) {
        console.error('Error fetching family members for chat:', err);
        setError('Failed to load family members');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'elder') {
      fetchFamilyMembersForChat();
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
        <ElderLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading family members...</h2>
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
              <h1 className={styles.title}>👨‍👩‍👧‍👦 Family Messages</h1>
              <p className={styles.subtitle}>
                Connect and chat with your family members
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
            {/* Family Members List */}
            <div className={styles.familyMembersSection}>
              <h2 className={styles.sectionTitle}>
                👨‍👩‍👧‍👦 Available Family Members ({familyMembers.length})
              </h2>
              
              {familyMembers.length === 0 ? (
                <div className={styles.noFamilyMembers}>
                  <div className={styles.noFamilyMembersIcon}>👨‍👩‍👧‍👦</div>
                  <h3>No Family Members Available for Chat</h3>
                  <p>
                    No family members are currently registered for your family.
                  </p>
                </div>
              ) : (
                <div className={styles.familyMembersList}>
                  {familyMembers.map((familyMember) => (
                    <div 
                      key={familyMember.user_id} 
                      className={`${styles.familyMemberCard} ${selectedFamilyMember?.user_id === familyMember.user_id ? styles.selectedFamilyMember : ''}`}
                      onClick={() => handleFamilyMemberSelect(familyMember)}
                    >
                      <div className={styles.familyMemberInfo}>
                        <div className={styles.familyMemberHeader}>
                          <h3 className={styles.familyMemberName}>{familyMember.family_member_name}</h3>
                          <span className={styles.elderCount}>{familyMember.elders_count} Elder(s)</span>
                        </div>
                        
                        <div className={styles.familyMemberDetails}>
                          <p><strong>Email:</strong> <span>{familyMember.family_member_email}</span></p>
                          <p><strong>Phone:</strong> <span>{familyMember.family_member_phone}</span></p>
                          {familyMember.address && (
                            <p><strong>Address:</strong> <span>{familyMember.address}</span></p>
                          )}
                        </div>
                        
                        <div className={styles.familyMemberStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{familyMember.elders_count}</span>
                            <span className={styles.statLabel}>Elders</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>0</span>
                            <span className={styles.statLabel}>Messages</span>
                          </div>
                        </div>
                        
                        <div className={styles.memberJoinDate}>
                          Member since: {formatDate(familyMember.created_at)}
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
            {selectedFamilyMember && showChat ? (
              <div className={styles.chatSection}>
                <FamilyChat 
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
                      <p>👥 Caring for {selectedFamilyMember.elders_count} elder(s)</p>
                      {elderInfo && (
                        <p>🏠 Same family as {elderInfo.elder_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </ElderLayout>
    </div>
  );
};

export default FamilyMessages;
