import React from 'react';
import styles from './css/WelcomeModal.module.css';

const WelcomeModal = ({ isVisible, onStartTour, onSkip, userName }) => {
  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Welcome to Silvercare, Dr. {userName}!</h2>
          <div className={styles.welcomeIcon}>🩺</div>
        </div>
        
        <div className={styles.modalBody}>
          <p>
            We're excited to have you join our healthcare platform. 
            Would you like to take a quick tour of your dashboard to get familiar with all the features?
          </p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>👥</span>
              <span>Manage patient consultations</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📅</span>
              <span>Schedule appointments</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📊</span>
              <span>View analytics and reports</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>⚡</span>
              <span>Quick actions and tasks</span>
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.skipButton}
            onClick={onSkip}
          >
            Skip Tour
          </button>
          <button 
            className={styles.startButton}
            onClick={onStartTour}
          >
            Start Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
