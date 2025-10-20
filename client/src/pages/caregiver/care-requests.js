import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import CaregiverLayout from '../../components/CaregiverLayout';
import caregiverApi from '../../services/caregiverApi2';
import { useAuth } from '../../context/AuthContext';
import styles from "../../components/css/caregiver/care-requests.module.css";
import RequestCountdownTimer from '../../components/RequestCountdownTimer.jsx';

const CareRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [careRequests, setCareRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const isFirstLoad = useRef(true);


// Debounce searchTerm -> debouncedSearchTerm
useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 500);
  return () => clearTimeout(handler);
}, [searchTerm]);

// Fetch care requests when user or debouncedSearchTerm changes
useEffect(() => {
  if (!user || !user.caregiver_id) return;
  fetchCareRequests();
}, [user, debouncedSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-update status from 'confirmed' to 'completed' if end_date has passed
  useEffect(() => {
    if (!careRequests || careRequests.length === 0) return;
    const today = new Date();
    today.setHours(0,0,0,0);
    careRequests.forEach(async (request) => {
      if (request.status === 'confirmed' || request.status === 'approved') {
        const endDate = new Date(request.end_date);
        endDate.setHours(0,0,0,0);
        if (endDate.getTime() < today.getTime()) {
          // Update status in backend
          try {
            await caregiverApi.updateCareRequestStatus(request.request_id, 'completed');
            // Refresh the data to show updated status
            fetchCareRequests();
          } catch (err) {
            console.error('Error updating status to completed:', err);
          }
        }
      }
    });
  }, [careRequests]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCareRequests = async () => {
    try {
      // Only show loading spinner on first load or manual refresh, not while typing
      if (isFirstLoad.current) {
        setLoading(true);
      }
      setError(null);
      const response = await caregiverApi.fetchCareRequests(user.caregiver_id, debouncedSearchTerm);
      setCareRequests(response || []);
    } catch (error) {
      console.error('Error fetching care requests:', error);
      setError('Failed to fetch care requests');
      setCareRequests([]);
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
  };

  const filterRequestsByStatus = (status) => {
    if (status === 'all') return careRequests;
    // Show completed if status was approved and end_date has passed
    return careRequests.map(request => {
      if (request.status === 'confirmed' || request.status === 'approved') {
        const endDate = new Date(request.end_date);
        const today = new Date();
        // Remove time part for date-only comparison
        endDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        if (endDate.getTime() < today.getTime()) {
          return { ...request, status: 'completed' };
        } else if (endDate.getTime() === today.getTime()) {
          return { ...request, status: 'confirmed' };
        }
      }
      return request;
    }).filter(request => {
      if (status === 'confirmed') {
        return request.status === 'confirmed' || request.status === 'approved';
      }
      return request.status === status;
    });
  };

  const getTabCount = (status) => {
    return filterRequestsByStatus(status).length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time left until start date
  const getTimeLeft = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffMs = start - now;
    
    // Get today's date without time for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateOnly = new Date(start);
    startDateOnly.setHours(0, 0, 0, 0);
    
    // If start date equals today, show "Started"
    if (startDateOnly.getTime() === today.getTime()) {
      return 'Started';
    }
    
    // If start date is before today (overdue), show hours/minutes overdue
    if (startDateOnly < today) {
      const overdueDiffMs = Math.abs(diffMs);
      const overdueHours = Math.floor(overdueDiffMs / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((overdueDiffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let overdueResult = '';
      if (overdueHours > 0) overdueResult += `${overdueHours} hour${overdueHours !== 1 ? 's' : ''} `;
      if (overdueMinutes > 0) overdueResult += `${overdueMinutes} min${overdueMinutes !== 1 ? 's' : ''}`;
      
      return `${overdueResult.trim()}`;
    }
    
    // Future date - show normal countdown
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = '';
    
    // Always show days (even if 0) when there are hours remaining
    if (diffDays > 0 || diffHours > 0) {
      result += `${diffDays} day${diffDays !== 1 ? 's' : ''} `;
    }
    
    // Show hours if there are any, or if days is 0 and we have time left
    if (diffHours > 0 || (diffDays === 0 && diffMs > 0)) {
      result += `${diffHours} hour${diffHours !== 1 ? 's' : ''} `;
    }
    
    // Only show minutes if less than 1 day and no hours
    if (diffDays === 0 && diffHours === 0 && diffMinutes > 0) {
      result += `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}`;
    }
    
    return result.trim() || '0 mins';
  };

  const handleViewDetails = (requestId) => {
    navigate(`/caregiver/care-request/${requestId}`);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    // Do not set debouncedSearchTerm or loading here; let debounce effect handle API call after 500ms
  };

  const handleBack = () => {
    navigate('/caregiver/dashboard');
  };

  const tabs = [
    { key: 'all', label: 'All Requests', count: getTabCount('all') },
    { key: 'pending', label: 'Pending', count: getTabCount('pending') },
    { key: 'confirmed', label: 'Confirmed', count: getTabCount('confirmed') },
    { key: 'cancelled', label: 'Cancelled', count: getTabCount('cancelled') },
    { key: 'completed', label: 'Completed', count: getTabCount('completed') }
  ];

  const currentRequests = filterRequestsByStatus(activeTab);

  if (loading) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading care requests...</p>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.error}>
            <p>{error}</p>
            <button className={styles.backButton} onClick={handleBack}>
              ← Back to Dashboard
            </button>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CaregiverLayout>
        <div className={styles.container}>
          <button className={styles.backButton} onClick={handleBack}>
              ← Back to Dashboard
            </button>
          <div className={styles.header}>
            
            <h1>Care Requests</h1>
            <p>Manage and view all your care requests</p>
          </div>

          {/* Search Section */}
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Search by elder name, age, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={handleClearSearch} className={styles.clearSearchButton}>
                Clear Search
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className={styles.tabContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className={styles.tabLabel}>{tab.label}</span>
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className={styles.content}>
            {error && (
              <div className={styles.error}>
                <p>{error}</p>
                <button onClick={fetchCareRequests} className={styles.retryButton}>
                  Try Again
                </button>
              </div>
            )}

            {!error && currentRequests.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <h3>No {activeTab === 'all' ? '' : activeTab} requests found</h3>
                <p>
                  {activeTab === 'all' 
                    ? 'You have no care requests yet.' 
                    : `You have no ${activeTab} care requests.`}
                </p>
              </div>
            ) : (
              <div className={styles.requestsList}>
                {currentRequests.map((request, index) => {
                  // For confirmed status, if start date < today, add green border/background
                  let confirmedPast = false;
                  if (request.status === 'confirmed' || request.status === 'approved') {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const start = new Date(request.start_date);
                    start.setHours(0,0,0,0);
                    if (start < today) confirmedPast = true;
                  }
                  return (
                    <div
                      key={request.request_id || index}
                      className={styles.requestCard}
                      style={confirmedPast ? { border: '2px solid #10b981', background: '#d1fae5' } : {}}
                    >
                      <div className={styles.requestHeader}>
                        <div className={styles.requestInfo}>
                          <h3 className={styles.elderName}>{request.elder_name}</h3>
                        </div>
                        <div className={`${styles.statusBadge} ${styles[request.status === 'approved' ? 'confirmed' : request.status]}`}>
                          {request.status === 'approved' ? 'confirmed' : request.status}
                        </div>
                      </div>

                    <div className={styles.requestDetails}>
                      <div className={styles.detailRow}>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>Elder Age:</span>
                          <span className={styles.value}>{request.elder_age} years</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>Duration:</span>
                          <span className={styles.value}>{request.duration} days</span>
                        </div>
                      </div>
                      
                      <div className={styles.detailRow}>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>Start Date:</span>
                          <span className={styles.value}>{formatDate(request.start_date)}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>End Date:</span>
                          <span className={styles.value}>{formatDate(request.end_date)}</span>
                        </div>
                      </div>

                      <div className={styles.detailRow}>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>Location:</span>
                          <span className={styles.value}>{request.elder_address}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>District:</span>
                          <span className={styles.value}>{request.elder_district}</span>
                        </div>
                      </div>

                      <div className={styles.detailRow}>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>Family Contact:</span>
                          <span className={styles.value}>{request.family_member_name}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>Request Date:</span>
                          <span className={styles.value}>{formatDateTime(request.request_date)}</span>
                        </div>
                      </div>

                      <div className={styles.detailRow}>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>Phone:</span>
                          <span className={styles.value}>{request.family_member_phone}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>Email:</span>
                          <span className={styles.value}>{request.family_member_email}</span>
                        </div>
                      </div>
                    </div>
                      {/* Show countdown timer for pending requests */}
                      {request?.status === 'pending' && (
                        <div className={styles.timeLeftRow}>
                          <span className={styles.label}>Time Left to Accept:</span>
                          <RequestCountdownTimer 
                            requestDate={request.request_date}
                            status={request.status}
                          />
                        </div>
                      )}
                    <div className={styles.requestActions}>
                      
                      <button 
                        className={styles.viewButton}
                        onClick={() => handleViewDetails(request.request_id)}
                      >
                        View Details
                      </button>
                      
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CaregiverLayout>
    </>
  );
}
export default CareRequests;
