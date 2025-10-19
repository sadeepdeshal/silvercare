import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderDoctorChatApi } from '../../services/elderDoctorChatApi';
import { getElderDetailsByEmail } from '../../services/elderApi2';
import Navbar from '../../components/navbar';
import ElderLayout from '../../components/ElderLayout';
import ElderDoctorChat from '../../components/Chat/ElderDoctorChat';
import styles from '../../components/css/elder/DoctorMessages.module.css';

const DoctorMessages = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [elderDetails, setElderDetails] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Redirect if not authenticated or not elder
  useEffect(() => {
    if (!loading && (!isAuthenticated || currentUser?.role !== 'elder')) {
      navigate('/login');
    }
  }, [currentUser, loading, isAuthenticated, navigate]);

  // Fetch elder details and doctors for chat
  useEffect(() => {
    const fetchDoctorsForChat = async () => {
      if (!currentUser?.email) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching elder details for email:', currentUser.email);
        const elderResponse = await getElderDetailsByEmail(currentUser.email);
        
        console.log('Elder details response:', elderResponse.data);
        setElderDetails(elderResponse.data);
        
        if (elderResponse.data.elder_id) {
          console.log('Fetching doctors for elder_id:', elderResponse.data.elder_id);
          const doctorsResponse = await elderDoctorChatApi.getDoctorsWithAppointments(elderResponse.data.elder_id);
          
          console.log('Doctors response:', doctorsResponse);
          
          if (doctorsResponse.success) {
            setDoctors(doctorsResponse.doctors || []);
          } else {
            setError(doctorsResponse.message || 'Failed to load doctors');
          }
        }
        
      } catch (err) {
        console.error('Error fetching doctors for chat:', err);
        setError('Failed to load doctors');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'elder') {
      fetchDoctorsForChat();
    }
  }, [currentUser]);

  // Handle doctor selection and show chat
  const handleDoctorSelect = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowChat(true);
  };

  // Handle closing chat
  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedDoctor(null);
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
              <h2>Loading doctors...</h2>
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
              <h1 className={styles.title}>�‍⚕️ Doctor Messages</h1>
              <p className={styles.subtitle}>
                Connect and chat with your healthcare providers
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
            {/* Doctors List */}
            <div className={styles.doctorsSection}>
              <h2 className={styles.sectionTitle}>
                👨‍⚕️ Available Doctors ({doctors.length})
              </h2>
              
              {doctors.length === 0 ? (
                <div className={styles.noDoctors}>
                  <div className={styles.noDoctorsIcon}>👨‍⚕️</div>
                  <h3>No Doctors Available for Chat</h3>
                  <p>
                    You need to have confirmed or completed appointments with doctors 
                    to start chatting with them.
                  </p>
                  <div className={styles.helpText}>
                    <h4>To chat with doctors:</h4>
                    <ul>
                      <li>Book an appointment with a doctor</li>
                      <li>Wait for the appointment to be confirmed</li>
                      <li>After confirmation, you can start chatting</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className={styles.doctorsList}>
                  {doctors.map((doctor) => (
                    <div 
                      key={doctor.user_id} 
                      className={`${styles.doctorCard} ${selectedDoctor?.user_id === doctor.user_id ? styles.selectedDoctor : ''}`}
                      onClick={() => handleDoctorSelect(doctor)}
                    >
                      <div className={styles.doctorInfo}>
                        <div className={styles.doctorHeader}>
                          <h3 className={styles.doctorName}>Dr. {doctor.doctor_name}</h3>
                          <span className={styles.appointmentCount}>{doctor.total_appointments} Appointment(s)</span>
                        </div>
                        
                        <div className={styles.doctorDetails}>
                          <p><strong>Specialization:</strong> <span>{doctor.specialization}</span></p>
                          <p><strong>Experience:</strong> <span>{doctor.years_experience} years</span></p>
                        </div>
                        
                        <div className={styles.doctorStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{doctor.total_appointments}</span>
                            <span className={styles.statLabel}>Total</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statNumber}>{doctor.completed_appointments}</span>
                            <span className={styles.statLabel}>Completed</span>
                          </div>
                        </div>
                        
                        <div className={styles.joinDate}>
                          Available since: {formatDate(doctor.latest_appointment_date)}
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
            {selectedDoctor && showChat ? (
              <div className={styles.chatSection}>
                <ElderDoctorChat 
                  currentUser={{
                    user_id: elderDetails?.user_details?.user_id,
                    name: elderDetails?.name,
                    elder_id: elderDetails?.elder_id
                  }}
                  selectedDoctor={selectedDoctor}
                  onClose={handleCloseChat}
                />
              </div>
            ) : selectedDoctor ? (
              <div className={styles.chatSection}>
                <div className={styles.chatHeader}>
                  <h2 className={styles.sectionTitle}>
                    💬 Chat with Dr. {selectedDoctor.doctor_name}
                  </h2>
                </div>

                <div className={styles.chatInterface}>
                  <div className={styles.comingSoon}>
                    <h4>💬 Ready to Chat!</h4>
                    <p>Click the chat button to start messaging Dr. {selectedDoctor.doctor_name}</p>
                    <button 
                      className={styles.startChatButton}
                      onClick={() => setShowChat(true)}
                    >
                      Start Conversation
                    </button>
                    <div className={styles.contactInfo}>
                      <p><strong>Contact Dr. {selectedDoctor.doctor_name}:</strong></p>
                      <p>🏥 {selectedDoctor.specialization}</p>
                      <p>📞 {selectedDoctor.doctor_phone}</p>
                      <p>🏢 {selectedDoctor.current_institution}</p>
                      <p>👨‍⚕️ {selectedDoctor.years_experience} years experience</p>
                      <p>📅 {selectedDoctor.total_appointments} total appointments with you</p>
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

export default DoctorMessages;
