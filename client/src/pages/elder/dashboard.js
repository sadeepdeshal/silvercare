import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import { getElderDetailsByEmail } from '../../services/elderApi';
import styles from '../../components/css/elder/dashboard.module.css';

const ElderDashboard = () => {
    const { currentUser } = useAuth();
    const [elderDetails, setElderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFullProfile, setShowFullProfile] = useState(false);

    useEffect(() => {
        const fetchElderDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await getElderDetailsByEmail(currentUser.email);
                setElderDetails(response.data);
            } catch (error) {
                console.error('Error fetching elder details:', error);
                setError(error.response?.data?.error || 'Failed to fetch elder details');
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.email) {
            fetchElderDetails();
        }
    }, [currentUser.email]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getAge = (dob) => {
        if (!dob) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    if (loading) {
        return (
            <div className={styles.dashboardContainer}>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.dashboardContainer}>
                <Navbar />
                <div className={styles.errorContainer}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h2>Oops! Something went wrong</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className={styles.retryBtn}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <Navbar />
            
            <div className={styles.dashboardContent}>
                {/* Welcome Header */}
                <div className={styles.welcomeHeader}>
                    <div className={styles.welcomeText}>
                        <h1>Welcome back, {elderDetails?.name?.split(' ')[0] || 'Elder'}! 👋</h1>
                        <p>Hope you're having a wonderful day</p>
                    </div>
                    <div className={styles.dateTime}>
                        <div className={styles.currentDate}>
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </div>
                    </div>
                </div>

                {/* Profile Summary Card */}
                <div className={styles.profileSummaryCard}>
                    <div className={styles.profileSummaryContent}>
                        <div className={styles.profileImageSection}>
                            {elderDetails?.profile_photo ? (
                                <img 
                                    src={`http://localhost:5000/uploads/profiles/${elderDetails.profile_photo}`}
                                    alt="Profile"
                                    className={styles.profileImage}
                                />
                            ) : (
                                <div className={styles.profilePlaceholder}>
                                    <span>{elderDetails?.name?.charAt(0) || 'E'}</span>
                                </div>
                            )}
                            <div className={styles.statusIndicator}></div>
                        </div>
                        
                        <div className={styles.profileInfo}>
                            <h2>{elderDetails?.name}</h2>
                            <div className={styles.profileMeta}>
                                <span className={styles.age}>Age: {getAge(elderDetails?.dob)}</span>
                                <span className={styles.gender}>{elderDetails?.gender}</span>
                            </div>
                            <div className={styles.contactInfo}>
                                <span>📧 {elderDetails?.email}</span>
                                <span>📱 {elderDetails?.contact}</span>
                            </div>
                        </div>

                        <div className={styles.profileActions}>
                            <button 
                                className={styles.viewProfileBtn}
                                onClick={() => setShowFullProfile(true)}
                            >
                                View Full Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Family Member Card */}
                {elderDetails?.family_member && (
                    <div className={styles.familyMemberCard}>
                        <div className={styles.familyMemberHeader}>
                            <div className={styles.familyIcon}>👨‍👩‍👧‍👦</div>
                            <div>
                                <h3>Your Family Contact</h3>
                                <p>Always here to help you</p>
                            </div>
                        </div>
                        <div className={styles.familyMemberInfo}>
                            <div className={styles.familyDetail}>
                                <strong>{elderDetails.family_member.name}</strong>
                                <span>{elderDetails.family_member.email}</span>
                                <span>{elderDetails.family_member.phone}</span>
                            </div>
                            <div className={styles.familyActions}>
                                <button className={styles.callBtn}>📞</button>
                                <button className={styles.messageBtn}>💬</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions Section */}
                <div className={styles.quickActionsSection}>
                    <h2>Quick Actions</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIcon}>📅</div>
                            <h3>Appointments</h3>
                            <p>View & manage your upcoming appointments</p>
                            <button className={styles.actionButton}>View Appointments</button>
                        </div>

                        <div className={styles.actionCard}>
                            <div className={styles.actionIcon}>💊</div>
                            <h3>Medications</h3>
                            <p>Track your daily medications & reminders</p>
                            <button className={styles.actionButton}>My Medications</button>
                        </div>

                        <div className={styles.actionCard}>
                            <div className={styles.actionIcon}>📋</div>
                            <h3>Health Records</h3>
                            <p>Access your medical history & reports</p>
                            <button className={styles.actionButton}>View Records</button>
                        </div>

                        <div className={styles.actionCard}>
                            <div className={styles.actionIcon}>🩺</div>
                            <h3>Consultations</h3>
                            <p>Schedule video calls with doctors</p>
                            <button className={styles.actionButton}>Book Consultation</button>
                        </div>

                        <div className={styles.actionCard}>
                            <div className={styles.actionIcon}>🧠</div>
                            <h3>Mental Health</h3>
                            <p>Connect with counselors & therapists</p>
                            <button className={styles.actionButton}>Get Support</button>
                        </div>

                        <div className={styles.actionCard}>
                            <div className={styles.actionIcon}>🚨</div>
                            <h3>Emergency</h3>
                            <p>Quick access to emergency contacts</p>
                            <button className={styles.emergencyButton}>Emergency Help</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Profile Modal */}
            {showFullProfile && (
                <div className={styles.modalOverlay} onClick={() => setShowFullProfile(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Complete Profile</h2>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => setShowFullProfile(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.fullProfileGrid}>
                                <div className={styles.profileDetailItem}>
                                    <label>Full Name:</label>
                                    <span>{elderDetails?.name}</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>Date of Birth:</label>
                                    <span>{formatDate(elderDetails?.dob)}</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>Age:</label>
                                    <span>{getAge(elderDetails?.dob)} years</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>Gender:</label>
                                    <span>{elderDetails?.gender}</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>Email:</label>
                                    <span>{elderDetails?.email}</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>Contact:</label>
                                    <span>{elderDetails?.contact}</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>National ID:</label>
                                    <span>{elderDetails?.nic}</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>Address:</label>
                                    <span>{elderDetails?.address}</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>Family ID:</label>
                                    <span>{elderDetails?.family_id}</span>
                                </div>
                                <div className={styles.profileDetailItem}>
                                    <label>Member Since:</label>
                                    <span>{formatDate(elderDetails?.created_at)}</span>
                                </div>
                            </div>
                            
                            {elderDetails?.medical_conditions && (
                                <div className={styles.medicalConditionsSection}>
                                    <h3>Medical Conditions</h3>
                                    <div className={styles.medicalConditionsContent}>
                                        <p>{elderDetails.medical_conditions}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ElderDashboard;
