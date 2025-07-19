import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/payment.module.css';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ 
  amount, 
  onPaymentSuccess, 
  onPaymentError, 
  processing, 
  setProcessing,
  bookingData 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleBillingChange = (e) => {
    setBillingDetails({
      ...billingDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setCardError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!cardComplete) {
      setCardError('Please complete your card information');
      return;
    }

    if (!billingDetails.name || !billingDetails.email) {
      setCardError('Please fill in all required billing details');
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      console.log('Creating payment intent...');
      
      // Convert LKR to cents (LKR uses 2 decimal places, so multiply by 100)
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      // Create payment intent on your server
      const response = await elderApi.createPaymentIntent({
        amount: amountInCents,
        currency: 'lkr', // Sri Lankan Rupees
        bookingData,
        billingDetails
      });

      console.log('Payment intent response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create payment intent');
      }

      const { client_secret } = response;

      console.log('Confirming payment...');

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        onPaymentError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        onPaymentSuccess({
          paymentIntentId: paymentIntent.id,
          transactionId: paymentIntent.id,
          paymentMethod: 'card',
          paymentAmount: amount,
          paymentStatus: 'completed',
          billingDetails
        });
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      onPaymentError(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      {/* Billing Details */}
      <div className={styles.billingSection}>
        <h3>💳 Billing Information</h3>
        <div className={styles.billingGrid}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={billingDetails.name}
              onChange={handleBillingChange}
              placeholder="Enter cardholder name"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={billingDetails.email}
              onChange={handleBillingChange}
              placeholder="Enter email address"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={billingDetails.phone}
              onChange={handleBillingChange}
              placeholder="Enter phone number (+94XXXXXXXXX)"
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className={styles.cardSection}>
        <h3>💳 Card Information</h3>
        <div className={styles.cardElementContainer}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                  fontSmoothing: 'antialiased',
                },
                invalid: {
                  color: '#9e2146',
                },
              },
              hidePostalCode: true,
            }}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <div className={styles.cardError}>
            <span className={styles.errorIcon}>⚠️</span>
            {cardError}
          </div>
        )}
      </div>

      {/* Accepted Cards */}
      <div className={styles.acceptedCards}>
        <span>Accepted cards:</span>
        <div className={styles.cardLogos}>
          <span className={styles.cardLogo}>💳 Visa</span>
          <span className={styles.cardLogo}>💳 Mastercard</span>
          <span className={styles.cardLogo}>💳 Amex</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={styles.payButton}
        disabled={!stripe || processing || !cardComplete}
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
    </form>
  );
};

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

  // Booking data for payment processing
  const bookingData = {
    tempBookingId,
    elderId,
    doctorId,
    appointmentDate,
    appointmentTime,
    appointmentType,
    doctorName,
    elderName
  };

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

  const handlePaymentSuccess = async (paymentData) => {
    try {
      setError(null);

      // Convert temporary booking to confirmed appointment
      const confirmationData = {
        tempBookingId,
        paymentMethod: 'card',
        paymentAmount: amount,
        transactionId: paymentData.transactionId,
        paymentIntentId: paymentData.paymentIntentId,
        paymentStatus: 'completed',
        billingDetails: paymentData.billingDetails
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
      console.error('Error confirming payment:', err);
      setError(err.message || 'Payment confirmation failed. Please contact support.');
    }
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
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
    <Elements stripe={stripePromise}>
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            {/* Header with Countdown */}
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <h1 className={styles.title}>
                  💳 Secure Payment
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

              {/* Payment Form */}
              <div className={styles.paymentSection}>
                <PaymentForm
                  amount={amount}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  processing={processing}
                  setProcessing={setProcessing}
                  bookingData={bookingData}
                />
              </div>

              {/* Security Notice */}
              <div className={styles.securityNotice}>
                <div className={styles.securityIcon}>🔒</div>
                <div className={styles.securityText}>
                  <h3>Secure Payment</h3>
                  <p>Your payment information is encrypted and secure. We use Stripe's industry-standard security measures and never store your card details on our servers.</p>
                </div>
              </div>

              {/* Cancel Button */}
              <div className={styles.cancelSection}>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancel}
                  disabled={processing}
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </FamilyMemberLayout>
      </div>
    </Elements>
  );
};

export default Payment;

