import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/payment.module.css';

const Payment = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get payment details from URL params
  const tempBookingId = searchParams.get('tempBookingId');
  const elderId = searchParams.get('elderId');
  const doctorId = searchParams.get('doctorId');
  const appointmentDate = searchParams.get('date');
  const appointmentTime = searchParams.get('time');
  const appointmentType = searchParams.get('type');
  const amount = searchParams.get('amount');
  const doctorName = searchParams.get('doctorName');
  const elderName = searchParams.get('elderName');

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      // Time expired, redirect back
      navigate(`/family-member/elder/${elderId}/doctors`, { 
        replace: true,
        state: { message: 'Payment time expired. Please try booking again.' }
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate, elderId]);

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
    if (!tempBookingId || !elderId || !doctorId || !appointmentDate || !appointmentTime) {
      navigate(`/family-member/elder/${elderId}/doctors`, { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate, tempBookingId, elderId, doctorId, appointmentDate, appointmentTime]);

  // Format countdown time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Simulate payment gateway integration
      // In real implementation, integrate with payment gateway like Stripe, PayPal, etc.
      
            // For demo purposes, we'll simulate a payment process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment processing

      // Convert temporary booking to confirmed appointment
      const confirmationData = {
        tempBookingId,
        paymentMethod,
        paymentAmount: amount,
        transactionId: `TXN_${Date.now()}`, // Mock transaction ID
        paymentStatus: 'completed'
      };

      console.log('Confirming payment and creating appointment:', confirmationData);

      const response = await elderApi.confirmPaymentAndCreateAppointment(elderId, confirmationData);
      
      if (response.success) {
        // Redirect to success page
        const successParams = new URLSearchParams({
          appointmentId: response.appointment.appointment_id,
          elderId,
          doctorId,
          date: appointmentDate,
          time: appointmentTime,
          type: appointmentType,
          doctorName,
          elderName,
          amount,
          transactionId: confirmationData.transactionId
        });

        navigate(`/family-member/payment-success?${successParams.toString()}`);
      } else {
        throw new Error(response.error || 'Payment confirmation failed');
      }
      
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    try {
      // Cancel the temporary booking
      await elderApi.cancelTemporaryBooking(tempBookingId);
      
      // Redirect back to appointment booking
      const backUrl = appointmentType === 'physical' 
        ? `/family-member/elder/${elderId}/physical-appointment/${doctorId}`
        : `/family-member/elder/${elderId}/online-appointment/${doctorId}`;
      navigate(backUrl);
    } catch (err) {
      console.error('Error canceling booking:', err);
      // Still redirect back even if cancellation fails
      navigate(`/family-member/elder/${elderId}/doctors`);
    }
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
              <h2>Loading payment page...</h2>
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
          {/* Header with Countdown */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>
                💳 Payment Gateway
              </h1>
              <p className={styles.subtitle}>
                Complete your payment to confirm the appointment
              </p>
            </div>
            <div className={styles.countdown}>
              <div className={styles.countdownTimer}>
                <span className={styles.timerIcon}>⏰</span>
                <span className={styles.timerText}>Time remaining:</span>
                <span className={`${styles.timerValue} ${timeLeft <= 60 ? styles.urgent : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <p className={styles.countdownNote}>
                This slot will be released if payment is not completed in time
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div className={styles.paymentContainer}>
            {/* Booking Summary */}
            <div className={styles.bookingSummary}>
              <div className={styles.summaryHeader}>
                <h2>📋 Booking Summary</h2>
              </div>
              
              <div className={styles.summaryDetails}>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Doctor:</span>
                  <span className={styles.value}>{doctorName}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Patient:</span>
                  <span className={styles.value}>{elderName}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Date:</span>
                  <span className={styles.value}>{formatDateForDisplay(appointmentDate)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Time:</span>
                  <span className={styles.value}>{formatTimeForDisplay(appointmentTime)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Type:</span>
                  <span className={styles.value}>
                    {appointmentType === 'physical' ? '🏥 Physical' : '💻 Online'}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Duration:</span>
                  <span className={styles.value}>
                    {appointmentType === 'physical' ? '2 hours' : '1 hour'}
                  </span>
                </div>
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span className={styles.label}>Total Amount:</span>
                  <span className={styles.value}>Rs. {amount}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className={styles.paymentMethods}>
              <div className={styles.methodsHeader}>
                <h2>💳 Select Payment Method</h2>
              </div>
              
              <div className={styles.methodOptions}>
                <div 
                  className={`${styles.methodOption} ${paymentMethod === 'card' ? styles.selected : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className={styles.methodIcon}>💳</div>
                  <div className={styles.methodInfo}>
                    <h3>Credit/Debit Card</h3>
                    <p>Visa, Mastercard, American Express</p>
                  </div>
                  <div className={styles.methodRadio}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="card" 
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                  </div>
                </div>

                <div 
                  className={`${styles.methodOption} ${paymentMethod === 'mobile' ? styles.selected : ''}`}
                  onClick={() => setPaymentMethod('mobile')}
                >
                  <div className={styles.methodIcon}>📱</div>
                  <div className={styles.methodInfo}>
                    <h3>Mobile Payment</h3>
                    <p>eZ Cash, mCash, Dialog Pay</p>
                  </div>
                  <div className={styles.methodRadio}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="mobile" 
                      checked={paymentMethod === 'mobile'}
                      onChange={() => setPaymentMethod('mobile')}
                    />
                  </div>
                </div>

                <div 
                  className={`${styles.methodOption} ${paymentMethod === 'bank' ? styles.selected : ''}`}
                  onClick={() => setPaymentMethod('bank')}
                >
                  <div className={styles.methodIcon}>🏦</div>
                  <div className={styles.methodInfo}>
                    <h3>Online Banking</h3>
                    <p>All major banks supported</p>
                  </div>
                  <div className={styles.methodRadio}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="bank" 
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className={styles.securityNotice}>
              <div className={styles.securityIcon}>🔒</div>
              <div className={styles.securityText}>
                <h3>Secure Payment</h3>
                <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={processing}
              >
                Cancel Booking
              </button>
              
              <button
                className={styles.payButton}
                onClick={handlePayment}
                disabled={processing || timeLeft <= 0}
              >
                {processing ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    Processing Payment...
                  </>
                ) : (
                  `Pay Rs. ${amount}`
                )}
              </button>
            </div>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default Payment;

