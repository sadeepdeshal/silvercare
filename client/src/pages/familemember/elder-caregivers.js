import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/elder-caregivers.module.css';

const ElderCaregivers = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [elders, setElders] = useState([]);
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

  // Fetch elders
  useEffect(() => {
    const fetchElders = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching elders for family member:', currentUser.user_id);
        
        const response = await elderApi.getEldersByFamilyMember(currentUser.user_id);
        
        if (response.success) {
          console.log('Elders fetched:', response.elders);
          setElders(response.elders || []);
        } else {
          throw new Error(response.error || 'Failed to load elders');
        }
        
      } catch (err) {
        console.error('Error fetching elders:', err);
        setError(err.message || 'Failed to load elders data');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchElders();
    }
  }, [currentUser]);

  const handleBookCaregiver = (elderId) => {
    console.log('Booking caregiver for elder:', elderId);
    navigate(`/family-member/elder/${elderId}/caregivers-list`);
  };

  const handleBackToDashboard = () => {
    navigate('/family-member/dashboard');
  };

  // Filter elders based on search term
  const filteredElders = elders.filter(elder =>
    elder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    elder.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to get the correct image URL
  const getElderImageUrl = (profilePhoto) => {
    if (!profilePhoto) return null;
    
    if (profilePhoto.startsWith('http')) {
      return profilePhoto;
    }
    
    const normalizedPath = profilePhoto.replace(/\\/g, '/');
    
    if (normalizedPath.startsWith('uploads/')) {
      return `http://localhost:5000/${normalizedPath}`;
    }
    
    return `http://localhost:5000/uploads/profiles/${normalizedPath}`;
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
              <h1 className={styles.title}>Book Caregiver Service</h1>
              <p className={styles.subtitle}>
                Select an elder to book a caregiver service
              </p>
            </div>
            <button 
              className={styles.backButton}
              onClick={handleBackToDashboard}
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Search Section */}
          {elders.length > 0 && (
            <div className={styles.searchSection}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search by elder name or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <span className={styles.searchIcon}>🔍</span>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={styles.mainContent}>
            {dataLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <h2>Loading elders...</h2>
                <p>Please wait while we fetch your registered elders</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <div className={styles.errorIcon}>⚠️</div>
                <h2>Error Loading Elders</h2>
                <p>{error}</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : filteredElders.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <h2>
                  {searchTerm ? 'No Elders Found' : 'No Elders Registered'}
                </h2>
                <p>
                  {searchTerm 
                    ? 'No elders match your search criteria. Try a different search term.'
                    : 'You haven\'t registered any elders yet. Register an elder to book caregiver services.'
                  }
                </p>
                {!searchTerm && (
                  <button 
                    className={styles.registerButton}
                    onClick={() => navigate('/family-member/elder-signup')}
                  >
                    Register New Elder
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.eldersGrid}>
                {filteredElders.map((elder) => {
                  const imageUrl = getElderImageUrl(elder.profile_photo);
                  
                  return (
                    <div key={elder.elder_id} className={styles.elderCard}>
                      <div className={styles.elderCardHeader}>
                        <div className={styles.elderAvatar}>
                          {elder.profile_photo ? (
                            <>
                              <img 
                                src={imageUrl}
                                alt={elder.name}
                                className={styles.elderPhoto}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.parentNode.querySelector('.fallback-initial');
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                              <div 
                                className={`${styles.elderInitial} fallback-initial`}
                                style={{ display: 'none' }}
                              >
                                {elder.name.charAt(0).toUpperCase()}
                              </div>
                            </>
                          ) : (
                            <div className={styles.elderInitial}>
                              {elder.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className={styles.elderHeaderInfo}>
                          <h3 className={styles.elderName}>{elder.name}</h3>
                          <p className={styles.elderAge}>
                            {elder.age} years old • {elder.gender}
                          </p>
                        </div>
                      </div>

                      <div className={styles.elderCardBody}>
                        <div className={styles.elderInfo}>
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>📞 Contact:</span>
                            <span className={styles.infoValue}>{elder.contact}</span>
                          </div>
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>📍 District:</span>
                            <span className={styles.infoValue}>{elder.district}</span>
                          </div>
                          {elder.medical_conditions && (
                            <div className={styles.infoRow}>
                              <span className={styles.infoLabel}>🏥 Medical Conditions:</span>
                              <span className={styles.infoValue}>
                                {elder.medical_conditions.substring(0, 100)}
                                {elder.medical_conditions.length > 100 ? '...' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.elderCardFooter}>
                        <button
                          className={styles.bookButton}
                          onClick={() => handleBookCaregiver(elder.elder_id)}
                        >
                          Book Caregiver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Banner */}
          {filteredElders.length > 0 && (
            <div className={styles.infoBanner}>
              <div className={styles.bannerIcon}>ℹ️</div>
              <div className={styles.bannerContent}>
                <h4>About Caregiver Services</h4>
                <p>
                  Our caregivers provide professional home care services including daily care assistance, 
                  health monitoring, medication management, and companionship for your elderly loved ones.
                  Caregivers are matched by district to ensure local availability.
                </p>
              </div>
            </div>
          )}
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default ElderCaregivers;
