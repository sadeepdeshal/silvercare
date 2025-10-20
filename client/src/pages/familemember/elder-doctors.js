import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/elder-doctors.module.css';

const ElderDoctors = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { elderId } = useParams();
  const [doctors, setDoctors] = useState([]);
  const [elderInfo, setElderInfo] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerType, setProviderType] = useState(null); // 'doctor' or 'healthcare'
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

  // Fetch providers data based on provider type and meeting type
  const fetchProviders = async (selectedProviderType, selectedMeetingType) => {
    if (!elderId) {
      setError('Elder ID is required');
      setDataLoading(false);
      return;
    }
    
    try {
      setDataLoading(true);
      setError(null);
      
      console.log('Fetching providers:', {
        elderId,
        providerType: selectedProviderType,
        meetingType: selectedMeetingType
      });
      
      let response;
      
      if (selectedProviderType === 'doctor') {
        // Doctor appointments
        if (selectedMeetingType === 'physical') {
          response = await elderApi.getDoctorsByElderDistrict(elderId);
        } else if (selectedMeetingType === 'online') {
          response = await elderApi.getAllDoctorsForOnlineMeeting(elderId);
        }
        
        console.log('Doctor API response:', response);
        
        if (response && response.success) {
          setDoctors(response.doctors || []);
          setElderInfo(response.elderInfo);
          setProviderType(selectedProviderType);
          setMeetingType(selectedMeetingType);
          setShowMeetingSelection(false);
        } else {
          setError(response?.error || 'Failed to load doctors data');
        }
      } else if (selectedProviderType === 'healthcare') {
        // Healthcare professional appointments
        if (selectedMeetingType === 'physical') {
          // For physical healthcare appointments, filter by district
          response = await elderApi.getHealthProfessionalsByElderDistrict(elderId);
        } else if (selectedMeetingType === 'online') {
          response = await elderApi.getAllHealthProfessionalsForOnlineMeeting(elderId);
        }
        
        console.log('Healthcare professional API response:', response);
        
        if (response && response.success) {
          setDoctors(response.healthProfessionals || []);
          setElderInfo(response.elderInfo);
          setProviderType(selectedProviderType);
          setMeetingType(selectedMeetingType);
          setShowMeetingSelection(false);
        } else {
          setError(response?.error || 'Failed to load healthcare professionals data');
        }
      }
      
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(err.message || 'Failed to load providers data');
    } finally {
      setDataLoading(false);
    }
  };

  // Handle provider type selection (Step 1)
  const handleProviderTypeSelection = (selectedProviderType) => {
    console.log('Provider type selected:', selectedProviderType);
    setProviderType(selectedProviderType);
    // Stay on meeting selection screen to choose meeting type
  };

  // Handle meeting type selection (Step 2)
  const handleMeetingTypeSelection = (selectedMeetingType) => {
    console.log('Meeting type selected:', selectedMeetingType, 'for provider type:', providerType);
    if (!providerType) {
      console.error('No provider type selected!');
      return;
    }
    fetchProviders(providerType, selectedMeetingType);
  };

  // Handle back to provider type selection
  const handleBackToProviderSelection = () => {
    setProviderType(null);
    setMeetingType(null);
    setDoctors([]);
    setElderInfo(null);
    setError(null);
  };

  // Handle back to meeting selection
  const handleBackToSelection = () => {
    setShowMeetingSelection(true);
    setProviderType(null);
    setMeetingType(null);
    setDoctors([]);
    setElderInfo(null);
    setError(null);
  };

  // Filter providers based on search term (works for both doctors and healthcare professionals)
  const filteredDoctors = doctors.filter(provider => {
    if (providerType === 'healthcare') {
      // Filter healthcare professionals
      return (
        provider.counselor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.district?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Filter doctors
      return (
        provider.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.current_institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.district?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });

  // Handle book appointment - navigate to specific appointment pages
  const handleBookAppointment = (providerId) => {
    if (providerType === 'doctor') {
      // Doctor appointments - use existing doctor appointment routes
      if (meetingType === 'physical') {
        const url = `/family-member/book-appointment/${elderId}/${providerId}/physical?meetingType=${meetingType}`;
        navigate(url);
      } else if (meetingType === 'online') {
        const url = `/family-member/book-appointment/${elderId}/${providerId}/online?meetingType=${meetingType}`;
        navigate(url);
      }
    } else if (providerType === 'healthcare') {
      // Healthcare professional appointments - now with separate pages matching doctor system
      if (meetingType === 'physical') {
        const url = `/family-member/physical-healthcare-appointment/${elderId}/${providerId}`;
        navigate(url);
      } else if (meetingType === 'online') {
        const url = `/family-member/online-healthcare-appointment/${elderId}/${providerId}`;
        navigate(url);
      }
    }
  };

  const handleViewProviderProfile = (providerId) => {
    if (meetingType === 'healthcare') {
      // Navigate to healthcare professional profile page (to be created)
      navigate(`/family-member/healthcare-professional/${providerId}`);
    } else {
      // Navigate to doctor profile page
      navigate(`/family-member/doctor/${providerId}`);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
        <p>Checking authentication...</p>
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
    <div>
      <Navbar />
      <FamilyMemberLayout>
        <div className={styles.elderDoctorsContainer}>
          {/* Show provider type selection (Step 1) */}
          {showMeetingSelection && !providerType && (
            <div className={styles.meetingSelectionContainer}>
              <div className={styles.selectionHeader}>
                <h1 className={styles.pageTitle}>
                  Choose Provider Type
                </h1>
                <p className={styles.selectionSubtitle}>
                  First, select the type of healthcare provider you want to consult
                </p>
              </div>

              <div className={styles.meetingOptionsGrid}>
                <div 
                  className={styles.meetingOption}
                  onClick={() => handleProviderTypeSelection('doctor')}
                >
                  <div className={styles.optionIcon}>👨‍⚕️</div>
                  <h3 className={styles.optionTitle}>Medical Doctor</h3>
                  <p className={styles.optionDescription}>
                    Consult with qualified medical doctors for diagnosis, treatment, 
                    and medical care of physical health conditions.
                  </p>
                  <div className={styles.optionFeatures}>
                    <span className={styles.feature}>✓ Medical diagnosis</span>
                    <span className={styles.feature}>✓ Prescription medication</span>
                    <span className={styles.feature}>✓ Physical examination</span>
                    <span className={styles.feature}>✓ Treatment plans</span>
                  </div>
                  <button className={styles.selectButton}>
                    Select Medical Doctor
                  </button>
                </div>

                <div 
                  className={styles.meetingOption}
                  onClick={() => handleProviderTypeSelection('healthcare')}
                >
                  <div className={styles.optionIcon}>🧠</div>
                  <h3 className={styles.optionTitle}>Healthcare Professional</h3>
                  <p className={styles.optionDescription}>
                    Consult with healthcare professionals like counselors, therapists, 
                    and mental health specialists for emotional and psychological support.
                  </p>
                  <div className={styles.optionFeatures}>
                    <span className={styles.feature}>✓ Mental health support</span>
                    <span className={styles.feature}>✓ Counseling services</span>
                    <span className={styles.feature}>✓ Therapy sessions</span>
                    <span className={styles.feature}>✓ Emotional guidance</span>
                  </div>
                  <button className={styles.selectButton}>
                    Select Healthcare Professional
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

          {/* Show meeting type selection (Step 2) */}
          {showMeetingSelection && providerType && (
            <div className={styles.meetingSelectionContainer}>
              <div className={styles.selectionHeader}>
                <button 
                  className={styles.backToProviderButton}
                  onClick={handleBackToProviderSelection}
                >
                  ← Back to Provider Type
                </button>
                
                <h1 className={styles.pageTitle}>
                  Choose Meeting Type
                  {providerType === 'doctor' ? ' with Doctor' : ' with Healthcare Professional'}
                </h1>
                <p className={styles.selectionSubtitle}>
                  Select how you want to meet with your chosen {providerType === 'doctor' ? 'doctor' : 'healthcare professional'}
                </p>
              </div>

              <div className={styles.meetingOptionsGrid}>
                <div 
                  className={styles.meetingOption}
                  onClick={() => handleMeetingTypeSelection('physical')}
                >
                  <div className={styles.optionIcon}>🏥</div>
                  <h3 className={styles.optionTitle}>Physical Meeting</h3>
                  <p className={styles.optionDescription}>
                    {providerType === 'doctor' 
                      ? 'Meet the doctor in person at their clinic or hospital. Shows doctors in your district only.'
                      : 'Meet the healthcare professional in person at their clinic or office. Shows professionals in your district only.'
                    }
                  </p>
                  <div className={styles.optionFeatures}>
                    <span className={styles.feature}>✓ In-person consultation</span>
                    <span className={styles.feature}>✓ {providerType === 'doctor' ? 'Physical examination' : 'Face-to-face therapy'}</span>
                    <span className={styles.feature}>✓ Local {providerType === 'doctor' ? 'doctors' : 'professionals'} only</span>
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
                    {providerType === 'doctor'
                      ? 'Video consultation with doctors from anywhere. Access to all available doctors.'
                      : 'Video consultation with healthcare professionals from anywhere. Access to all available professionals.'
                    }
                  </p>
                  <div className={styles.optionFeatures}>
                    <span className={styles.feature}>✓ Video consultation</span>
                    <span className={styles.feature}>✓ All {providerType === 'doctor' ? 'doctors' : 'professionals'} available</span>
                    <span className={styles.feature}>✓ Convenient from home</span>
                    <span className={styles.feature}>✓ 1 hour duration</span>
                  </div>
                  <button className={styles.selectButton}>
                    Select Online Meeting
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show providers list after selection */}
          {!showMeetingSelection && (
            <div className={styles.providersListContainer}>
              <div className={styles.providersHeader}>
                <button 
                  className={styles.backToSelectionButton}
                  onClick={handleBackToSelection}
                >
                  ← Back to Selection
                </button>
                
                <h1 className={styles.pageTitle}>
                  {providerType === 'doctor'
                    ? (meetingType === 'physical' ? 'Physical Meeting Doctors' : 'Online Meeting Doctors')
                    : (meetingType === 'physical' ? 'Physical Meeting Healthcare Professionals' : 'Online Meeting Healthcare Professionals')
                  }
                </h1>
                
                {elderInfo && (
                  <div className={styles.elderInfo}>
                    <h2 className={styles.elderName}>For: {elderInfo.name}</h2>
                    <p className={styles.elderDistrict}>📍 {elderInfo.district}</p>
                  </div>
                )}
              </div>

              {/* Search Bar */}
              <div className={styles.searchSection}>
                <input
                  type="text"
                  placeholder={`Search ${providerType === 'healthcare' ? 'healthcare professionals' : 'doctors'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Loading State */}
              {dataLoading && (
                <div className={styles.loadingSection}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading {providerType === 'healthcare' ? 'healthcare professionals' : 'doctors'}...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className={styles.errorSection}>
                  <div className={styles.errorIcon}>⚠️</div>
                  <h2>Error Loading Data</h2>
                  <p>{error}</p>
                  <button 
                    className={styles.retryButton}
                    onClick={() => fetchProviders(meetingType)}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Providers Grid */}
              {!dataLoading && !error && (
                filteredDoctors.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      {meetingType === 'healthcare' ? '🧠' : '👨‍⚕️'}
                    </div>
                    <h2>No {meetingType === 'healthcare' ? 'Healthcare Professionals' : 'Doctors'} Available</h2>
                    <p>
                      {meetingType === 'physical' && elderInfo 
                        ? `No approved doctors found in ${elderInfo.district} district.`
                        : meetingType === 'healthcare'
                        ? 'No healthcare professionals available at the moment.'
                        : 'No doctors available at the moment.'
                      }
                    </p>
                    <p>Please try again later or contact support.</p>
                  </div>
                ) : (
                  <div className={styles.doctorsGrid}>
                    {filteredDoctors.map((provider) => {
                      // Determine provider type and extract relevant data
                      const isHealthcareProfessional = providerType === 'healthcare';
                      const providerId = isHealthcareProfessional ? provider.counselor_id : provider.doctor_id;
                      const providerName = isHealthcareProfessional ? provider.counselor_name : `Dr. ${provider.doctor_name}`;
                      const providerSpecialty = isHealthcareProfessional ? provider.specialty : provider.specialization;
                      const providerInstitution = isHealthcareProfessional 
                        ? (meetingType === 'physical' ? 'In-Person Consultation' : 'Online Consultation')
                        : provider.current_institution;
                      const providerDistrict = provider.district;
                      const providerExperience = provider.years_experience;
                      
                      return (
                        <div key={providerId} className={styles.doctorCard}>
                          {/* Meeting Type Badge */}
                          <div className={styles.meetingTypeBadge}>
                            {meetingType === 'physical' 
                              ? (providerType === 'healthcare' ? '🏥 Physical Healthcare' : '🏥 Physical Doctor')
                              : (providerType === 'healthcare' ? '💻 Online Healthcare' : '💻 Online Doctor')
                            }
                          </div>

                          {/* Provider Header */}
                          <div className={styles.doctorHeader}>
                            <div className={styles.doctorAvatar}>
                              <div className={styles.doctorInitial}>
                                {providerName?.charAt(0).toUpperCase() || (isHealthcareProfessional ? 'H' : 'D')}
                              </div>
                            </div>
                            <div className={styles.doctorBasicInfo}>
                              <h3 className={styles.doctorName}>{providerName}</h3>
                              <p className={styles.doctorSpecialization}>{providerSpecialty}</p>
                            </div>
                          </div>

                          {/* Provider Details */}
                          <div className={styles.doctorDetails}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailIcon}>
                                {isHealthcareProfessional ? '💻' : '🏥'}
                              </span>
                              <div className={styles.detailContent}>
                                <span className={styles.detailLabel}>
                                  {isHealthcareProfessional ? 'Service Type' : 'Institution'}
                                </span>
                                <span className={styles.detailValue}>{providerInstitution}</span>
                              </div>
                            </div>
                            
                            <div className={styles.detailRow}>
                              <span className={styles.detailIcon}>📍</span>
                              <div className={styles.detailContent}>
                                <span className={styles.detailLabel}>District</span>
                                <span className={styles.detailValue}>{providerDistrict}</span>
                              </div>
                            </div>
                            
                            <div className={styles.detailRow}>
                              <span className={styles.detailIcon}>🎓</span>
                              <div className={styles.detailContent}>
                                <span className={styles.detailLabel}>Experience</span>
                                <span className={styles.detailValue}>
                                  {providerExperience} years
                                </span>
                              </div>
                            </div>

                            {!isHealthcareProfessional && provider.doctor_phone && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailIcon}>📞</span>
                                <div className={styles.detailContent}>
                                  <span className={styles.detailLabel}>Phone</span>
                                  <span className={styles.detailValue}>{provider.doctor_phone}</span>
                                </div>
                              </div>
                            )}

                            {!isHealthcareProfessional && provider.alternative_number && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailIcon}>📱</span>
                                <div className={styles.detailContent}>
                                  <span className={styles.detailLabel}>Alternative</span>
                                  <span className={styles.detailValue}>{provider.alternative_number}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Show email for healthcare professionals, doctors have doctor_email */}
                            {(isHealthcareProfessional ? provider.email : provider.doctor_email) && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailIcon}>📧</span>
                                <div className={styles.detailContent}>
                                  <span className={styles.detailLabel}>Email</span>
                                  <span className={styles.detailValue}>
                                    {isHealthcareProfessional ? provider.email : provider.doctor_email}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Show license only for doctors */}
                            {!isHealthcareProfessional && provider.license_number && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailIcon}>🆔</span>
                                <div className={styles.detailContent}>
                                  <span className={styles.detailLabel}>License</span>
                                  <span className={styles.detailValue}>{provider.license_number}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Provider Actions */}
                          <div className={styles.doctorActions}>
                            <button 
                              className={styles.primaryButton}
                              onClick={() => handleBookAppointment(providerId)}
                            >
                              <span className={styles.buttonIcon}>📅</span>
                              Book {meetingType === 'physical' ? 'Physical' : 
                                    meetingType === 'online' ? 'Online' : 
                                    'Healthcare'} {isHealthcareProfessional ? 'Session' : 'Appointment'}
                            </button>
                            <button 
                              className={styles.secondaryButton}
                              onClick={() => handleViewProviderProfile(providerId)}
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
                      );
                    })}
                  </div>
                )
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
            </div>
          )}
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default ElderDoctors;