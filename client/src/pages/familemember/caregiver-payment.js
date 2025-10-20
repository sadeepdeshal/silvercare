import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../../context/AuthContext';
import { caregiverApi } from '../../services/caregiverApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/payment.module.css';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CaregiverPaymentForm = ({ 
  amount, 
  onPaymentSuccess, 
  onPaymentError, 
  processing, 
  setProcessing,
  bookingData,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false
  });
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleCardChange = (elementType) => (event) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
    
    setCardComplete(prev => ({
      ...prev,
      [elementType]: event.complete
    }));
  };

  const handleBillingChange = (e) => {
    setBillingDetails({
      ...billingDetails,
      [e.target.name]: e.target.value
    });
  };

  const isFormComplete = () => {
    return cardComplete.cardNumber && 
           cardComplete.cardExpiry && 
           cardComplete.cardCvc &&
           billingDetails.name && 
           billingDetails.email;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setCardError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!isFormComplete()) {
      setCardError('Please complete all card information and billing details');
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      console.log('Creating payment intent for caregiver booking...');
      
      // Convert LKR to cents
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      // Create payment intent
      const response = await caregiverApi.createPaymentIntent({
        amount: amountInCents,
        currency: 'lkr',
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
          card: elements.getElement(CardNumberElement),
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

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Card Information</h3>
        
        <div className={styles.cardElementGroup}>
          <label className={styles.cardElementLabel}>Card Number</label>
          <div className={styles.cardElement}>
            <CardNumberElement 
              options={cardElementOptions}
              onChange={handleCardChange('cardNumber')}
            />
          </div>
        </div>

        <div className={styles.cardElementRow}>
          <div className={styles.cardElementGroup}>
            <label className={styles.cardElementLabel}>Expiry Date</label>
            <div className={styles.cardElement}>
              <CardExpiryElement 
                options={cardElementOptions}
                onChange={handleCardChange('cardExpiry')}
              />
            </div>
          </div>

          <div className={styles.cardElementGroup}>
            <label className={styles.cardElementLabel}>CVC</label>
            <div className={styles.cardElement}>
              <CardCvcElement 
                options={cardElementOptions}
                onChange={handleCardChange('cardCvc')}
              />
            </div>
          </div>
        </div>

        {cardError && (
          <div className={styles.cardError}>
            {cardError}
          </div>
        )}
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Billing Details</h3>
        
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Full Name *</label>
          <input
            type="text"
            name="name"
            value={billingDetails.name}
            onChange={handleBillingChange}
            placeholder="John Doe"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Email Address *</label>
          <input
            type="email"
            name="email"
            value={billingDetails.email}
            onChange={handleBillingChange}
            placeholder="john@example.com"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={billingDetails.phone}
            onChange={handleBillingChange}
            placeholder="+94 77 123 4567"
            className={styles.input}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !isFormComplete()}
        className={`${styles.payButton} ${processing ? styles.processing : ''}`}
      >
        {processing ? (
          <>
            <span className={styles.spinner}></span>
            Processing Payment...
          </>
        ) : (
          `Pay Rs. ${parseFloat(amount).toLocaleString()}`
        )}
      </button>

      <div className={styles.securePaymentContainer}>
        <div className={styles.securePayment}>
          <span>Secure payment powered by Stripe</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={processing}
        >
          Cancel Booking
        </button>
      </div>
    </form>
  );
};

const CaregiverPayment = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [timerExpired, setTimerExpired] = useState(false);

  // Get booking data from URL params
  const tempBookingId = searchParams.get('tempBookingId');
  const elderId = searchParams.get('elderId');
  const caregiverId = searchParams.get('caregiverId');
  const amount = searchParams.get('amount');
  const duration = searchParams.get('duration');
  const elderName = searchParams.get('elderName');
  const caregiverName = searchParams.get('caregiverName');
  const selectedDates = searchParams.get('selectedDates')?.split(',') || [];

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
    if (!tempBookingId || !elderId || !caregiverId || !amount) {
      console.error('Missing required parameters');
      navigate('/family-member/elder-caregivers', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate, tempBookingId, elderId, caregiverId, amount]);

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize timer from localStorage or server
  useEffect(() => {
    const initializeTimer = async () => {
      if (!tempBookingId) return;

      const storageKey = `payment_timer_${tempBookingId}`;
      const storedTime = localStorage.getItem(storageKey);

      if (storedTime) {
        const remaining = parseInt(storedTime, 10);
        if (remaining > 0) {
          setTimeLeft(remaining);
        } else {
          setTimerExpired(true);
        }
      } else {
        // Try to get from server (fetch temporary booking)
        try {
          const booking = await caregiverApi.getTemporaryBooking(tempBookingId);
          if (booking && booking.expires_at) {
            const expiresAt = new Date(booking.expires_at);
            const now = new Date();
            const remainingSeconds = Math.floor((expiresAt - now) / 1000);
            
            if (remainingSeconds > 0) {
              setTimeLeft(remainingSeconds);
              localStorage.setItem(storageKey, remainingSeconds.toString());
            } else {
              setTimerExpired(true);
            }
          }
        } catch (error) {
          console.error('Error fetching booking expiry:', error);
          // If we can't fetch from server, use default 10 minutes
          setTimeLeft(600);
          localStorage.setItem(storageKey, '600');
        }
      }
    };

    initializeTimer();
  }, [tempBookingId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || timerExpired) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        
        // Update localStorage every 10 seconds
        if (newTime % 10 === 0 && tempBookingId) {
          localStorage.setItem(`payment_timer_${tempBookingId}`, newTime.toString());
        }
        
        if (newTime <= 0) {
          setTimerExpired(true);
          if (tempBookingId) {
            localStorage.removeItem(`payment_timer_${tempBookingId}`);
          }
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerExpired, tempBookingId]);

  // Handle timer expiration
  useEffect(() => {
    if (timerExpired && tempBookingId) {
      // Clean up localStorage
      localStorage.removeItem(`payment_timer_${tempBookingId}`);
      
      // Redirect after showing message
      const redirectTimer = setTimeout(() => {
        navigate('/family-member-dashboard');
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [timerExpired, tempBookingId, navigate]);

  const handlePaymentSuccess = async (paymentData) => {
    try {
      console.log('Payment successful, confirming booking...');

      // Confirm payment and create care request
      const confirmResponse = await caregiverApi.confirmPayment({
        tempBookingId: parseInt(tempBookingId),
        paymentMethod: paymentData.paymentMethod,
        paymentAmount: parseFloat(amount),
        transactionId: paymentData.transactionId,
        paymentStatus: paymentData.paymentStatus
      });

      console.log('Booking confirmed:', confirmResponse);

      if (!confirmResponse.success) {
        throw new Error(confirmResponse.error || 'Failed to confirm booking');
      }

      setPaymentSuccess(true);

      // Navigate to success page after short delay
      setTimeout(() => {
        navigate(`/family-member/caregiver-payment-success?careRequestId=${confirmResponse.careRequest.request_id}&amount=${amount}&elderName=${elderName}&caregiverName=${caregiverName}&duration=${duration}`);
      }, 1500);

    } catch (err) {
      console.error('Error confirming booking:', err);
      setPaymentError(err.message || 'Payment successful but booking confirmation failed');
    }
  };

  const handlePaymentError = async (errorMessage) => {
    setPaymentError(errorMessage);
    
    // Cancel temporary booking
    try {
      await caregiverApi.cancelTemporaryBooking(tempBookingId);
      console.log('Temporary booking cancelled due to payment failure');
    } catch (err) {
      console.error('Error cancelling temporary booking:', err);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await caregiverApi.cancelTemporaryBooking(tempBookingId);
        navigate('/family-member/elder-caregivers');
      } catch (err) {
        console.error('Error cancelling booking:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <h2>Payment Successful!</h2>
            <p>Redirecting to confirmation page...</p>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  // Show timer expired message
  if (timerExpired) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.expiredContainer}>
            <div className={styles.expiredIcon}>!</div>
            <h2>Booking Expired</h2>
            <p>Your booking reservation has expired. Redirecting to dashboard...</p>
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
          {/* Header with Timer */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Complete Your Payment</h1>
              <p className={styles.subtitle}>
                Secure payment for caregiver booking
              </p>
            </div>
            <div className={styles.timerContainer}>
              <div className={styles.timer}>
                <span className={styles.timerText}>Time remaining:</span>
                <span className={`${styles.timerValue} ${timeLeft <= 60 ? styles.timerCritical : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              {timeLeft <= 60 && (
                <div className={styles.timerWarning}>
                  Hurry! Your booking will expire soon
                </div>
              )}
            </div>
          </div>

          <div className={styles.paymentLayout}>
            {/* Left Side - Booking Summary */}
            <div className={styles.bookingSummaryCard}>
              <h2 className={styles.summaryTitle}>Booking Summary</h2>
              
              <div className={styles.summarySection}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Elder:</span>
                  <span className={styles.summaryValue}>{elderName}</span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Caregiver:</span>
                  <span className={styles.summaryValue}>{caregiverName}</span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Duration:</span>
                  <span className={styles.summaryValue}>{duration} days</span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Selected Dates:</span>
                  <div className={styles.datesList}>
                    {selectedDates.slice(0, 3).map((date, index) => (
                      <span key={index} className={styles.dateItem}>{date}</span>
                    ))}
                    {selectedDates.length > 3 && (
                      <span className={styles.moreDates}>
                        +{selectedDates.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.totalAmount}>
                <span className={styles.totalLabel}>Total Amount:</span>
                <span className={styles.totalValue}>Rs. {parseFloat(amount).toLocaleString()}</span>
              </div>

              <div className={styles.paymentNote}>
                <p>Your booking will be confirmed immediately after successful payment.</p>
              </div>
            </div>

            {/* Right Side - Payment Form */}
            <div className={styles.paymentCard}>
              {paymentError && (
                <div className={styles.errorAlert}>
                  <div>
                    <strong>Payment Failed</strong>
                    <p>{paymentError}</p>
                  </div>
                </div>
              )}

              <Elements stripe={stripePromise}>
                <CaregiverPaymentForm
                  amount={amount}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  processing={processing}
                  setProcessing={setProcessing}
                  onCancel={handleCancel}
                  bookingData={{
                    tempBookingId,
                    elderId,
                    caregiverId,
                    elderName,
                    caregiverName,
                    duration,
                    selectedDates
                  }}
                />
              </Elements>
            </div>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default CaregiverPayment;
