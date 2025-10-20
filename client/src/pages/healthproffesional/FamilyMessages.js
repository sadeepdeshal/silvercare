import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { familyMemberApi } from '../../services/familyMemberApi';
import Navbar from '../../components/navbar';
import HealthProfessionalSidebar from '../../components/HealthProfessionalSidebar';
import Chat from '../../components/Chat/Chat';
import styles from './FamilyMessages.module.css';

const FamilyMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [familyMembers, setFamilyMembers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Redirect if not authenticated or not health professional
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'healthprofessional')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch family members with appointments
  useEffect(() => {
    const fetchFamilyMembersWithAppointments = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await familyMemberApi.getFamilyMembersWithAppointments(currentUser.user_id);
        
        if (response.success) {
          setFamilyMembers(response.familyMembers);
        }
        
      } catch (err) {
        console.error('Error fetching family members with appointments:', err);
        setError('Failed to load family members');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'healthprofessional') {
      fetchFamilyMembersWithAppointments();
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
        <Navbar />
        <div className={styles.layout}>
          <HealthProfessionalSidebar />
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading family members...</h2>
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
              <h1 className={styles.title}>👨‍👩‍👧‍👦 Family Member Messages</h1>
              <p className={styles.subtitle}>
                Chat with family members of elders you have treated
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
                    You can only message family members whose elders you have treated through 
                    confirmed or completed appointments.
                  </p>
                  <button 
                    className={styles.viewSessionsButton}
                    onClick={() => navigate('/healthprofessional/sessions')}
                  >
                    View Sessions
                  </button>
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
                          <div className={styles.familyMemberAvatar}>
                            <div className={styles.avatarPlaceholder}>👨‍👩‍👧‍👦</div>
                          </div>
                          <div className={styles.familyMemberBasicInfo}>
                            <h3 className={styles.familyMemberName}>{familyMember.family_member_name}</h3>
                            <span className={styles.familyId}>Family ID: {familyMember.family_id}</span>
                          </div>
                        </div>
                        
                        <div className={styles.familyMemberDetails}>
                          <p><strong>Email:</strong> <span>{familyMember.family_member_email}</span></p>
                          <p><strong>Phone:</strong> <span>{familyMember.family_member_phone}</span></p>
                          {familyMember.phone_fixed && (
                            <p><strong>Fixed Line:</strong> <span>{familyMember.phone_fixed}</span></p>
                          )}
                          <p><strong>Address:</strong> <span>{familyMember.address}</span></p>
                          <p><strong>Elders Under Care:</strong> <span>{familyMember.elders_under_care}</span></p>
                        </div>
                        
                        <div className={styles.appointmentStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{familyMember.total_appointments}</span>
                            <span className={styles.statLabel}>Total</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{familyMember.confirmed_appointments}</span>
                            <span className={styles.statLabel}>Confirmed</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{familyMember.completed_appointments}</span>
                            <span className={styles.statLabel}>Completed</span>
                          </div>
                        </div>
                        
                        <div className={styles.lastAppointment}>
                          Last appointment: {formatDate(familyMember.latest_appointment_date)}
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
                <Chat 
                  currentUser={currentUser}
                  selectedDoctor={{
                    ...selectedFamilyMember,
                    doctor_name: selectedFamilyMember.family_member_name,
                    doctor_email: selectedFamilyMember.family_member_email,
                    doctor_phone: selectedFamilyMember.family_member_phone,
                    specialization: 'Family Member',
                    user_id: selectedFamilyMember.user_id
                  }}
                  senderType="healthprofessional"
                  receiverType="family_member"
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
                      <p><strong>Family Member Information:</strong></p>
                      <p>👨‍👩‍👧‍👦 {selectedFamilyMember.family_member_name}</p>
                      <p>📧 {selectedFamilyMember.family_member_email}</p>
                      <p>📞 {selectedFamilyMember.family_member_phone}</p>
                      {selectedFamilyMember.phone_fixed && (
                        <p>📞 Fixed Line: {selectedFamilyMember.phone_fixed}</p>
                      )}
                      <p>🏠 {selectedFamilyMember.address}</p>
                      <p>👴 Elders: {selectedFamilyMember.elders_under_care}</p>
                      <p>📅 {selectedFamilyMember.total_appointments} total appointments</p>
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

export default FamilyMessages;