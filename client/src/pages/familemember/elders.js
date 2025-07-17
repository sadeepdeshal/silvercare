import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/familymember/elders.module.css';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';

const FamilyMemberElders = () => {
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
      // Use user_id instead of id for the new User table structure
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

  const handleAddElder = () => {
    navigate('/family-member/elder-signup');
  };

  const handleViewElder = (elderId) => {
    navigate(`/family-member/elder/${elderId}`);
  };

  // FIXED: Updated handleBookAppointment function to redirect to doctors page
  const handleBookAppointment = (elderId) => {
    // Check if elder has district information
    const elder = elders.find(e => e.elder_id === elderId);
    
    if (!elder) {
      alert('Elder information not found');
      return;
    }

    if (!elder.district) {
      alert('Elder district information is required to find doctors. Please update the elder profile with district information.');
      return;
    }

    // Navigate to doctors page with elder ID
    console.log('Navigating to doctors page for elder:', elderId);
    navigate(`/family-member/elder/${elderId}/doctors`);
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
            <h1 className={styles.title}>My Registered Elders</h1>
            <p className={styles.subtitle}>
              Manage and monitor your registered elderly persons
            </p>
          </div>
          <button 
            className={styles.addButton}
            onClick={handleAddElder}
          >
            <span className={styles.addIcon}>+</span>
            Register New Elder
          </button>
        </div>

        {/* Search and Filter Section */}
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
          <div className={styles.elderCount}>
            {dataLoading ? 'Loading...' : `${filteredElders.length} elder${filteredElders.length !== 1 ? 's' : ''} found`}
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
            <p>Loading your registered elders...</p>
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
                <div className={styles.emptyIcon}>👥</div>
                <h2>No Elders Registered</h2>
                <p>You haven't registered any elders yet. Start by adding your first elder to the care network.</p>
                <button 
                  className={styles.registerButton}
                  onClick={handleAddElder}
                >
                  Register Your First Elder
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={styles.eldersGrid}>
            {filteredElders.map((elder) => (
              <div key={elder.elder_id} className={styles.elderCard}>
                {/* Elder Header */}
                <div className={styles.elderHeader}>
                  <div className={styles.elderAvatar}>
                    {elder.profile_photo ? (
                      <img 
                        src={`http://localhost:5000/${elder.profile_photo}`} 
                        alt={elder.name}
                        className={styles.elderPhoto}
                      />
                    ) : (
                      <div className={styles.elderInitial}>
                        {elder.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.elderBasicInfo}>
                    <h3 className={styles.elderName}>{elder.name}</h3>
                    <p className={styles.elderAge}>
                      {elder.gender} • {new Date().getFullYear() - new Date(elder.dob).getFullYear()} years old
                    </p>
                  </div>
                </div>

                {/* Elder Details */}
                <div className={styles.elderDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailIcon}>📞</span>
                    <div className={styles.detailContent}>
                      <span className={styles.detailLabel}>Contact</span>
                      <span className={styles.detailValue}>{elder.contact}</span>
                    </div>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <span className={styles.detailIcon}>🆔</span>
                    <div className={styles.detailContent}>
                      <span className={styles.detailLabel}>NIC/Passport</span>
                      <span className={styles.detailValue}>{elder.nic}</span>
                    </div>
                  </div>
                  
                  {/* District Information */}
                  <div className={styles.detailRow}>
                    <span className={styles.detailIcon}>🏘️</span>
                    <div className={styles.detailContent}>
                      <span className={styles.detailLabel}>District</span>
                      <span className={styles.detailValue}>
                        {elder.district || 'Not specified'}
                      </span>
                    </div>
                  </div>
                  
                  {elder.medical_conditions && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>🏥</span>
                      <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Medical Conditions</span>
                        <span className={styles.detailValue}>
                          {elder.medical_conditions.length > 50 
                            ? `${elder.medical_conditions.substring(0, 50)}...` 
                            : elder.medical_conditions
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className={styles.detailRow}>
                    <span className={styles.detailIcon}>📍</span>
                    <div className={styles.detailContent}>
                      <span className={styles.detailLabel}>Address</span>
                      <span className={styles.detailValue}>
                        {elder.address && elder.address.length > 40 
                          ? `${elder.address.substring(0, 40)}...` 
                          : elder.address || 'Not provided'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <span className={styles.detailIcon}>📅</span>
                    <div className={styles.detailContent}>
                      <span className={styles.detailLabel}>Date of Birth</span>
                      <span className={styles.detailValue}>
                        {new Date(elder.dob).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Elder Actions */}
                <div className={styles.elderActions}>
                  <button 
                    className={styles.primaryButton}
                    onClick={() => handleViewElder(elder.elder_id)}
                  >
                    <span className={styles.buttonIcon}>👁️</span>
                    View Profile
                  </button>
                  <button 
                    className={styles.secondaryButton}
                    onClick={() => handleBookAppointment(elder.elder_id)}
                    disabled={!elder.district}
                    title={!elder.district ? 'District information required' : 'Book appointment with doctors in the same district'}
                  >
                    <span className={styles.buttonIcon}>📅</span>
                    Book Appointment
                  </button>
                </div>

                {/* Status Indicator */}
                <div className={styles.statusIndicator}>
                  <div className={styles.statusDot}></div>
                  <span className={styles.statusText}>Active</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className={styles.backSection}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/family-member/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default FamilyMemberElders;
