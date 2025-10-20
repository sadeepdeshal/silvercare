import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/familymember/care-report-new.module.css';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';

const TodaysCareReport = () => {
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

  // Fetch elders data
  useEffect(() => {
    const fetchElders = async () => {
      if (!currentUser?.user_id) {
        console.log('No user_id found in currentUser:', currentUser);
        return;
      }
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching elders for family member ID:', currentUser.user_id);
        
        const response = await elderApi.getEldersByFamilyMember(currentUser.user_id);
        
        console.log('Elders API response:', response);
        
        if (response.success) {
          setElders(response.elders);
        } else {
          setError('Failed to load elders data');
        }
        
      } catch (err) {
        console.error('Error fetching elders:', err);
        setError('Failed to load elders data');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchElders();
    }
  }, [currentUser]);

  // Filter elders based on search term
  const filteredElders = elders.filter(elder =>
    elder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    elder.contact.includes(searchTerm) ||
    (elder.email && elder.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Function to get the correct image URL (same as elder-caregivers page)
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

  // Get current date
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
          <h1 className={styles.title}>Care Report</h1>
          <p className={styles.subtitle}>Select an elder to view their detailed care report</p>
        </div>

        {/* Search Section */}
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search elders by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <div className={styles.searchIcon}>🔍</div>
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
            <p>Loading elders...</p>
          </div>
        ) : filteredElders.length === 0 ? (
          <div className={styles.emptyState}>
            {searchTerm ? (
              <>
                <div className={styles.emptyIcon}>🔍</div>
                <h2>No elders found</h2>
                <p>No elders match your search criteria "{searchTerm}"</p>
                <button 
                  className={styles.clearSearchButton}
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <div className={styles.emptyIcon}>📋</div>
                <h2>No Elders Registered</h2>
                <p>You haven't registered any elders yet. Register elders to view their care reports.</p>
                <button 
                  className={styles.registerButton}
                  onClick={() => navigate('/family-member/elder-signup')}
                >
                  Register Your First Elder
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={styles.eldersGrid}>
            {filteredElders.map((elder) => {
              const imageUrl = getElderImageUrl(elder.profile_photo);
              
              return (
                <div 
                  key={elder.elder_id} 
                  className={styles.elderCard}
                  onClick={() => navigate(`/family-member/elder/${elder.elder_id}/care-schedule`)}
                >
                  <div className={styles.elderImageContainer}>
                    {elder.profile_photo ? (
                      <>
                        <img 
                          src={imageUrl}
                          alt={elder.name}
                          className={styles.elderImage}
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
                  
                  <div className={styles.elderInfo}>
                    <h3 className={styles.elderName}>{elder.name}</h3>
                    
                    <div className={styles.elderDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Age:</span>
                        <span className={styles.detailValue}>
                          {new Date().getFullYear() - new Date(elder.dob).getFullYear()} years
                        </span>
                      </div>
                      
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Gender:</span>
                        <span className={styles.detailValue}>{elder.gender}</span>
                      </div>
                      
                      <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>District:</span>
                      <span className={styles.detailValue}>{elder.district || 'Not specified'}</span>
                    </div>
                    
                    {elder.medical_conditions && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Medical Conditions:</span>
                        <span className={styles.detailValue}>{elder.medical_conditions}</span>
                      </div>
                    )}
                  </div>
                  
                  <button className={styles.viewReportButton}>
                    View Care Report
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default TodaysCareReport;