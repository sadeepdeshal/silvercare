import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import CaregiverLayout from '../../components/CaregiverLayout';
import styles from "../../components/css/caregiver/care-request-details.module.css";

const CareRequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [careRequest, setCareRequest] = useState(null);

  useEffect(() => {
    // For now, this is just a placeholder page
    // You can implement the API call to fetch specific care request details here
    setLoading(false);
  }, [requestId]);

  const handleBack = () => {
    navigate('/caregiver/dashboard');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.loading}>
            <p>Loading care request details...</p>
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
          </div>
          
          <div className={styles.content}>
            <div className={styles.placeholder}>
              <h2>Care Request #{requestId}</h2>
              <p>This page is currently under development.</p>
              <p>Here you will be able to view detailed information about the care request, including:</p>
              <ul>
                <li>Elder information</li>
                <li>Family member contact details</li>
                <li>Care request duration</li>
                <li>Medical conditions</li>
                <li>Status and actions</li>
              </ul>
            </div>
          </div>
        </div>
      </CaregiverLayout>
    </>
  );
};

export default CareRequestDetails;
