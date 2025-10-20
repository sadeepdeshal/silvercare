import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { healthcareProfessionalApi } from '../../services/healthcareProfessionalApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import Chat from '../../components/Chat/Chat';
import styles from '../../components/css/familymember/DoctorMessages.module.css';

const HealthcareProfessionalMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [healthcareProfessionals, setHealthcareProfessionals] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHealthcareProfessional, setSelectedHealthcareProfessional] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Redirect if not authenticated or not family member
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'family_member')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch healthcare professionals with appointments
  useEffect(() => {
    const fetchHealthcareProfessionalsWithAppointments = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await healthcareProfessionalApi.getHealthcareProfessionalsWithAppointments(currentUser.user_id);
        
        if (response.success) {
          setHealthcareProfessionals(response.healthcareProfessionals);
        }
        
      } catch (err) {
        console.error('Error fetching healthcare professionals with appointments:', err);
        setError('Failed to load healthcare professionals');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchHealthcareProfessionalsWithAppointments();
    }
  }, [currentUser]);

  // Handle healthcare professional selection and show chat
  const handleHealthcareProfessionalSelect = async (healthcareProfessional) => {
    setSelectedHealthcareProfessional(healthcareProfessional);
    setShowChat(true);
  };

  // Handle closing chat
  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedHealthcareProfessional(null);
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
              <h2>Loading healthcare professionals...</h2>
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
              <h1 className={styles.title}>🧑‍⚕️ Healthcare Professional Messages</h1>
              <p className={styles.subtitle}>
                Chat with healthcare professionals (counselors) who have treated your registered elders
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
            {/* Healthcare Professionals List */}
            <div className={styles.doctorsSection}>
              <h2 className={styles.sectionTitle}>
                🧑‍⚕️ Available Healthcare Professionals ({healthcareProfessionals.length})
              </h2>
              
              {healthcareProfessionals.length === 0 ? (
                <div className={styles.noDoctors}>
                  <div className={styles.noDoctorsIcon}>🧑‍⚕️</div>
                  <h3>No Healthcare Professionals Available for Chat</h3>
                  <p>
                    You can only message healthcare professionals (counselors) who have confirmed or completed appointments 
                    with your registered elders.
                  </p>
                  <button 
                    className={styles.bookAppointmentButton}
                    onClick={() => navigate('/family-member/counselor-sessions')}
                  >
                    Book Counselor Session
                  </button>
                </div>
              ) : (
                <div className={styles.doctorsList}>
                  {healthcareProfessionals.map((professional) => (
                    <div 
                      key={professional.counselor_id} 
                      className={`${styles.doctorCard} ${selectedHealthcareProfessional?.counselor_id === professional.counselor_id ? styles.selectedDoctor : ''}`}
                      onClick={() => handleHealthcareProfessionalSelect(professional)}
                    >
                      <div className={styles.doctorInfo}>
                        <div className={styles.doctorHeader}>
                          <h3 className={styles.doctorName}>{professional.counselor_name}</h3>
                          <span className={styles.specialization}>{professional.specialization}</span>
                        </div>
                        
                        <div className={styles.doctorDetails}>
                          <p><strong>Institution:</strong> <span>{professional.current_institution}</span></p>
                          <p><strong>Experience:</strong> <span>{professional.years_of_experience} years</span></p>
                          <p><strong>District:</strong> <span>{professional.counselor_district}</span></p>
                          <p><strong>Elders Treated:</strong> <span>{professional.elders_treated}</span></p>
                        </div>
                        
                        <div className={styles.appointmentStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{professional.total_appointments}</span>
                            <span className={styles.statLabel}>Total</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{professional.confirmed_appointments}</span>
                            <span className={styles.statLabel}>Confirmed</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{professional.completed_appointments}</span>
                            <span className={styles.statLabel}>Completed</span>
                          </div>
                        </div>
                        
                        <div className={styles.lastAppointment}>
                          Last appointment: {formatDate(professional.latest_appointment_date)}
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
            {selectedHealthcareProfessional && showChat ? (
              <div className={styles.chatSection}>
                <Chat 
                  currentUser={currentUser}
                  selectedDoctor={{
                    ...selectedHealthcareProfessional,
                    doctor_name: selectedHealthcareProfessional.counselor_name,
                    doctor_email: selectedHealthcareProfessional.counselor_email,
                    doctor_phone: selectedHealthcareProfessional.counselor_phone,
                    specialization: selectedHealthcareProfessional.specialization,
                    user_id: selectedHealthcareProfessional.user_id
                  }}
                  onClose={handleCloseChat}
                />
              </div>
            ) : selectedHealthcareProfessional ? (
              <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                  <h2 className={styles.sectionTitle}>
                    💬 Chat with {selectedHealthcareProfessional.counselor_name}
                  </h2>
                </div>

                <div className={styles.appointmentHistory}>
                  <div className={styles.chatInterface}>
                    <div className={styles.comingSoon}>
                      <h4>💬 Ready to Chat!</h4>
                      <p>Click the chat button to start messaging {selectedHealthcareProfessional.counselor_name}</p>
                      <button 
                        className={styles.startChatButton}
                        onClick={() => setShowChat(true)}
                      >
                        Start Conversation
                      </button>
                      <div className={styles.contactInfo}>
                        <p><strong>Contact {selectedHealthcareProfessional.counselor_name}:</strong></p>
                        <p>📧 {selectedHealthcareProfessional.counselor_email}</p>
                        <p>📞 {selectedHealthcareProfessional.counselor_phone}</p>
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

export default HealthcareProfessionalMessages;