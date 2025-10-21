import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/booking-summary.module.css';

const HealthcareProfessionalBookingSummary = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { elderId, counselorId } = useParams();
  const [searchParams] = useSearchParams();
  
  const appointmentDate = searchParams.get('date');
  const appointmentTime = searchParams.get('time');
  const appointmentType = searchParams.get('type'); // 'online' or 'physical'
  const provider = searchParams.get('provider'); // should be 'healthcare'

  const [counselorInfo, setCounselorInfo] = useState(null);
  const [elderInfo, setElderInfo] = useState(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

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

  // Fetch healthcare professional and elder info
  useEffect(() => {
    const fetchBookingInfo = async () => {
      if (!elderId || !counselorId) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching booking info for elder:', elderId, 'counselor:', counselorId, 'type:', appointmentType);
        
        let response;
        
        // Get healthcare professional based on appointment type
        if (appointmentType === 'physical') {
          response = await elderApi.getHealthProfessionalsByElderDistrict(elderId);
        } else {
          response = await elderApi.getAllHealthProfessionalsForOnlineMeeting(elderId);
        }
        
        if (response.success) {
          console.log('Healthcare professional response:', response);
          
          const counselor = response.healthProfessionals.find(
            hp => hp.counselor_id === parseInt(counselorId)
          );
          
          if (counselor) {
            setCounselorInfo({
              counselor_id: counselor.counselor_id,
              name: counselor.counselor_name,
              specialty: counselor.specialty,
              district: counselor.district,
              experience: counselor.years_experience,
              email: counselor.email,
              phone: counselor.phone,
              fee: appointmentType === 'physical' ? 2500 : 1800,
              license_number: counselor.license_number
            });
          } else {
            throw new Error('Healthcare professional not found');
          }
          
          setElderInfo({
            elder_id: response.elderInfo.elder_id,
            name: response.elderInfo.name,
            district: response.elderInfo.district,
            contact: currentUser.phone || ''
          });
          
        } else {
          throw new Error(response.error || 'Failed to fetch healthcare professional information');
        }
        
      } catch (err) {
        console.error('Error fetching booking info:', err);
        setError(err.message || 'Failed to load booking information');
      } finally {
        setDataLoading(false);
      }
    };

    fetchBookingInfo();
  }, [elderId, counselorId, appointmentType, currentUser]);

  // Protect the route
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !currentUser || currentUser.role !== 'family_member') {
      navigate('/login', { replace: true });
      return;
    }

    if (currentUser.role !== 'family_member') {
      navigate('/login', { replace: true });
      return;
    }

    // Validate required params
    if (!appointmentDate || !appointmentTime || !appointmentType) {
      navigate(`/family-member/elder/${elderId}/providers`, { replace: true });
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
        counselorId: parseInt(counselorId),
        appointmentDate,
        appointmentTime,
        appointmentType,
        patientName: elderInfo.name,
        contactNumber: elderInfo.contact,
        symptoms: `${appointmentType} healthcare consultation requested`,
        emergencyContact: elderInfo.contact
      };

      console.log('Creating temporary healthcare professional booking:', tempBookingData);

      // Create temporary booking using the new API endpoint
      const tempBookingResponse = await elderApi.createTemporaryHealthcareProfessionalBooking(elderId, tempBookingData);
      
      if (tempBookingResponse.success) {
        console.log('Temporary healthcare professional booking created:', tempBookingResponse.tempBooking);
        
        const paymentParams = new URLSearchParams({
          tempBookingId: tempBookingResponse.tempBooking.temp_booking_id,
          elderId,
          counselorId,
          appointmentDate,
          appointmentTime,
          appointmentType,
          amount: counselorInfo.fee,
          counselorName: counselorInfo.name,
          elderName: elderInfo.name,
          provider: 'healthcare'
        });

        navigate(`/family-member/healthcare-payment?${paymentParams.toString()}`);
      } else {
        throw new Error(tempBookingResponse.error || 'Failed to create temporary booking');
      }

    } catch (err) {
      console.error('Error proceeding to payment:', err);
      setError(err.message || 'Failed to proceed to payment');
    } finally {
      setProcessing(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !currentUser || currentUser.role !== 'family_member') {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>Please log in as a family member to access this page.</p>
      </div>
    );
  }

  // Show loading while fetching data
  if (dataLoading) {
    return (
      <div>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading booking information...</h2>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <FamilyMemberLayout>
        <div className={styles.summaryContainer}>
          <div className={styles.headerSection}>
            <button 
              className={styles.backButton}
              onClick={() => navigate(-1)}
            >
              ← Back to Appointment Booking
            </button>
            
            <h1 className={styles.pageTitle}>
              📋 Healthcare Consultation Summary
            </h1>
            <p className={styles.pageSubtitle}>
              Review your appointment details before payment
            </p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div className={styles.summaryContent}>
            {/* Appointment Details Card */}
            <div className={styles.appointmentCard}>
              <div className={styles.cardHeader}>
                <h2>📅 Appointment Details</h2>
              </div>
              
              <div className={styles.appointmentInfo}>
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>👩‍⚕️</span>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Healthcare Professional</span>
                      <span className={styles.infoValue}>{counselorInfo?.name || 'Loading...'}</span>
                      <span className={styles.infoSubValue}>{counselorInfo?.specialty}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>👴</span>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Patient</span>
                      <span className={styles.infoValue}>{elderInfo?.name || 'Loading...'}</span>
                      <span className={styles.infoSubValue}>📍 {elderInfo?.district}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>📅</span>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Date</span>
                      <span className={styles.infoValue}>{formatDateForDisplay(appointmentDate)}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>🕐</span>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Time</span>
                      <span className={styles.infoValue}>{formatTimeForDisplay(appointmentTime)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>
                      {appointmentType === 'physical' ? '🏥' : '💻'}
                    </span>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Meeting Type</span>
                      <span className={styles.infoValue}>
                        {appointmentType === 'physical' ? 'Physical Consultation' : 'Online Consultation'}
                      </span>
                      <span className={styles.infoSubValue}>
                        {appointmentType === 'physical' ? '2 hours duration' : '1 hour duration'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>🎓</span>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Experience</span>
                      <span className={styles.infoValue}>{counselorInfo?.experience} years</span>
                      <span className={styles.infoSubValue}>📍 {counselorInfo?.district}</span>
                    </div>
                  </div>
                </div>
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
                  <span className={styles.value}>Rs. {counselorInfo?.fee || 0}</span>
                </div>
                <div className={styles.paymentRow}>
                  <span className={styles.label}>Service Fee:</span>
                  <span className={styles.value}>Rs. 0</span>
                </div>
                <div className={styles.paymentRow + ' ' + styles.total}>
                  <span className={styles.label}>Total Amount:</span>
                  <span className={styles.value}>Rs. {counselorInfo?.fee || 0}</span>
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
                  <li>This appointment booking is subject to healthcare professional's availability</li>
                  {appointmentType === 'online' ? (
                    <>
                      <li>For online appointments, ensure you have a stable internet connection.</li>
                      <li>Please join the meeting 5 minutes early and test your camera and microphone.</li>
                      <li>You will receive meeting details via email after payment confirmation.</li>
                      <li>Online appointments are conducted via secure video conferencing platform.</li>
                    </>
                  ) : (
                    <>
                      <li>For physical appointments, healthcare professional will visit your home.</li>
                      <li>Ensure all relevant documents and previous prescriptions are ready.</li>
                      <li>Please confirm the home address and contact details are accurate.</li>
                      <li>Physical appointments have a 2-hour duration to ensure comprehensive consultation.</li>
                      <li>Get 2 hours for (Home visit + Treatment).</li>
                    </>
                  )}
                  <li>Cancellation must be done 2 hours before the appointment time.</li>
                  <li>By proceeding, you agree to our terms and conditions.</li>
                </ul>
                
                <div className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    id="disclaimer"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className={styles.disclaimerCheckbox}
                  />
                  <label htmlFor="disclaimer" className={styles.checkboxLabel}>
                    I have read and accept the above terms and disclaimer
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionSection}>
              <button
                className={styles.cancelButton}
                onClick={() => navigate(-1)}
                disabled={processing}
              >
                ← Modify Appointment
              </button>
              
              <button
                className={styles.proceedButton}
                onClick={handleProceedToPayment}
                disabled={processing || !disclaimerAccepted}
              >
                {processing ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment →'
                )}
              </button>
            </div>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default HealthcareProfessionalBookingSummary;