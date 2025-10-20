import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caregiverApi } from '../../services/caregiverApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/caregiver-booking-summary.module.css';

const CaregiverBookingSummary = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get parameters from URL query params
  const elderId = searchParams.get('elder');
  const caregiverId = searchParams.get('caregiver');
  const datesParam = searchParams.get('dates');
  const selectedDates = datesParam ? datesParam.split(',').sort() : [];
  
  const [caregiverInfo, setCaregiverInfo] = useState(null);
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
    if (!elderId || !caregiverId || !selectedDates || selectedDates.length === 0) {
      console.log('Missing required params, redirecting back');
      navigate('/family-member/elder-caregivers', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate, elderId, caregiverId, selectedDates]);

  // Fetch booking info
  useEffect(() => {
    const fetchBookingInfo = async () => {
      if (!elderId || !caregiverId) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await caregiverApi.getCaregiverBookingInfo(elderId, caregiverId);
        
        if (response.success) {
          setCaregiverInfo({
            name: response.caregiver.name,
            district: response.caregiver.district,
            certifications: response.caregiver.certifications,
            email: response.caregiver.email,
            phone: response.caregiver.phone,
            fixed_line: response.caregiver.fixed_line,
            daily_rate: response.caregiver.daily_rate
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
  }, [elderId, caregiverId]);

  // Calculate total cost
  const calculateTotalCost = () => {
    const dailyRate = caregiverInfo?.daily_rate || 0;
    return selectedDates.length * dailyRate;
  };

  // Calculate date range
  const getDateRange = () => {
    if (selectedDates.length === 0) return '';
    if (selectedDates.length === 1) return formatDateForDisplay(selectedDates[0]);
    return `${formatDateForDisplay(selectedDates[0])} to ${formatDateForDisplay(selectedDates[selectedDates.length - 1])}`;
  };

  const handleProceedToPayment = async () => {
    if (!disclaimerAccepted) {
      setError('Please accept the disclaimer and terms & conditions to proceed');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log('Creating temporary booking...');
      
      // Get family_id from currentUser
      if (!currentUser?.user_id) {
        throw new Error('User not authenticated');
      }

      // Get family_id
      const familyResponse = await fetch(`http://localhost:5000/api/family-member/${currentUser.user_id}`);
      const familyData = await familyResponse.json();
      
      if (!familyData.success || !familyData.familyMember) {
        throw new Error('Family member not found');
      }

      const familyId = familyData.familyMember.family_id;
      const totalAmount = calculateTotalCost();

      // Create temporary booking
      const tempBookingResponse = await caregiverApi.createTemporaryBooking({
        elderId: parseInt(elderId),
        caregiverId: parseInt(caregiverId),
        familyId: familyId,
        selectedDates: selectedDates,
        totalAmount: totalAmount,
        elderName: elderInfo?.name,
        caregiverName: caregiverInfo?.name
      });

      console.log('Temporary booking created:', tempBookingResponse);

      if (!tempBookingResponse.success) {
        throw new Error(tempBookingResponse.error || 'Failed to create temporary booking');
      }

      // Navigate to payment page with booking data
      const params = new URLSearchParams({
        tempBookingId: tempBookingResponse.tempBooking.temp_booking_id,
        elderId: elderId,
        caregiverId: caregiverId,
        amount: totalAmount,
        duration: selectedDates.length,
        elderName: elderInfo?.name || 'Elder',
        caregiverName: caregiverInfo?.name || 'Caregiver',
        selectedDates: selectedDates.join(','),
        bookingType: 'caregiver'
      });

      navigate(`/family-member/caregiver-payment?${params.toString()}`);

    } catch (err) {
      console.error('Error proceeding to payment:', err);
      setError(err.message || 'Failed to proceed to payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoBack = () => {
    const backUrl = `/family-member/elder/${elderId}/caregiver-booking/${caregiverId}`;
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
                Caregiver Booking Summary
              </h1>
              <p className={styles.subtitle}>
                Review all booking details before proceeding to payment
              </p>
            </div>
            <button 
              className={styles.backButton}
              onClick={handleGoBack}
            >
              ← Back to Date Selection
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.summaryContainer}>
            {/* Booking Summary Card */}
            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h2>Booking Summary</h2>
              </div>

              <div className={styles.cardBody}>
                {/* Combined Info Grid */}
                <div className={styles.infoGrid}>
                  {/* Caregiver Column */}
                  <div className={styles.infoColumn}>
                    <h3 className={styles.columnTitle}>Caregiver</h3>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Name:</span>
                      <span className={styles.value}>{caregiverInfo?.name}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Phone:</span>
                      <span className={styles.value}>{caregiverInfo?.phone}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>District:</span>
                      <span className={styles.value}>{caregiverInfo?.district}</span>
                    </div>
                  </div>

                  {/* Elder Column */}
                  <div className={styles.infoColumn}>
                    <h3 className={styles.columnTitle}>Elder</h3>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Name:</span>
                      <span className={styles.value}>{elderInfo?.name}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Age:</span>
                      <span className={styles.value}>{elderInfo?.age} years</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>District:</span>
                      <span className={styles.value}>{elderInfo?.district}</span>
                    </div>
                  </div>

                  {/* Service Details Column */}
                  <div className={styles.infoColumn}>
                    <h3 className={styles.columnTitle}>Service Details</h3>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Total Days:</span>
                      <span className={styles.value}>{selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Daily Rate:</span>
                      <span className={styles.value}>Rs. {caregiverInfo?.daily_rate?.toLocaleString()}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Total Cost:</span>
                      <span className={styles.totalValue}>Rs. {calculateTotalCost().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer Card */}
            <div className={styles.disclaimerCard}>
              <div className={styles.disclaimerHeader}>
                <h2>Important Terms</h2>
              </div>
              
              <div className={styles.disclaimerBody}>
                <ul className={styles.termsList}>
                  <li>Caregiver services will be provided at the elder's home location as per scheduled dates</li>
                  <li>Full payment is required before service commencement via secure payment gateway</li>
                  <li>Cancellations made within 2 hours of booking are eligible for full refund</li>
                  <li>Your personal information will be kept confidential and secure</li>
                </ul>

                <div className={styles.acceptanceSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>
                      I accept the terms and conditions
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <div className={styles.proceedSection}>
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
                  `Proceed to Payment - Rs. ${calculateTotalCost().toLocaleString()}`
                )}
              </button>
              
              {!disclaimerAccepted && (
                <p className={styles.proceedNote}>
                  Please accept the terms to proceed
                </p>
              )}
            </div>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default CaregiverBookingSummary;
