import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import CaregiverLayout from '../../components/CaregiverLayout';
import caregiverApi from '../../services/caregiverApi2';
import styles from "../../components/css/caregiver/care-request-details.module.css";
import RequestCountdownTimer from '../../components/RequestCountdownTimer.jsx';

const CareRequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [careRequest, setCareRequest] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success'); // 'success' or 'error'
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    fetchCareRequestDetails();
  }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCareRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await caregiverApi.getCareRequestDetails(requestId);
      
      if (response.success) {
        setCareRequest(response.careRequest);
      } else {
        setError('Failed to fetch care request details');
      }
    } catch (error) {
      console.error('Error fetching care request details:', error);
      setError('Failed to fetch care request details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      console.log('Updating status to:', newStatus); // Debug log
      const response = await caregiverApi.updateCareRequestStatus(requestId, newStatus);
      console.log('API Response:', response); // Debug log
      
      if (response.success) {
        // Show success message and navigate back
        let message;
        if (newStatus === 'confirmed') {
          message = 'Care request confirmed successfully!';
        } else if (newStatus === 'cancelled') {
          // Check if refund was processed
          if (response.refund) {
            message = 'Care request cancelled successfully! Refund has been processed. The family will receive their refund within 5-10 business days.';
          } else {
            message = 'Care request cancelled successfully!';
          }
        } else {
          message = `Care request ${newStatus} successfully!`;
        }
        
        showPopupMessage(message, 'success');
        
        // Navigate back after showing popup
        setTimeout(() => {
          navigate('/caregiver/dashboard');
        }, 3000); // Increased to 3 seconds to show refund message
      } else {
        console.error('API Error:', response.message || response.error); // Debug log
        showPopupMessage('Failed to update care request status', 'error');
      }
    } catch (error) {
      console.error('Error updating care request status:', error);
      showPopupMessage('Failed to update care request status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const showPopupMessage = (message, type = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  const showConfirmationPopup = (action, message) => {
    setConfirmAction(action);
    setConfirmMessage(message);
    setShowConfirmPopup(true);
  };

  const handleConfirmAction = () => {
    setShowConfirmPopup(false);
    if (confirmAction === 'confirm') {
      handleStatusUpdate('confirmed');
    } else if (confirmAction === 'cancel') {
      handleStatusUpdate('cancelled');
    }
  };

  const handleCancelAction = () => {
    setShowConfirmPopup(false);
  };

  const handleApprove = () => {
    showConfirmationPopup('confirm', 'Are you sure you want to confirm this care request?');
  };

  const handleCancel = () => {
    showConfirmationPopup('cancel', 'Are you sure you want to cancel this care request? The family member will receive a full refund within 5-10 business days.');
  };

  const handleBack = () => {
    navigate('/caregiver/care-requests');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time left until start date
  const getTimeLeft = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffMs = start - now;
    
    // Get today's date without time for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateOnly = new Date(start);
    startDateOnly.setHours(0, 0, 0, 0);
    
    // If start date equals today, show "Started"
    if (startDateOnly.getTime() === today.getTime()) {
      return 'Started';
    }
    
    // If start date is before today (overdue), show hours/minutes overdue
    if (startDateOnly < today) {
      const overdueDiffMs = Math.abs(diffMs);
      const overdueHours = Math.floor(overdueDiffMs / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((overdueDiffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let overdueResult = '';
      if (overdueHours > 0) overdueResult += `${overdueHours} hour${overdueHours !== 1 ? 's' : ''} `;
      if (overdueMinutes > 0) overdueResult += `${overdueMinutes} min${overdueMinutes !== 1 ? 's' : ''}`;
      
      return `${overdueResult.trim()}`;
    }
    
    // Future date - show normal countdown
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = '';
    
    // Always show days (even if 0) when there are hours remaining
    if (diffDays > 0 || diffHours > 0) {
      result += `${diffDays} day${diffDays !== 1 ? 's' : ''} `;
    }
    
    // Show hours if there are any, or if days is 0 and we have time left
    if (diffHours > 0 || (diffDays === 0 && diffMs > 0)) {
      result += `${diffHours} hour${diffHours !== 1 ? 's' : ''} `;
    }
    
    // Only show minutes if less than 1 day and no hours
    if (diffDays === 0 && diffHours === 0 && diffMinutes > 0) {
      result += `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}`;
    }
    
    return result.trim() || '0 mins';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading care request details...</p>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.error}>
            <p>{error}</p>
            <button className={styles.backButton} onClick={handleBack}>
              ← Back to care requests page
            </button>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CaregiverLayout>
        <div className={styles.container}>
           <button className={styles.backButton} onClick={handleBack}>
            ← Back to care requests page
            </button>
            
          <div className={styles.header}>
           
            <h1>Care Request Details</h1>
            <div className={styles.statusBadge}>
              <span className={`${styles.status} ${styles[careRequest?.status?.toLowerCase()]}`}>
                {careRequest?.status?.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className={styles.content}>
            <div className={styles.requestInfo}>
              <div className={styles.infoCard}>
                <h2>Request Information</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Request Date:</label>
                    <span>{formatDateTime(careRequest?.request_date)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Start Date:</label>
                    <span>{formatDate(careRequest?.start_date)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>End Date:</label>
                    <span>{formatDate(careRequest?.end_date)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Duration: </label>
                    <span>{careRequest?.duration} days</span>
                  </div>
                  {/* Show countdown timer for pending requests */}
                  <div className={styles.infoItem}>
                    <label>Time Left to Accept:</label>
                    <RequestCountdownTimer 
                      requestDate={careRequest?.request_date}
                      status={careRequest?.status}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h2>Elder Information</h2>
                <div className={styles.elderInfo}>
                  {careRequest?.elder_photo && (
                    <div className={styles.elderPhoto}>
                      <img 
                        src={`http://localhost:5000/uploads/profiles/${careRequest.elder_photo}`} 
                        alt={careRequest?.elder_name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className={styles.elderDetails}>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <label>Name:</label>
                        <span>{careRequest?.elder_name}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Age:</label>
                        <span>{careRequest?.elder_age} years</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Gender:</label>
                        <span>{careRequest?.elder_gender}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Contact:</label>
                        <span>{careRequest?.elder_contact}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Email:</label>
                        <span>{careRequest?.elder_email}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>District:</label>
                        <span>{careRequest?.elder_district}</span>
                      </div>
                    </div>
                    <div className={styles.fullWidth}>
                      <label>Address:</label>
                      <span>{careRequest?.elder_address}</span>
                    </div>
                    {careRequest?.medical_conditions && (
                      <div className={styles.fullWidth}>
                        <label>Medical Conditions:</label>
                        <span className={styles.medicalConditions}>
                          {careRequest.medical_conditions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h2>Family Member Information</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Name:</label>
                    <span>{careRequest?.family_member_name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Email:</label>
                    <span>{careRequest?.family_member_email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Phone:</label>
                    <span>{careRequest?.family_member_phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {careRequest?.status === 'pending' && (
              <div className={styles.actionButtons}>
                <button 
                  className={`${styles.actionButton} ${styles.approveButton}`}
                  onClick={handleApprove}
                  disabled={updating}
                >
                  {updating ? 'Processing...' : '✓ confirm Request'}
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.cancelButton}`}
                  onClick={handleCancel}
                  disabled={updating}
                >
                  {updating ? 'Processing...' : '✕ Cancel Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      </CaregiverLayout>

      {/* Success/Error Popup */}
      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={`${styles.popup} ${styles[popupType]}`}>
            <div className={styles.popupContent}>
              <div className={styles.popupIcon}>
                {popupType === 'success' ? '✅' : '❌'}
              </div>
              <p className={styles.popupMessage}>{popupMessage}</p>
              <button 
                className={styles.popupClose}
                onClick={() => setShowPopup(false)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.confirmPopup}>
            <div className={styles.confirmContent}>
              <div className={styles.confirmIcon}>
                {confirmAction === 'confirm' ? '✅' : '⚠️'}
              </div>
              <h3 className={styles.confirmTitle}>
                {confirmAction === 'confirm' ? 'Confirmation' : 'Cancellation'}
              </h3>
              <p className={styles.confirmMessage}>{confirmMessage}</p>
              <div className={styles.confirmButtons}>
                <button 
                  className={`${styles.confirmBtn} ${styles.okBtn}`}
                  onClick={handleConfirmAction}
                  disabled={updating}
                >
                  {updating ? 'Processing...' : 'OK'}
                </button>
                <button 
                  className={`${styles.confirmBtn} ${styles.cancelBtn}`}
                  onClick={handleCancelAction}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CareRequestDetails;
