import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import CaregiverLayout from '../../components/CaregiverLayout';
import { caregiverApi } from '../../services/caregiverApi';
import styles from "../../components/css/caregiver/care-request-details.module.css";

const CareRequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [careRequest, setCareRequest] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCareRequestDetails();
  }, [requestId]);

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
      const response = await caregiverApi.updateCareRequestStatus(requestId, newStatus);
      
      if (response.success) {
        // Show success message and navigate back
        alert(`Care request ${newStatus} successfully!`);
        navigate('/caregiver/dashboard');
      } else {
        alert('Failed to update care request status');
      }
    } catch (error) {
      console.error('Error updating care request status:', error);
      alert('Failed to update care request status');
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = () => {
    if (window.confirm('Are you sure you want to approve this care request?')) {
      handleStatusUpdate('approved');
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this care request?')) {
      handleStatusUpdate('cancelled');
    }
  };

  const handleBack = () => {
    navigate('/caregiver/dashboard');
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
              ← Back to Dashboard
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
          <div className={styles.header}>
            <button className={styles.backButton} onClick={handleBack}>
              ← Back to Dashboard
            </button>
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
                    <label>Duration:</label>
                    <span>{careRequest?.duration} days</span>
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
                  {updating ? 'Processing...' : '✓ Approve Request'}
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
    </>
  );
};

export default CareRequestDetails;
