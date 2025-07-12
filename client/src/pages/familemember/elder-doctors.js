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
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fetch doctors data
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!elderId) {
        setError('Elder ID is required');
        setDataLoading(false);
        return;
      }
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching doctors for elder ID:', elderId);
        
        const response = await elderApi.getDoctorsByElderDistrict(elderId);
        
        console.log('Doctors API response:', response);
        
        if (response.success) {
          setDoctors(response.doctors || []);
          setElderInfo(response.elderInfo);
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

    if (currentUser && currentUser.role === 'family_member' && elderId) {
      fetchDoctors();
    }
  }, [currentUser, elderId]);

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor =>
    doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.current_institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBookAppointment = (doctorId) => {
    // Navigate to appointment booking page with doctor and elder IDs
    navigate(`/family-member/book-appointment/${elderId}/${doctorId}`);
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
          {/* Header Section */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Available Doctors</h1>
              {elderInfo && (
                <div className={styles.elderInfo}>
                  <p className={styles.subtitle}>
                    Doctors available for <strong>{elderInfo.name}</strong> in <strong>{elderInfo.district}</strong> district
                  </p>
                </div>
              )}
            </div>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/family-member/elders')}
            >
              ← Back to Elders
            </button>
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
                onClick={() => window.location.reload()}
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
                    {elderInfo 
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
                  </div>

                  {/* Doctor Actions */}
                  <div className={styles.doctorActions}>
                    <button 
                      className={styles.primaryButton}
                      onClick={() => handleBookAppointment(doctor.doctor_id)}
                    >
                      <span className={styles.buttonIcon}>📅</span>
                      Book Appointment
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
      </FamilyMemberLayout>
    </div>
  );
};

// Make sure this export is at the bottom of the file
export default ElderDoctors;
