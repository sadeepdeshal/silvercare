import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/booking-summary.module.css';

const BookingSummary = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { elderId, doctorId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Get booking details from URL params
  const appointmentDate = searchParams.get('date');
  const appointmentTime = searchParams.get('time');
  const appointmentType = searchParams.get('type');
  
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [elderInfo, setElderInfo] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

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

  // Fetch booking info
  useEffect(() => {
    const fetchBookingInfo = async () => {
      if (!elderId || !doctorId) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await elderApi.getAppointmentBookingInfo(elderId, doctorId);
        
        if (response.success) {
          setDoctorInfo({
            name: `Dr. ${response.doctor.name}`,
            specialization: response.doctor.specialization,
            institution: response.doctor.institution,
            district: response.doctor.district,
            fee: appointmentType === 'physical' ? response.doctor.physical_fee : response.doctor.online_fee,
            email: response.doctor.email,
            phone: response.doctor.phone,
            years_experience: response.doctor.years_experience
          });
          
          setElderInfo({
            name: response.elder.name,
            age: response.elder.age,
            district: response.elder.district,
            gender: response.elder.gender,
            contact: response.elder.contact,
            medical_conditions: response.elder.medical_conditions
          });
        } else {
          throw new Error(response.error || 'Failed to fetch booking information');
        }
        
      } catch (err) {
        console.error('Error fetching booking info:', err);
        setError(err.message || 'Failed to load booking information');
      } finally {
        setDataLoading(false);
      }
    };

    fetchBookingInfo();
  }, [elderId, doctorId, appointmentType]);

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
    if (!appointmentDate || !appointmentTime || !appointmentType) {
      navigate(`/family-member/elder/${elderId}/doctors`, { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate, elderId, appointmentDate, appointmentTime, appointmentType]);

  const handleProceedToPayment = async () => {
    if (!disclaimerAccepted) {
      setError('Please accept the disclaimer to proceed');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // First, create a temporary booking to block the slot
      const tempBookingData = {
        doctorId: parseInt(doctorId),
        appointmentDate,
        appointmentTime,
        appointmentType,
        patientName: elderInfo.name,
        contactNumber: elderInfo.contact,
        symptoms: `${appointmentType} consultation requested`,
        notes: `Booked through ${appointmentType} appointment system`,
        emergencyContact: elderInfo.contact,
        preferredPlatform: appointmentType === 'online' ? 'zoom' : null,
        isTemporary: true // Flag to indicate this is a temporary booking
      };

      console.log('Creating temporary booking:', tempBookingData);

      const response = await elderApi.createTemporaryBooking(elderId, tempBookingData);
      
      if (response.success) {
        // Redirect to payment gateway with booking details
        const paymentParams = new URLSearchParams({
          tempBookingId: response.tempBooking.temp_booking_id,
          elderId,
          doctorId,
          date: appointmentDate,
          time: appointmentTime,
          type: appointmentType,
          amount: doctorInfo.fee,
          doctorName: doctorInfo.name,
          elderName: elderInfo.name
        });

        navigate(`/family-member/payment?${paymentParams.toString()}`);
      } else {
        throw new Error(response.error || 'Failed to create temporary booking');
      }
      
    } catch (err) {
      console.error('Error proceeding to payment:', err);
      setError(err.message || 'Failed to proceed to payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoBack = () => {
    const backUrl = appointmentType === 'physical' 
      ? `/family-member/elder/${elderId}/physical-appointment/${doctorId}`
      : `/family-member/elder/${elderId}/online-appointment/${doctorId}`;
    navigate(backUrl);
  };

  // Show loading while checking authentication
  if (loading || dataLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading booking information...</h2>
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
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>
                📋 Booking Summary
              </h1>
              <p className={styles.subtitle}>
                Review your appointment details before proceeding to payment
              </p>
            </div>
            <button 
              className={styles.backButton}
              onClick={handleGoBack}
            >
              ← Back to Appointment
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div className={styles.summaryContainer}>
            {/* Appointment Summary Card */}
            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h2>📅 Appointment Details</h2>
                <span className={styles.appointmentType}>
                  {appointmentType === 'physical' ? '🏥 Physical' : '💻 Online'}
                </span>
              </div>
              
              <div className={styles.summaryDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Date:</span>
                  <span className={styles.value}>{formatDateForDisplay(appointmentDate)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Time:</span>
                  <span className={styles.value}>{formatTimeForDisplay(appointmentTime)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Duration:</span>
                  <span className={styles.value}>{appointmentType === 'physical' ? '2 hours' : '1 hour'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Type:</span>
                  <span className={styles.value}>{appointmentType === 'physical' ? 'Physical Meeting' : 'Online Meeting'}</span>
                </div>
                {appointmentType === 'online' && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Platform:</span>
                    <span className={styles.value}>Zoom</span>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Info Card */}
            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>👨‍⚕️</div>
              <div className={styles.cardContent}>
                <h3>Doctor Information</h3>
                {doctorInfo && (
                  <>
                    <p><strong>{doctorInfo.name}</strong></p>
                    <p>{doctorInfo.specialization}</p>
                    <p>{doctorInfo.institution}</p>
                    <p>📍 {doctorInfo.district}</p>
                    <p>🎓 {doctorInfo.years_experience} years experience</p>
                  </>
                )}
              </div>
            </div>

            {/* Patient Info Card */}
            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>👴</div>
              <div className={styles.cardContent}>
                <h3>Patient Information</h3>
                {elderInfo && (
                  <>
                    <p><strong>{elderInfo.name}</strong></p>
                    <p>Age: {elderInfo.age} years</p>
                    <p>Gender: {elderInfo.gender}</p>
                    <p>📍 {elderInfo.district}</p>
                    <p>📞 {elderInfo.contact}</p>
                    {elderInfo.medical_conditions && (
                      <p><strong>Medical Conditions:</strong> {elderInfo.medical_conditions}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className={styles.paymentCard}>
              <div className={styles.cardHeader}>
                <h2>💰 Payment Summary</h2>
              </div>
              
              <div className={styles.paymentDetails}>
                <div className={styles.paymentRow}>
                  <span className={styles.label}>Consultation Fee:</span>
                  <span className={styles.value}>Rs. {doctorInfo?.fee || 0}</span>
                </div>
                <div className={styles.paymentRow}>
                  <span className={styles.label}>Service Fee:</span>
                  <span className={styles.value}>Rs. 0</span>
                </div>
                <div className={styles.paymentRow + ' ' + styles.total}>
                  <span className={styles.label}>Total Amount:</span>
                  <span className={styles.value}>Rs. {doctorInfo?.fee || 0}</span>
                </div>
              </div>
            </div>

            {/* Disclaimer Section */}
            <div className={styles.disclaimerCard}>
              <div className={styles.cardHeader}>
                <h2>⚠️ Important Disclaimer</h2>
              </div>
              
              <div className={styles.disclaimerContent}>
                <ul className={styles.disclaimerList}>
                  <li>This appointment booking is subject to doctor's availability and confirmation.</li>
                  <li>Payment is non-refundable once the appointment is confirmed by the doctor.</li>
                  <li>You will receive appointment confirmation and meeting details via email/SMS.</li>
                  <li>For online appointments, ensure you have a stable internet connection.</li>
                  <li>Please arrive 10 minutes early for physical appointments.</li>
                  <li>Cancellation must be done at least 2 hours before the appointment time.</li>
                  <li>In case of emergency, contact the provided emergency number.</li>
                  <li>By proceeding, you agree to our terms and conditions.</li>
                </ul>
                
                <div className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    id="disclaimer"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <label htmlFor="disclaimer" className={styles.checkboxLabel}>
                    I have read and accept the above disclaimer and terms & conditions
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                className={styles.backActionButton}
                onClick={handleGoBack}
                disabled={processing}
              >
                ← Back to Appointment
              </button>
              
              <button
                className={styles.proceedButton}
                onClick={handleProceedToPayment}
                                disabled={!disclaimerAccepted || processing}
              >
                {processing ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    Processing...
                  </>
                ) : (
                  '💳 Proceed to Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default BookingSummary;

