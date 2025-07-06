import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import { getElderDetailsByEmail } from '../../services/elderApi';
import styles from '../../components/css/elder/dashboard.module.css';

const ElderDashboard = () => {
    const { currentUser, logout } = useAuth();
    const [elderDetails, setElderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading elder details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Navbar />
                <div className={styles.errorContainer}>
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <Navbar />
            
            <div className={styles.dashboardContent}>
                <div className={styles.header}>
                    <h1>Welcome, {elderDetails?.name || currentUser.name}!</h1>
                    <button className={styles.logoutBtn} onClick={logout}>
                        Logout
                    </button>
                </div>

                <div className={styles.profileSection}>
                    <div className={styles.profileCard}>
                        <div className={styles.profileHeader}>
                            <div className={styles.profileImageContainer}>
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
                            </div>
                            <div className={styles.profileInfo}>
                                <h2>{elderDetails?.name}</h2>
                                <p className={styles.role}>Elder</p>
                            </div>
                        </div>

                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <label>Email:</label>
                                <span>{elderDetails?.email}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <label>Date of Birth:</label>
                                <span>{formatDate(elderDetails?.dob)}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <label>Gender:</label>
                                <span>{elderDetails?.gender || 'N/A'}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <label>Contact Number:</label>
                                <span>{elderDetails?.contact || 'N/A'}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <label>National ID:</label>
                                <span>{elderDetails?.nic || 'N/A'}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <label>Address:</label>
                                <span>{elderDetails?.address || 'N/A'}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <label>Family ID:</label>
                                <span>{elderDetails?.family_id || 'N/A'}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <label>Member Since:</label>
                                <span>{formatDate(elderDetails?.created_at)}</span>
                            </div>
                        </div>

                        {elderDetails?.medical_conditions && (
                            <div className={styles.medicalSection}>
                                <h3>Medical Conditions</h3>
                                <div className={styles.medicalConditions}>
                                    <p>{elderDetails.medical_conditions}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Family Member Section */}
                {elderDetails?.family_member && (
                    <div className={styles.familySection}>
                        <div className={styles.familyCard}>
                            <div className={styles.familyHeader}>
                                <div className={styles.familyIcon}>
                                    👨‍👩‍👧‍👦
                                </div>
                                <div className={styles.familyInfo}>
                                    <h3>Family Member</h3>
                                    <p className={styles.familySubtitle}>Your registered family contact</p>
                                </div>
                            </div>

                            <div className={styles.familyDetails}>
                                <div className={styles.familyDetailItem}>
                                    <label>Name:</label>
                                    <span>{elderDetails.family_member.name}</span>
                                </div>

                                <div className={styles.familyDetailItem}>
                                    <label>Email:</label>
                                    <span>{elderDetails.family_member.email}</span>
                                </div>

                                <div className={styles.familyDetailItem}>
                                    <label>Phone:</label>
                                    <span>{elderDetails.family_member.phone}</span>
                                </div>

                                {elderDetails.family_member.phone_fixed && (
                                    <div className={styles.familyDetailItem}>
                                        <label>Fixed Line:</label>
                                        <span>{elderDetails.family_member.phone_fixed}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.familyActions}>
                                <button className={styles.contactBtn}>
                                    📞 Call Family Member
                                </button>
                                <button className={styles.emailBtn}>
                                    ✉️ Send Email
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!elderDetails?.family_member && (
                    <div className={styles.noFamilySection}>
                        <div className={styles.noFamilyCard}>
                            <div className={styles.noFamilyIcon}>⚠️</div>
                            <h3>No Family Member Registered</h3>
                            <p>You don't have a family member registered in the system yet.</p>
                            <button className={styles.addFamilyBtn}>
                                Add Family Member
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.quickActions}>
                    <h3>Quick Actions</h3>
                    <div className={styles.actionButtons}>
                        <button className={styles.actionBtn}>
                            📅 View Appointments
                        </button>
                        <button className={styles.actionBtn}>
                            💊 Medications
                        </button>
                        <button className={styles.actionBtn}>
                            📋 Medical Records
                        </button>
                        <button className={styles.actionBtn}>
                            🚨 Emergency Contact
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElderDashboard;
