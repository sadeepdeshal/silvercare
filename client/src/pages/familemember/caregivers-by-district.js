import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import { caregiverApi } from '../../services/caregiverApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/caregivers-by-district.module.css';

const CaregiversByDistrict = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { elderId } = useParams();
  
  const [caregivers, setCaregivers] = useState([]);
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

  // Fetch caregivers by elder's district
  useEffect(() => {
    const fetchCaregiversByDistrict = async () => {
      if (!elderId) {
        setError('Elder ID is required');
        setDataLoading(false);
        return;
      }
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching caregivers for elder:', elderId);
        
        const response = await caregiverApi.getCaregiversByElderDistrict(elderId);
        
        console.log('Caregivers API response:', response);
        
        if (response && response.success) {
          setCaregivers(response.caregivers || []);
          setElderInfo(response.elderInfo);
          
          // Debug: Log rating data for first caregiver
          if (response.caregivers && response.caregivers.length > 0) {
            console.log('Sample caregiver rating data:', {
              name: response.caregivers[0].caregiver_name,
              average_rating: response.caregivers[0].average_rating,
              total_reviews: response.caregivers[0].total_reviews
            });
          }
        } else {
          setError(response?.error || 'Failed to load caregivers data');
        }
        
      } catch (err) {
        console.error('Error fetching caregivers:', err);
        setError(err.message || 'Failed to load caregivers data');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchCaregiversByDistrict();
    }
  }, [elderId, currentUser]);

  const handleBookCaregiver = (caregiverId) => {
    console.log('Booking caregiver:', caregiverId, 'for elder:', elderId);
    navigate(`/family-member/elder/${elderId}/caregiver-booking/${caregiverId}`);
  };

  const handleBackToElders = () => {
    navigate('/family-member/elder-caregivers');
  };

  // Filter caregivers based on search term
  const filteredCaregivers = caregivers.filter(caregiver =>
    caregiver.caregiver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caregiver.certifications?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className={styles.title}>Available Caregivers</h1>
              {elderInfo && (
                <div className={styles.elderInfoBanner}>
                  <div className={styles.elderInfoContent}>
                    <p className={styles.subtitle}>
                      Booking caregiver service for{' '}
                      <strong>{elderInfo.name}</strong>
                    </p>
                    <div className={styles.elderDetails}>
                      <span className={styles.elderDetail}>
                        📍 District: {elderInfo.district}
                      </span>
                      <span className={styles.elderDetail}>
                        🎂 Age: {elderInfo.age} years
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button 
              className={styles.backButton}
              onClick={handleBackToElders}
            >
              ← Back to Elders
            </button>
          </div>

          {/* Search Section */}
          {caregivers.length > 0 && (
            <div className={styles.searchSection}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search by caregiver name or certifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <span className={styles.searchIcon}>🔍</span>
              </div>
              <p className={styles.resultsCount}>
                {filteredCaregivers.length} caregiver{filteredCaregivers.length !== 1 ? 's' : ''} available 
                {elderInfo && ` in ${elderInfo.district}`}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className={styles.mainContent}>
            {dataLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <h2>Loading caregivers...</h2>
                <p>Please wait while we find available caregivers in your area</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <div className={styles.errorIcon}>⚠️</div>
                <h2>Error Loading Caregivers</h2>
                <p>{error}</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : filteredCaregivers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👨‍⚕️</div>
                <h2>
                  {searchTerm ? 'No Caregivers Found' : 'No Available Caregivers'}
                </h2>
                <p>
                  {searchTerm 
                    ? 'No caregivers match your search criteria. Try a different search term.'
                    : elderInfo 
                      ? `No caregivers are currently available in ${elderInfo.district}. Please try again later or contact support.`
                      : 'No caregivers are currently available. Please try again later.'
                  }
                </p>
              </div>
            ) : (
              <div className={styles.caregiversGrid}>
                {filteredCaregivers.map((caregiver) => (
                  <div key={caregiver.caregiver_id} className={styles.caregiverCard}>
                    <div className={styles.caregiverCardHeader}>
                      <div className={styles.caregiverAvatar}>
                        <div className={styles.caregiverInitial}>
                          {caregiver.caregiver_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className={styles.caregiverHeaderInfo}>
                        <h3 className={styles.caregiverName}>{caregiver.caregiver_name}</h3>
                        <div className={styles.ratingContainer}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                              key={star}
                              className={styles.star}
                              style={{ 
                                color: star <= Number(caregiver.average_rating || 0) ? '#FFD700' : '#ddd',
                                fontSize: '16px'
                              }}
                            >
                              ★
                            </span>
                          ))}
                          <span className={styles.ratingText}>
                            {Number(caregiver.total_reviews) > 0 
                              ? `${caregiver.average_rating}/5 (${caregiver.total_reviews} ${Number(caregiver.total_reviews) === 1 ? 'review' : 'reviews'})`
                              : 'No ratings yet'}
                          </span>
                        </div>
                        <p className={styles.caregiverDistrict}>
                          📍 {caregiver.district}
                        </p>
                      </div>
                      <div className={styles.availabilityBadge}>
                        <span className={styles.availabilityDot}></span>
                        {caregiver.availability || 'Available'}
                      </div>
                    </div>

                    <div className={styles.caregiverCardBody}>
                      <div className={styles.caregiverInfo}>
                        <div className={styles.infoSection}>
                          <h4 className={styles.infoSectionTitle}>Contact Information</h4>
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>📧 Email:</span>
                            <span className={styles.infoValue}>{caregiver.caregiver_email}</span>
                          </div>
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>📞 Phone:</span>
                            <span className={styles.infoValue}>{caregiver.caregiver_phone}</span>
                          </div>
                          {caregiver.fixed_line && (
                            <div className={styles.infoRow}>
                              <span className={styles.infoLabel}>☎️ Fixed Line:</span>
                              <span className={styles.infoValue}>{caregiver.fixed_line}</span>
                            </div>
                          )}
                        </div>

                        {caregiver.certifications && (
                          <div className={styles.infoSection}>
                            <h4 className={styles.infoSectionTitle}>Certifications</h4>
                            <p className={styles.certifications}>
                              {caregiver.certifications}
                            </p>
                          </div>
                        )}

                        <div className={styles.infoSection}>
                          <h4 className={styles.infoSectionTitle}>Service Details</h4>
                          <div className={styles.serviceFeatures}>
                            <div className={styles.serviceFeature}>
                              <span className={styles.featureIcon}>🏥</span>
                              <span>Daily Care Assistance</span>
                            </div>
                            <div className={styles.serviceFeature}>
                              <span className={styles.featureIcon}>❤️</span>
                              <span>Health Monitoring</span>
                            </div>
                          </div>
                          <div className={styles.dayRateSection}>
                            <span className={styles.dayRateLabel}>Daily Rate:</span>
                            <span className={styles.dayRateValue}>
                              Rs. {caregiver.day_rate ? caregiver.day_rate.toLocaleString() : '2,500'}/day
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.caregiverCardFooter}>
                      <button
                        className={styles.bookButton}
                        onClick={() => handleBookCaregiver(caregiver.caregiver_id)}
                      >
                        <span>Book This Caregiver</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Banner */}
          {filteredCaregivers.length > 0 && (
            <div className={styles.infoBanner}>
              <div className={styles.bannerIcon}>ℹ️</div>
              <div className={styles.bannerContent}>
                <h4>Important Information</h4>
                <ul>
                  <li>Caregiver services are provided at the elder's home location</li>
                  <li>You can select multiple dates for booking in the next step</li>
                  <li>Payment will be processed after confirming your booking details</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default CaregiversByDistrict;
