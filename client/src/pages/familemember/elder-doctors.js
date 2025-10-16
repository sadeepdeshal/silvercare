import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/elder-doctors.module.css';
import {feedbackApi} from '../../services/feedbackApi';
import StarRating from '../../components/StarRating';


const ElderDoctors = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { elderId } = useParams();
  const [doctors, setDoctors] = useState([]);
  const [elderInfo, setElderInfo] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [meetingType, setMeetingType] = useState(null); // 'physical' or 'online'
  const [showMeetingSelection, setShowMeetingSelection] = useState(true);

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
  }, [currentUser, isAuthenticated, loading, navigate]);

  // ...existing code...
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchAllFeedbacks = async () => {
      try {
        const response = await feedbackApi.getAllFeedback();
        // Check if the response and the feedbacks array are valid
        if (response && response.success && Array.isArray(response.feedbacks)) {
          console.log('Feedbacks successfully fetched:', response.feedbacks);
          setFeedbacks(response.feedbacks);
        } else {
          // Log a warning if the data is not what you expect
          console.warn('Failed to receive valid feedback data:', response);
          setFeedbacks([]);
        }
      } catch (err) {
        console.error('An error occurred while fetching feedbacks:', err);
        setFeedbacks([]);
      }
    };
    fetchAllFeedbacks();
  }, []);

  const getDoctorAverageRating = (doctor_id) => {
    // Ensure doctor_id is treated as a number for comparison
    const doctorIdAsNumber = Number(doctor_id);

    const doctorFeedbacks = feedbacks.filter(fb => 
      Number(fb.doctor_id) === doctorIdAsNumber && !isNaN(Number(fb.rating))
    );

    if (doctorFeedbacks.length === 0) {
      return 'No ratings';
    }

    const avg = doctorFeedbacks.reduce((sum, fb) => sum + Number(fb.rating), 0) / doctorFeedbacks.length;
    return avg.toFixed(1);
  };
// ...existing code... change this
  // Fetch doctors data based on meeting type
  const fetchDoctors = async (selectedMeetingType) => {
    if (!elderId) {
      setError('Elder ID is required');
      setDataLoading(false);
      return;
    }
    
    try {
      setDataLoading(true);
      setError(null);
      
      console.log('Fetching doctors for elder ID:', elderId, 'Meeting type:', selectedMeetingType);
      
      let response;
      if (selectedMeetingType === 'physical') {
        response = await elderApi.getDoctorsByElderDistrict(elderId);
      } else if (selectedMeetingType === 'online') {
        response = await elderApi.getAllDoctorsForOnlineMeeting(elderId);
      }
      
      console.log('Doctors API response:', response);
      
      if (response.success) {
        setDoctors(response.doctors || []);
        setElderInfo(response.elderInfo);
        setMeetingType(selectedMeetingType);
        setShowMeetingSelection(false);
      } else {
        setError(response.error || 'Failed to load doctors data');
      }
      
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.message || 'Failed to load doctors data');
    } finally {
      setDataLoading(false);
    }
  };

  // Handle meeting type selection
  const handleMeetingTypeSelection = (selectedType) => {
    fetchDoctors(selectedType);
  };

  // Handle back to meeting selection
  const handleBackToSelection = () => {
    setShowMeetingSelection(true);
    setMeetingType(null);
    setDoctors([]);
    setElderInfo(null);
    setError(null);
  };

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor =>
    doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.current_institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // UPDATED: Handle book appointment - navigate to specific appointment pages
  const handleBookAppointment = (doctorId) => {
    if (meetingType === 'physical') {
      navigate(`/family-member/book-appointment/${elderId}/${doctorId}/physical?meetingType=${meetingType}`);
    } else if (meetingType === 'online') {
      navigate(`/family-member/book-appointment/${elderId}/${doctorId}/online?meetingType=${meetingType}`);
    }
  };

  const handleViewDoctorProfile = (doctorId) => {
    // Navigate to doctor profile page
    navigate(`/family-member/doctor/${doctorId}`);
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
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <FamilyMemberLayout>
        <div className={styles.content}>
          {/* Meeting Type Selection */}
          {showMeetingSelection && (
            <div className={styles.meetingSelection}>
              <div className={styles.selectionHeader}>
                <h1 className={styles.title}>Choose Meeting Type</h1>
                <p className={styles.subtitle}>
                  How would you like to meet with the doctor?
                </p>
              </div>
              
              <div className={styles.meetingOptions}>
                <div 
                  className={styles.meetingOption}
                  onClick={() => handleMeetingTypeSelection('physical')}
                >
                  <div className={styles.optionIcon}>🏥</div>
                  <h3 className={styles.optionTitle}>Physical Meeting</h3>
                  <p className={styles.optionDescription}>
                    Meet the doctor in person at their clinic or hospital. 
                    Shows doctors in your district only.
                  </p>
                  <div className={styles.optionFeatures}>
                    <span className={styles.feature}>✓ In-person consultation</span>
                    <span className={styles.feature}>✓ Physical examination</span>
                    <span className={styles.feature}>✓ Local doctors only</span>
                    <span className={styles.feature}>✓ 2 hours duration</span>
                  </div>
                  <button className={styles.selectButton}>
                    Select Physical Meeting
                  </button>
                </div>

                <div 
                  className={styles.meetingOption}
                  onClick={() => handleMeetingTypeSelection('online')}
                >
                  <div className={styles.optionIcon}>💻</div>
                  <h3 className={styles.optionTitle}>Online Meeting</h3>
                  <p className={styles.optionDescription}>
                    Video consultation with doctors from anywhere. 
                    Access to all available doctors.
                  </p>
                  <div className={styles.optionFeatures}>
                    <span className={styles.feature}>✓ Video consultation</span>
                    <span className={styles.feature}>✓ All doctors available</span>
                    <span className={styles.feature}>✓ Convenient from home</span>
                    <span className={styles.feature}>✓ 1 hour duration</span>
                  </div>
                  <button className={styles.selectButton}>
                    Select Online Meeting
                  </button>
                </div>
              </div>

              <div className={styles.backSection}>
                <button 
                  className={styles.backButton}
                  onClick={() => navigate('/family-member/elders')}
                >
                  ← Back to Elders
                </button>
              </div>
            </div>
          )}

          {/* Doctors List (shown after meeting type selection) */}
          {!showMeetingSelection && (
            <>
              {/* Header Section */}
              <div className={styles.header}>
                <div className={styles.headerContent}>
                  <h1 className={styles.title}>
                    Available Doctors - {meetingType === 'physical' ? 'Physical Meeting' : 'Online Meeting'}
                  </h1>
                  {elderInfo && (
                    <div className={styles.elderInfo}>
                      <p className={styles.subtitle}>
                        Doctors available for <strong>{elderInfo.name}</strong>
                        {meetingType === 'physical' && elderInfo.district && (
                          <> in <strong>{elderInfo.district}</strong> district</>
                        )}
                        {meetingType === 'online' && (
                          <> - <strong>All Districts</strong> (Online Meeting)</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <div className={styles.headerButtons}>
                  <button 
                    className={styles.changeTypeButton}
                    onClick={handleBackToSelection}
                  >
                    🔄 Change Meeting Type
                  </button>
                  <button 
                    className={styles.backButton}
                    onClick={() => navigate('/family-member/elders')}
                  >
                    ← Back to Elders
                  </button>
                </div>
              </div>

              {/* Search Section */}
              <div className={styles.searchSection}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search doctors by name, specialization, or institution..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                  <div className={styles.searchIcon}>🔍</div>
                </div>
                               <div className={styles.doctorCount}>
                  {dataLoading ? 'Loading...' : `${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? 's' : ''} found`}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className={styles.errorMessage}>
                  <p>⚠️ {error}</p>
                  <button 
                    className={styles.retryButton}
                    onClick={() => fetchDoctors(meetingType)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Content Section */}
              {dataLoading ? (
                <div className={styles.loadingContent}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading available doctors...</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className={styles.emptyState}>
                  {searchTerm ? (
                    <>
                      <div className={styles.emptyIcon}>🔍</div>
                      <h2>No doctors found</h2>
                      <p>No doctors match your search criteria "{searchTerm}"</p>
                      <button 
                        className={styles.clearSearchButton}
                        onClick={() => setSearchTerm('')}
                      >
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.emptyIcon}>👨‍⚕️</div>
                      <h2>No Doctors Available</h2>
                      <p>
                        {meetingType === 'physical' && elderInfo 
                          ? `No approved doctors found in ${elderInfo.district} district.`
                          : 'No doctors available at the moment.'
                        }
                      </p>
                      <p>Please try again later or contact support.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.doctorsGrid}>
                  {filteredDoctors.map((doctor) => (
                    <div key={doctor.doctor_id} className={styles.doctorCard}>
                      {/* Meeting Type Badge */}
                      <div className={styles.meetingTypeBadge}>
                        {meetingType === 'physical' ? '🏥 Physical' : '💻 Online'}
                      </div>

                      {/* Doctor Header */}
                      <div className={styles.doctorHeader}>
                        <div className={styles.doctorAvatar}>
                          <div className={styles.doctorInitial}>
                            {doctor.doctor_name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                        </div>
                        <div className={styles.doctorBasicInfo}>
                          <h3 className={styles.doctorName}>Dr. {doctor.doctor_name}</h3>
                          <p className={styles.doctorSpecialization}>{doctor.specialization}</p>
                        </div>
                      </div>

                      {/* Doctor Details */}
                      <div className={styles.doctorDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailIcon}>🏥</span>
                          <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Institution</span>
                            <span className={styles.detailValue}>{doctor.current_institution}</span>
                          </div>
                        </div>
                        
                        <div className={styles.detailRow}>
                          <span className={styles.detailIcon}>📍</span>
                          <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>District</span>
                            <span className={styles.detailValue}>{doctor.district}</span>
                          </div>
                        </div>
                        
                        <div className={styles.detailRow}>
                          <span className={styles.detailIcon}>📞</span>
                          <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Phone</span>
                            <span className={styles.detailValue}>{doctor.doctor_phone}</span>
                          </div>
                        </div>

                        {doctor.alternative_number && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailIcon}>📱</span>
                            <div className={styles.detailContent}>
                              <span className={styles.detailLabel}>Alternative</span>
                              <span className={styles.detailValue}>{doctor.alternative_number}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className={styles.detailRow}>
                          <span className={styles.detailIcon}>📧</span>
                          <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Email</span>
                            <span className={styles.detailValue}>{doctor.doctor_email}</span>
                          </div>
                        </div>
                        
                        <div className={styles.detailRow}>
                          <span className={styles.detailIcon}>🎓</span>
                          <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Experience</span>
                            <span className={styles.detailValue}>{doctor.years_experience} years</span>
                          </div>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailIcon}>🆔</span>
                          <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>License</span>
                            <span className={styles.detailValue}>{doctor.license_number}</span>
                          </div>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailIcon}>🆔</span>
                          <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Rating</span>
                            <span className={styles.detailValue}>
                              <StarRating rating={getDoctorAverageRating(doctor.doctor_id)} />
                            </span>
                          </div>
                        </div>

                        {/* Duration Info */}
                        <div className={styles.detailRow}>
                          <span className={styles.detailIcon}>⏱️</span>
                          <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Duration</span>
                            <span className={styles.detailValue}>
                              {meetingType === 'physical' ? '2 hours' : '1 hour'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Actions */}
                      <div className={styles.doctorActions}>
                        <button 
                          className={styles.primaryButton}
                          onClick={() => handleBookAppointment(doctor.doctor_id)}
                        >
                          <span className={styles.buttonIcon}>📅</span>
                          Book {meetingType === 'physical' ? 'Physical' : 'Online'} Appointment
                        </button>
                        <button 
                          className={styles.secondaryButton}
                          onClick={() => handleViewDoctorProfile(doctor.doctor_id)}
                        >
                          <span className={styles.buttonIcon}>👁️</span>
                          View Profile
                        </button>
                      </div>

                      {/* Status Indicator */}
                      <div className={styles.statusIndicator}>
                        <div className={styles.statusDot}></div>
                        <span className={styles.statusText}>Available</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Section */}
              <div className={styles.navigationSection}>
                <button 
                  className={styles.changeTypeButton}
                  onClick={handleBackToSelection}
                >
                  🔄 Change Meeting Type
                </button>
                <button 
                  className={styles.backToEldersButton}
                  onClick={() => navigate('/family-member/elders')}
                >
                  ← Back to Elders List
                </button>
                <button 
                  className={styles.backToDashboardButton}
                  onClick={() => navigate('/family-member/dashboard')}
                >
                  🏠 Back to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default ElderDoctors;

