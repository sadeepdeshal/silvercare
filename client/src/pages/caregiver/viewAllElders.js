import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import caregiverApi from '../../services/caregiverApi2';
import Navbar from '../../components/navbar';
import styles from "../../components/css/caregiver/viewAllElders.module.css";
import CaregiverLayout from '../../components/CaregiverLayout';

const ViewAllElders = () => {
  const { currentUser } = useAuth();
  const [elders, setElders] = useState([]);
  const [filteredElders, setFilteredElders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchElders = async () => {
      try {
        setLoading(true);
        setError(null);
        const caregiverId = currentUser?.caregiver_id || currentUser?.id || currentUser?.user_id;
        if (!caregiverId) {
          setError('Caregiver ID not found.');
          setLoading(false);
          return;
        }
        
        console.log('🔑 Fetching data for caregiver_id:', caregiverId);
        console.log('👤 Current user object:', currentUser);
        
        const data = await caregiverApi.fetchAssignedElders(caregiverId);
        
        console.log('📥 Raw API Data:', data.length, 'elders');
        console.log('📅 Current Date:', new Date().toISOString().split('T')[0]);
        console.log('📋 All raw data:', JSON.stringify(data.map(e => ({
          elder_id: e.elder_id,
          name: e.name,
          status: e.status,
          end_date: e.end_date
        })), null, 2));
        
        // Only show confirmed elders (we'll determine confirmed vs completed by date)
        const filteredData = data.filter(elder => 
          elder.status && elder.status.toLowerCase() === 'confirmed'
        );
        
        console.log('✅ After status filter:', filteredData.length, 'confirmed elders');
        console.log('📋 Confirmed data:', JSON.stringify(filteredData.map(e => ({
          elder_id: e.elder_id,
          name: e.name,
          end_date: e.end_date
        })), null, 2));
        
        // Deduplicate elders by elder_id, keeping the one with the latest end_date
        const elderMap = new Map();
        filteredData.forEach(elder => {
          const existingElder = elderMap.get(elder.elder_id);
          if (!existingElder || new Date(elder.end_date) > new Date(existingElder.end_date)) {
            elderMap.set(elder.elder_id, elder);
          }
        });
        const uniqueElders = Array.from(elderMap.values());
        
        console.log('🎯 Unique elders after deduplication:', uniqueElders.length);
        const todayString = new Date().toISOString().split('T')[0];
        
        // Helper function to convert UTC date to Sri Lanka timezone date string
        const getLocalDateString = (utcDateString) => {
          if (!utcDateString) return null;
          const date = new Date(utcDateString);
          // Convert to Sri Lanka time (UTC+5:30)
          const localDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
          return localDate.toISOString().split('T')[0];
        };
        
        uniqueElders.forEach(elder => {
          // Convert to Sri Lanka timezone to get correct local date
          const endDateString = elder.end_date ? getLocalDateString(elder.end_date) : null;
          const status = endDateString < todayString ? 'completed' : 'confirmed';
          console.log(`  - ${elder.name}: end_date=${endDateString}, display_status=${status}`);
        });
        
        setElders(uniqueElders);
        setFilteredElders(uniqueElders);
      } catch (err) {
        setError('Failed to fetch elders.');
      } finally {
        setLoading(false);
      }
    };
    fetchElders();
  }, [currentUser]);

  // Filter elders based on search term and status
  useEffect(() => {
    let filtered = elders;

    // Filter by search term (name or age)
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(elder =>
        elder.name && elder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        elder.age && elder.age.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      const todayString = new Date().toISOString().split('T')[0];
      
      console.log('🔍 Filtering by status:', statusFilter);
      console.log('📅 Today:', todayString);
      console.log('📊 Elders before filter:', filtered.length);
      
      if (statusFilter === 'completed') {
        // Show completed: end_date < today (past assignments)
        filtered = filtered.filter(elder => {
          if (!elder.end_date) {
            console.log(`❌ ${elder.name}: No end_date`);
            return false;
          }
          // Extract date string directly without timezone conversion
          const endDateString = elder.end_date.split('T')[0];
          const isCompleted = endDateString < todayString;
          console.log(`${isCompleted ? '✅' : '❌'} ${elder.name}: end_date=${endDateString}, isCompleted=${isCompleted}`);
          return isCompleted;
        });
      } else if (statusFilter === 'confirmed') {
        // Show confirmed: end_date >= today (active/ongoing)
        filtered = filtered.filter(elder => {
          if (!elder.end_date) {
            console.log(`❌ ${elder.name}: No end_date`);
            return false;
          }
          // Extract date string directly without timezone conversion
          const endDateString = elder.end_date.split('T')[0];
          const isConfirmed = endDateString >= todayString;
          console.log(`${isConfirmed ? '✅' : '❌'} ${elder.name}: end_date=${endDateString}, isConfirmed=${isConfirmed}`);
          return isConfirmed;
        });
      }
      
      console.log('📊 Elders after filter:', filtered.length);
    }

    setFilteredElders(filtered);
  }, [searchTerm, statusFilter, elders]);

  const handleElderClick = (elder) => {
    navigate(`/caregiver/elder/${elder.elder_id}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const handleStatCardClick = (filterType) => {
    console.log('Stat card clicked:', filterType);
    setStatusFilter(filterType);
    // Clear search term when clicking stat cards for better user experience
    setSearchTerm('');
  };

  // Get the display status based on date logic
  const getDisplayStatus = (elder) => {
    if (!elder.end_date || elder.status.toLowerCase() !== 'confirmed') {
      return elder.status;
    }
    
    // Helper function to convert UTC date to Sri Lanka timezone date string
    const getLocalDateString = (utcDateString) => {
      if (!utcDateString) return null;
      const date = new Date(utcDateString);
      // Convert to Sri Lanka time (UTC+5:30)
      const localDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };
    
    const todayString = new Date().toISOString().split('T')[0];
    // Convert to Sri Lanka timezone to get correct local date
    const endDateString = getLocalDateString(elder.end_date);
    
    // If end_date < today, it's completed (past)
    // If end_date >= today, it's confirmed (active/ongoing)
    return endDateString < todayString ? 'completed' : 'confirmed';
  };

  const getStatusClass = (elder) => {
    const displayStatus = getDisplayStatus(elder);
    switch (displayStatus.toLowerCase()) {
      case 'confirmed':
        return styles.statusConfirmed; // Green
      case 'completed':
        return styles.statusCompleted; // Purple
      default:
        return styles.statusPending;
    }
  };

  const getUniqueStatuses = () => {
    const statuses = elders.map(elder => elder.status).filter(status => status); // Filter out null/undefined
    const uniqueStatuses = [...new Set(statuses)];
    // Only return confirmed status since that's what we filter for (completed is date-based)
    return uniqueStatuses.filter(status => 
      status && status.toLowerCase() === 'confirmed'
    );
  };

  const getStats = () => {
    // Get today's date string in YYYY-MM-DD format (no time component)
    const todayString = new Date().toISOString().split('T')[0];
    
    // Helper function to convert UTC date to Sri Lanka timezone date string
    const getLocalDateString = (utcDateString) => {
      if (!utcDateString) return null;
      const date = new Date(utcDateString);
      // Convert to Sri Lanka time (UTC+5:30)
      const localDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };
    
    console.log('📊 getStats() - Calculating stats');
    console.log('📅 Today:', todayString);
    console.log('📋 Total elders:', elders.length);
    
    // Completed = status is 'confirmed' AND end_date < today (past assignments)
    const completedElders = elders.filter(e => {
      if (!e.end_date) {
        console.log(`  ⚠️ ${e.name}: No end_date`);
        return false;
      }
      if (e.status.toLowerCase() !== 'confirmed') {
        console.log(`  ⚠️ ${e.name}: Status is ${e.status}, not confirmed`);
        return false;
      }
      // Convert to Sri Lanka timezone before comparison
      const endDateString = getLocalDateString(e.end_date);
      const isCompleted = endDateString < todayString;
      console.log(`  ${isCompleted ? '✅ COMPLETED' : '❌ NOT COMPLETED'}: ${e.name} - end_date=${endDateString}, isCompleted=${isCompleted}`);
      return isCompleted;
    });
    
    // Confirmed = status is 'confirmed' AND end_date >= today (active/ongoing)
    const confirmedElders = elders.filter(e => {
      if (!e.end_date || e.status.toLowerCase() !== 'confirmed') return false;
      // Convert to Sri Lanka timezone before comparison
      const endDateString = getLocalDateString(e.end_date);
      return endDateString >= todayString;
    });
    
    console.log('📈 STATS RESULT:', {
      total: elders.length,
      confirmed: confirmedElders.length,
      completed: completedElders.length
    });
    console.log('📝 Completed elders:', completedElders.map(e => e.name));
    console.log('📝 Confirmed elders:', confirmedElders.map(e => e.name));
    
    return {
      total: elders.length,
      confirmed: confirmedElders.length,
      completed: completedElders.length,
    };
  };

  const handleBack = () => {
    navigate('/caregiver/dashboard');
  };

  const stats = getStats();

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
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>
              
              {statusFilter === 'all' && ' Total Elders'}
              {statusFilter === 'confirmed' && ' Current Elders'}
              {statusFilter === 'completed' && ' Past Elders'}
            </h1>
          </div>

          {/* Filter Section */}
          <div className={styles.filterSection}>
            <input
              type="text"
              placeholder="Search by name or age..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            
            <button onClick={handleClearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>

          {/* Statistics Bar */}
          <div className={styles.statsBar}>
            <div 
              className={`${styles.statCard} ${statusFilter === 'all' ? styles.statCardActive : ''}`}
              onClick={() => handleStatCardClick('all')}
              style={{ cursor: 'pointer' }}
            >
              <p className={styles.statNumber}>{stats.total}</p>
              <p className={styles.statLabel}>Total Elders</p>
            </div>
            {/*confirmed - active/ongoing (today <= end_date)*/}
            <div 
              className={`${styles.statCard} ${statusFilter === 'confirmed' ? styles.statCardActive : ''}`}
              onClick={() => handleStatCardClick('confirmed')}
              style={{ cursor: 'pointer' }}
            >
              <p className={styles.statNumber}>{stats.confirmed}</p>
              <p className={styles.statLabel}>Confirmed</p>
            </div>
            {/*completed - past assignments (today > end_date)*/}
            <div 
              className={`${styles.statCard} ${statusFilter === 'completed' ? styles.statCardActive : ''}`}
              onClick={() => handleStatCardClick('completed')}
              style={{ cursor: 'pointer' }}
            >
              <p className={styles.statNumber}>{stats.completed}</p>
              <p className={styles.statLabel}>Completed</p>
            </div>
            
          </div>

          {/* Loading State */}
          {loading && (
            <div className={styles.loadingMessage}>
              <div className={styles.loadingSpinner}></div>
              Loading elders...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={styles.errorMessage}>
              ❌ {error}
            </div>
          )}

          {/* No Data State */}
          {!loading && !error && filteredElders.length === 0 && elders.length === 0 && (
            <div className={styles.noDataMessage}>
              📋 No Elders assigned yet.
            </div>
          )}

          {/* No Results State */}
          {!loading && !error && filteredElders.length === 0 && elders.length > 0 && (
            <div className={styles.noDataMessage}>
              📋 No Past elders.
            </div>
          )}

          {/* Elders Grid */}
          {!loading && !error && filteredElders.length > 0 && (
            <div className={styles.eldersGrid}>
              {filteredElders.map((elder) => {
                const displayStatus = getDisplayStatus(elder);
                return (
                  <div key={elder.elder_id} className={styles.elderCard}>
                    <div className={styles.elderHeader}>
                      <h3 className={styles.elderName}>{elder.name}</h3>
                      <span className={`${styles.statusBadge} ${getStatusClass(elder)}`}>
                        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                      </span>
                    </div>

                    <div className={styles.elderDetails}>
                      <div className={styles.elderDetail}>
                        <span className={styles.detailIcon}>👤</span>
                        <span>Age: {elder.age} years</span>
                      </div>
                      <div className={styles.elderDetail}>
                        <span className={styles.detailIcon}>⏱️</span>
                        <span>Duration: {elder.duration}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleElderClick(elder)}
                      className={styles.viewButton}
                    >
                      View Elder Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CaregiverLayout>
    </>
  );
};

export default ViewAllElders;
