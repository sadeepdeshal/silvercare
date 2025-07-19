import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/payment-success.module.css';

const PaymentSuccess = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get success details from URL params
  const appointmentId = searchParams.get('appointmentId');
  const elderId = searchParams.get('elderId');
  const doctorName = searchParams.get('doctorName');
  const elderName = searchParams.get('elderName');
  const appointmentDate = searchParams.get('date');
  const appointmentTime = searchParams.get('time');
  const appointmentType = searchParams.get('type');
  const amount = searchParams.get('amount');
  const transactionId = searchParams.get('transactionId');

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = dayNames[date.getDay()];
    
    return `${dayOfWeek}, ${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  // Format time for display
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHour = hour12 === 0 ? 12 : hour12;
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Protect the route
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (currentUser.role !== 'family_member') {
      navigate('/login', { replace: true });
      return;
    }

    // Validate required params
    if (!appointmentId || !elderId) {
      navigate(`/family-member/dashboard`, { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate, appointmentId, elderId]);

  const handleViewAppointments = () => {
    navigate(`/family-member/elder/${elderId}/appointments`);
  };

  const handleBackToDashboard = () => {
    navigate('/family-member/dashboard');
  };

  const handleBookAnother = () => {
    navigate(`/family-member/elder/${elderId}/doctors`);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading...</h2>
            </div>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !currentUser || currentUser.role !== 'family_member') {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <FamilyMemberLayout>
        <div className={styles.content}>
          {/* Success Header */}
          <div className={styles.successHeader}>
            <div className={styles.successIcon}>✅</div>
            <h1 className={styles.successTitle}>Payment Successful!</h1>
            <p className={styles.successSubtitle}>
              Your appointment has been booked successfully
            </p>
          </div>

          {/* Appointment Details Card */}
          <div className={styles.appointmentCard}>
            <div className={styles.cardHeader}>
              <h2>📅 Appointment Confirmation</h2>
              <span className={styles.appointmentId}>ID: #{appointmentId}</span>
            </div>
            
            <div className={styles.appointmentDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Doctor:</span>
                <span className={styles.value}>{doctorName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Patient:</span>
                <span className={styles.value}>{elderName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Date:</span>
                <span className={styles.value}>{formatDateForDisplay(appointmentDate)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Time:</span>
                <span className={styles.value}>{formatTimeForDisplay(appointmentTime)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Type:</span>
                <span className={styles.value}>
                  {appointmentType === 'physical' ? '🏥 Physical Consultation' : '💻 Online Consultation'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Duration:</span>
                <span className={styles.value}>
                  {appointmentType === 'physical' ? '2 hours' : '1 hour'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Status:</span>
                <span className={`${styles.value} ${styles.statusPending}`}>
                  ⏳ Pending Doctor Confirmation
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className={styles.paymentCard}>
            <div className={styles.cardHeader}>
              <h2>💳 Payment Details</h2>
              <span className={styles.transactionId}>TXN: {transactionId}</span>
            </div>
            
            <div className={styles.paymentDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Amount Paid:</span>
                <span className={styles.value}>Rs. {amount}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Payment Status:</span>
                <span className={`${styles.value} ${styles.statusSuccess}`}>
                  ✅ Completed
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Payment Date:</span>
                <span className={styles.value}>{new Date().toLocaleDateString()}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Transaction ID:</span>
                <span className={styles.value}>{transactionId}</span>
              </div>
            </div>
          </div>

          {/* Next Steps Card */}
          <div className={styles.nextStepsCard}>
            <div className={styles.cardHeader}>
              <h2>📋 What's Next?</h2>
            </div>
            
            <div className={styles.nextStepsList}>
              <div className={styles.nextStep}>
                <div className={styles.stepIcon}>1️⃣</div>
                <div className={styles.stepContent}>
                  <h3>Doctor Confirmation</h3>
                  <p>The doctor will review and confirm your appointment within 24 hours.</p>
                </div>
              </div>
              
              <div className={styles.nextStep}>
                <div className={styles.stepIcon}>2️⃣</div>
                <div className={styles.stepContent}>
                  <h3>Confirmation Notification</h3>
                  <p>You'll receive an email and SMS with appointment confirmation details.</p>
                </div>
              </div>
              
              <div className={styles.nextStep}>
                <div className={styles.stepIcon}>3️⃣</div>
                <div className={styles.stepContent}>
                  <h3>Meeting Details</h3>
                  <p>
                    {appointmentType === 'physical' 
                      ? 'You\'ll receive the clinic address and directions.'
                      : 'You\'ll receive the video call link and instructions.'
                    }
                  </p>
                </div>
              </div>
              
              <div className={styles.nextStep}>
                <div className={styles.stepIcon}>4️⃣</div>
                <div className={styles.stepContent}>
                  <h3>Appointment Reminder</h3>
                  <p>We'll send you a reminder 24 hours and 1 hour before your appointment.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes Card */}
          <div className={styles.notesCard}>
            <div className={styles.cardHeader}>
              <h2>⚠️ Important Notes</h2>
            </div>
            
            <div className={styles.notesList}>
              <ul>
                <li>Please arrive 10 minutes early for physical appointments</li>
                <li>For online appointments, test your camera and microphone beforehand</li>
                <li>Keep your appointment ID handy for reference</li>
                <li>Cancellations must be made at least 2 hours before the appointment</li>
                <li>If you need to reschedule, contact support or use the appointment management page</li>
                <li>Payment receipts have been sent to your registered email</li>
              </ul>
            </div>
          </div>

                    {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={styles.secondaryButton}
              onClick={handleBackToDashboard}
            >
              🏠 Back to Dashboard
            </button>
            
            <button
              className={styles.primaryButton}
              onClick={handleViewAppointments}
            >
              📅 View All Appointments
            </button>
            
            <button
              className={styles.tertiaryButton}
              onClick={handleBookAnother}
            >
              ➕ Book Another Appointment
            </button>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default PaymentSuccess;

