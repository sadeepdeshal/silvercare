import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import commonReg from "../components/images/roles.png";
import rolesImage from "../components/images/roles.png";
// Import as CSS Module
import styles from "../components/css/roles.module.css";

export const Roles = () => {
  const navigate = useNavigate();

  const handleCaregiverClick = () => {
    navigate('/caregiver/signup');
  };

  const handleFamilyMemberClick = () => {
    navigate('/family-member/signup');
  };

  const handleDoctorClick = () => {
    navigate('/doctor/signup');
  };

  const handleMentalHealthProfessionalClick = () => {
    navigate('/healthproffesional/signup');
  };

  return (
    <div className={styles.rolesPage}>
      <div className={styles.rolesBg}>
        <div className={styles.leftSection}>
          <img className={styles.mainImage} alt="Registration" src={commonReg} />
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formContaine}>
            <div className={styles.formHeader}>
              
            </div>

            <div className={styles.rolesSelection}>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Select Registration Type</h3>
                <p className={styles.sectionSubtitle}>Choose the option that best describes you</p>

                <div className={styles.roleOptions}>
                  <div className={styles.roleCard} onClick={handleCaregiverClick}>
                    <div className={styles.roleContent}>
                      <div className={styles.roleIcon}>👩‍⚕️</div>
                      <h4 className={styles.roleTitle}>Caregiver</h4>
                      <p className={styles.roleDescription}>
                        Professional caregivers providing elderly care services
                      </p>
                      <div className={styles.roleFeatures}>
                        <span className={styles.feature}>• Manage client profiles</span>
                        <span className={styles.feature}>• Schedule appointments</span>
                        <span className={styles.feature}>• Track care activities</span>
                      </div>
                    </div>
                    <button className={`${styles.roleBtn} ${styles.caregiverBtn}`}>
                      Register as Caregiver
                    </button>
                  </div>

                  <div className={styles.roleCard} onClick={handleFamilyMemberClick}>
                    <div className={styles.roleContent}>
                      <div className={styles.roleIcon}>👨‍👩‍👧‍👦</div>
                      <h4 className={styles.roleTitle}>Family Member</h4>
                      <p className={styles.roleDescription}>
                        Family members seeking care services for their loved ones
                      </p>
                      <div className={styles.roleFeatures}>
                        <span className={styles.feature}>• Find qualified caregivers</span>
                        <span className={styles.feature}>• Monitor care progress</span>
                        <span className={styles.feature}>• Communicate with care team</span>
                      </div>
                    </div>
                    <button className={`${styles.roleBtn} ${styles.familyBtn}`}>
                      Register as Family Member
                    </button>
                  </div>

                  <div className={styles.roleCard} onClick={handleDoctorClick}>
                    <div className={styles.roleContent}>
                      <div className={styles.roleIcon}>👨‍⚕️</div>
                      <h4 className={styles.roleTitle}>Doctor</h4>
                      <p className={styles.roleDescription}>
                        Medical professionals providing healthcare services
                      </p>
                      <div className={styles.roleFeatures}>
                        <span className={styles.feature}>• Manage patient records</span>
                        <span className={styles.feature}>• Provide medical consultations</span>
                        <span className={styles.feature}>• Monitor health conditions</span>
                      </div>
                    </div>
                    <button className={`${styles.roleBtn} ${styles.doctorBtn}`}>
                      Register as Doctor
                    </button>
                  </div>

                  <div className={styles.roleCard} onClick={handleMentalHealthProfessionalClick}>
                    <div className={styles.roleContent}>
                      <div className={styles.roleIcon}>🧠</div>
                      <h4 className={styles.roleTitle}>Mental Health Professional</h4>
                      <p className={styles.roleDescription}>
                        Specialists providing mental health and wellness support
                      </p>
                      <div className={styles.roleFeatures}>
                        <span className={styles.feature}>• Conduct therapy sessions</span>
                        <span className={styles.feature}>• Mental health assessments</span>
                        <span className={styles.feature}>• Wellness program management</span>
                      </div>
                    </div>
                    <button className={`${styles.roleBtn} ${styles.mentalHealthBtn}`}>
                      Register as Counseller
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formFooter}>
              <p className={styles.loginPrompt}>Already Have An Account?</p>
              <Link to="/login" className={styles.signInLink}>Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
