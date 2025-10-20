import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caregiverApi } from '../../services/caregiverApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/caregiver-bookings.module.css';

const CaregiverBookings = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [bookingToRate, setBookingToRate] = useState(null);
  const [ratingData, setRatingData] = useState({ rating: 0, feedback: '' });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    search: ''
  });

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

  // Fetch caregiver bookings
  useEffect(() => {
    const fetchBookingsData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching caregiver bookings for family member:', currentUser.user_id);
        
        const response = await caregiverApi.getCaregiverBookingsByFamily(currentUser.user_id);
        
        if (response.success) {
          console.log('Caregiver bookings received:', response.bookings);
          // Sort by latest first (created_at/request_date descending)
          const sortedBookings = (response.bookings || []).sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
          setBookings(sortedBookings);
        } else {
          throw new Error(response.error || 'Failed to fetch caregiver bookings');
        }
        
      } catch (err) {
        console.error('Error fetching caregiver bookings:', err);
        setError('Failed to load caregiver bookings data');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchBookingsData();
    }
  }, [currentUser]);

  // Filter bookings by search term and type
  useEffect(() => {
    let filtered = bookings;

    // Filter by type
    if (filters.type !== 'all') {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      filtered = filtered.filter(booking => {
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (filters.type === 'pending') {
          return booking.status === 'pending';
        } else if (filters.type === 'upcoming') {
          return startDate > currentDate && booking.status === 'confirmed';
        } else if (filters.type === 'ongoing') {
          return startDate <= currentDate && endDate >= currentDate && booking.status === 'confirmed';
        } else if (filters.type === 'completed') {
          return endDate < currentDate && booking.status === 'confirmed';
        } else if (filters.type === 'cancelled') {
          return booking.status === 'cancelled';
        }
        return true;
      });
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.caregiver_name?.toLowerCase().includes(searchLower) ||
        booking.elder_name?.toLowerCase().includes(searchLower) ||
        booking.request_id?.toString().includes(searchLower)
      );
    }

    // Sort filtered results by latest booking date (created_at descending)
    filtered = filtered.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredBookings(filtered);
  }, [bookings, filters]);

  // Handle cancel booking with refund
  const handleCancelBooking = async (booking, event) => {
    event.stopPropagation();
    
    // Check if cancellation is allowed (within 2 hours of creation)
    const createdAt = new Date(booking.created_at);
    const currentDate = new Date();
    const hoursSinceCreated = (currentDate - createdAt) / (1000 * 60 * 60);
    
    if (hoursSinceCreated > 2) {
      alert('Cancellation not allowed. This booking can only be cancelled within 2 hours of booking.');
      return;
    }
    
    // Show cancel confirmation modal
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  // Confirm cancellation
  const confirmCancellation = async () => {
    if (!bookingToCancel) return;
    
    try {
      setCancellingId(bookingToCancel.request_id);
      setShowCancelModal(false);
      
      const response = await caregiverApi.cancelCaregiverBooking(bookingToCancel.request_id, 'Cancelled by family member');
      
      if (response.success) {
        // Update the booking status and payment status to refunded
        setBookings(prev => 
          prev.map(b => 
            b.request_id === bookingToCancel.request_id 
              ? { ...b, status: 'cancelled', payment_status: 'refunded' }
              : b
          )
        );
        
        // Simple success message
        alert('Booking cancelled successfully! Your refund will be processed within 5-10 business days.');
      }
    } catch (err) {
      console.error('Error cancelling caregiver booking:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
      setBookingToCancel(null);
    }
  };

  // Close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setBookingToCancel(null);
  };

  // Open rating modal
  const openRatingModal = (booking) => {
    setBookingToRate(booking);
    // If booking already has a rating, pre-fill the form
    if (booking.rating_id) {
      setRatingData({
        rating: booking.rating || 0,
        feedback: booking.feedback || ''
      });
    } else {
      setRatingData({ rating: 0, feedback: '' });
    }
    setShowRatingModal(true);
  };

  // Close rating modal
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setBookingToRate(null);
    setRatingData({ rating: 0, feedback: '' });
  };

  // Submit caregiver rating
  const handleSubmitRating = async () => {
    if (!bookingToRate) return;
    
    // Validate rating
    if (ratingData.rating < 1 || ratingData.rating > 5) {
      alert('Please select a rating between 1 and 5 stars');
      return;
    }

    // Check if booking has ended
    if (!hasBookingEnded(bookingToRate)) {
      alert('You can only rate a caregiver after the booking period has ended.');
      return;
    }

    try {
      setSubmittingRating(true);
      
      const response = await caregiverApi.submitCaregiverRating(
        bookingToRate.request_id,
        ratingData.rating,
        ratingData.feedback
      );
      
      if (response.success) {
        // Update the booking with rating info
        setBookings(prev =>
          prev.map(b =>
            b.request_id === bookingToRate.request_id
              ? {
                  ...b,
                  rating_id: response.ratingId,
                  rating: ratingData.rating,
                  feedback: ratingData.feedback,
                  rating_date: new Date().toISOString()
                }
              : b
          )
        );

        alert('Thank you for rating the caregiver!');
        closeRatingModal();
      } else {
        // Handle non-success response
        alert(response.error || 'Failed to submit rating. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      const errorMessage = err.message || 'Failed to submit rating. Please try again.';
      
      if (errorMessage.includes('already rated')) {
        alert('You have already rated this caregiver for this booking.');
      } else if (errorMessage.includes('booking period has ended')) {
        alert('You can only rate after the booking period has ended.');
      } else if (errorMessage.includes('cancelled')) {
        alert('Cannot rate cancelled bookings.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  // Handle star click
  const handleStarClick = (starValue) => {
    setRatingData(prev => ({ ...prev, rating: starValue }));
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return {
      start: start.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      end: end.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };
  };

  const canCancelBooking = (booking) => {
    // Allow cancellation for both 'pending' and 'confirmed' bookings
    if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;
    
    const createdAt = new Date(booking.created_at);
    const currentDate = new Date();
    const hoursSinceCreated = (currentDate - createdAt) / (1000 * 60 * 60);
    
    return hoursSinceCreated <= 2;
  };

  const getBookingStatus = (booking) => {
    if (booking.status === 'cancelled') return 'Cancelled';
    if (booking.status === 'pending') return 'Pending';
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate > currentDate) return 'Upcoming';
    if (startDate <= currentDate && endDate >= currentDate) return 'Ongoing';
    if (endDate < currentDate) return 'Completed';
    return booking.status;
  };

  // Check if booking has ended (can be rated)
  const hasBookingEnded = (booking) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(booking.end_date);
    endDate.setHours(0, 0, 0, 0);
    
    return endDate < currentDate;
  };

  const openDetailsModal = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  if (loading || dataLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading caregiver bookings...</h2>
            </div>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <FamilyMemberLayout>
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Caregiver Bookings</h1>
              <p className={styles.subtitle}>
                Manage your caregiver bookings and cancellations
              </p>
            </div>
            <button 
              className={styles.newBookingButton}
              onClick={() => navigate('/family-member/elder-caregivers')}
            >
              + New Booking
            </button>
          </div>

          {/* Filters */}
          <div className={styles.filtersSection}>
            <div className={styles.filterTabs}>
              <button 
                className={`${styles.filterTab} ${filters.type === 'all' ? styles.active : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
              >
                All Bookings
              </button>
              <button 
                className={`${styles.filterTab} ${filters.type === 'pending' ? styles.active : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, type: 'pending' }))}
              >
                ⏳ Pending
              </button>
              <button 
                className={`${styles.filterTab} ${filters.type === 'upcoming' ? styles.active : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, type: 'upcoming' }))}
              >
                ⏰ Upcoming
              </button>
              <button 
                className={`${styles.filterTab} ${filters.type === 'ongoing' ? styles.active : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, type: 'ongoing' }))}
              >
                ▶️ Ongoing
              </button>
              <button 
                className={`${styles.filterTab} ${filters.type === 'completed' ? styles.active : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, type: 'completed' }))}
              >
                ✅ Completed
              </button>
              <button 
                className={`${styles.filterTab} ${filters.type === 'cancelled' ? styles.active : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, type: 'cancelled' }))}
              >
                ❌ Cancelled
              </button>
            </div>

            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="🔍 Search by caregiver, elder, or booking ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          {/* Info Message */}
          <div className={styles.infoMessage}>
            <span className={styles.infoIcon}>ℹ️</span>
            <span>
              Caregiver bookings can be cancelled within 2 hours of booking with full refund
            </span>
          </div>

          {/* Auto-refund Info Message */}
          <div className={styles.infoMessage} style={{marginTop: '10px'}}>
            <span className={styles.infoIcon}>⏰</span>
            <span>
              If the caregiver does not accept your booking request within 10 hours, you will get a refund automatically
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Bookings List */}
          <div className={styles.bookingsSection}>
            {filteredBookings.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <h3>No caregiver bookings found</h3>
                <p>
                  {filters.search 
                    ? 'Try adjusting your search criteria'
                    : filters.type === 'all'
                    ? 'You haven\'t made any caregiver bookings yet'
                    : `No ${filters.type} bookings found`
                  }
                </p>
                <button 
                  className={styles.emptyActionButton}
                  onClick={() => navigate('/family-member/elder-caregivers')}
                >
                  Book a Caregiver
                </button>
              </div>
            ) : (
              <div className={styles.bookingsList}>
                {filteredBookings.map((booking) => {
                  const dateRange = formatDateRange(booking.start_date, booking.end_date);
                  const canCancel = canCancelBooking(booking);
                  const bookingStatus = getBookingStatus(booking);
                  const createdAt = new Date(booking.created_at);
                  const hoursSinceCreated = (new Date() - createdAt) / (1000 * 60 * 60);

                  return (
                    <div key={booking.request_id} className={styles.bookingCard}>
                      {/* Card Header */}
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderLeft}>
                          <span className={styles.bookingIdBadge}>#{booking.request_id}</span>
                          <span className={`${styles.statusBadge} ${styles[bookingStatus.toLowerCase().replace(' ', '-')]}`}>
                            {bookingStatus}
                          </span>
                        </div>
                        <div className={styles.bookingDate}>
                          <span className={styles.dateLabel}>Booked</span>
                          <span className={styles.dateValue}>
                            {createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className={styles.cardBody}>
                        <div className={styles.caregiverSection}>
                          <div className={styles.sectionIcon}>🧑‍💼</div>
                          <div className={styles.sectionContent}>
                            <h3 className={styles.caregiverName}>{booking.caregiver_name}</h3>
                            <p className={styles.caregiverLabel}>Caregiver</p>
                          </div>
                        </div>

                        <div className={styles.elderSection}>
                          <span className={styles.infoLabel}>Elder Care For:</span>
                          <span className={styles.infoValue}>{booking.elder_name}</span>
                        </div>

                        <div className={styles.dateRangeSection}>
                          <div className={styles.dateBox}>
                            <span className={styles.dateBoxLabel}>Start Date</span>
                            <span className={styles.dateBoxValue}>{dateRange.start}</span>
                          </div>
                          <div className={styles.dateArrow}>→</div>
                          <div className={styles.dateBox}>
                            <span className={styles.dateBoxLabel}>End Date</span>
                            <span className={styles.dateBoxValue}>{dateRange.end}</span>
                          </div>
                        </div>

                        {/* Price Section - Removed Duration */}
                        {booking.total_amount && (
                          <div className={styles.durationPriceSection}>
                            <div className={styles.priceBadge} style={{flex: 'initial', width: '100%'}}>
                              <span>Rs. {booking.total_amount.toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        {/* Payment Status */}
                        {booking.payment_status && (
                          <div className={styles.paymentStatusSection}>
                            <span className={styles.paymentLabel}>Payment Status:</span>
                            <span className={`${styles.paymentBadge} ${styles[booking.payment_status]}`}>
                              {booking.payment_status === 'completed' ? 'Paid' : 
                               booking.payment_status === 'refunded' ? 'Refunded' : 
                               booking.payment_status}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Cancellation Alert */}
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (bookingStatus === 'Upcoming' || bookingStatus === 'Pending') && (
                        <div className={styles.cancellationAlert}>
                          {canCancel ? (
                            <div className={styles.canCancelAlert}>
                              <span className={styles.alertText}>
                                Can cancel • {(2 - hoursSinceCreated).toFixed(1)}h remaining • Full refund
                              </span>
                            </div>
                          ) : (
                            <div className={styles.cannotCancelAlert}>
                              <span className={styles.alertText}>
                                Cancellation window closed
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Footer - Actions */}
                      <div className={styles.cardFooter}>
                        <button
                          className={styles.detailsButton}
                          onClick={() => openDetailsModal(booking)}
                        >
                          More Details
                        </button>
                        
                        {/* Rating Button - Show for all bookings */}
                        <button
                          className={booking.rating_id ? styles.viewRatingButton : styles.addRatingButton}
                          onClick={() => openRatingModal(booking)}
                        >
                          {booking.rating_id ? (
                            <>⭐ View Rating</>
                          ) : (
                            <>⭐ Rate Caregiver</>
                          )}
                        </button>
                        
                        {canCancel && (
                          <button
                            className={`${styles.cancelButton} ${cancellingId === booking.request_id ? styles.cancelling : ''}`}
                            onClick={(e) => handleCancelBooking(booking, e)}
                            disabled={cancellingId === booking.request_id}
                          >
                            {cancellingId === booking.request_id ? (
                              <>
                                <span className={styles.buttonSpinner}></span>
                                Cancelling...
                              </>
                            ) : (
                              <>
                                Cancel & Refund
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Modal */}
          {showDetailsModal && selectedBooking && (
            <div className={styles.modalOverlay} onClick={closeDetailsModal}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>Booking Details</h2>
                  <button className={styles.modalClose} onClick={closeDetailsModal}>✕</button>
                </div>

                <div className={styles.modalBody}>
                  {/* Booking ID & Status */}
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Booking Information</h3>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>Booking ID:</span>
                      <span className={styles.modalValue}>#{selectedBooking.request_id}</span>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>Status:</span>
                      <span className={`${styles.statusBadge} ${styles[getBookingStatus(selectedBooking).toLowerCase().replace(' ', '-')]}`}>
                        {getBookingStatus(selectedBooking)}
                      </span>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>Booked On:</span>
                      <span className={styles.modalValue}>
                        {new Date(selectedBooking.created_at).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Caregiver Details */}
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Caregiver Details</h3>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>Name:</span>
                      <span className={styles.modalValue}>{selectedBooking.caregiver_name}</span>
                    </div>
                  </div>

                  {/* Elder Details */}
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Elder Care Details</h3>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>Elder Name:</span>
                      <span className={styles.modalValue}>{selectedBooking.elder_name}</span>
                    </div>
                  </div>

                  {/* Service Period */}
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>📅 Service Period</h3>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>Start Date:</span>
                      <span className={styles.modalValue}>
                        {new Date(selectedBooking.start_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>End Date:</span>
                      <span className={styles.modalValue}>
                        {new Date(selectedBooking.end_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>Duration:</span>
                      <span className={styles.modalValue}>
                        <span className={styles.durationHighlight}>{selectedBooking.duration} Days</span>
                      </span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {selectedBooking.total_amount && (
                    <div className={styles.modalSection}>
                      <h3 className={styles.sectionTitle}>Payment Information</h3>
                      <div className={styles.modalRow}>
                        <span className={styles.modalLabel}>Total Amount:</span>
                        <span className={styles.modalValueHighlight}>
                          Rs. {selectedBooking.total_amount.toLocaleString()}
                        </span>
                      </div>
                      {selectedBooking.payment_method && (
                        <div className={styles.modalRow}>
                          <span className={styles.modalLabel}>Payment Method:</span>
                          <span className={styles.modalValue}>{selectedBooking.payment_method}</span>
                        </div>
                      )}
                      {selectedBooking.payment_status && (
                        <div className={styles.modalRow}>
                          <span className={styles.modalLabel}>Payment Status:</span>
                          <span className={`${styles.paymentBadge} ${styles[selectedBooking.payment_status]}`}>
                            {selectedBooking.payment_status === 'completed' ? 'Completed' : selectedBooking.payment_status}
                          </span>
                        </div>
                      )}
                      {selectedBooking.transaction_id && (
                        <div className={styles.modalRow}>
                          <span className={styles.modalLabel}>Transaction ID:</span>
                          <span className={styles.modalValue}>{selectedBooking.transaction_id}</span>
                        </div>
                      )}
                      {selectedBooking.payment_date && (
                        <div className={styles.modalRow}>
                          <span className={styles.modalLabel}>Payment Date:</span>
                          <span className={styles.modalValue}>
                            {new Date(selectedBooking.payment_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancellation Policy */}
                  {selectedBooking.status === 'confirmed' && getBookingStatus(selectedBooking) === 'Upcoming' && (
                    <div className={styles.modalSection}>
                      <h3 className={styles.sectionTitle}>Cancellation Policy</h3>
                      <div className={styles.cancellationPolicy}>
                        <p>• Free cancellation within 2 hours of booking</p>
                        <p>• Full refund if cancelled within window</p>
                        <p>• No refund after 2-hour window</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button className={styles.modalCloseButton} onClick={closeDetailsModal}>
                    Close
                  </button>
                  {canCancelBooking(selectedBooking) && (
                    <button
                      className={styles.modalCancelButton}
                      onClick={(e) => {
                        closeDetailsModal();
                        handleCancelBooking(selectedBooking, e);
                      }}
                      disabled={cancellingId === selectedBooking.request_id}
                    >
                      {cancellingId === selectedBooking.request_id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelModal && bookingToCancel && (
            <div className={styles.modalOverlay} onClick={closeCancelModal}>
              <div className={styles.cancelModalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.cancelModalHeader}>
                  <h2 className={styles.cancelModalTitle}>Cancel Booking</h2>
                </div>

                <div className={styles.cancelModalBody}>
                  <p className={styles.cancelModalText}>
                    Are you sure you want to cancel this booking?
                  </p>
                  
                  <div className={styles.cancelModalInfo}>
                    <div className={styles.cancelInfoRow}>
                      <span className={styles.cancelInfoLabel}>Caregiver:</span>
                      <span className={styles.cancelInfoValue}>{bookingToCancel.caregiver_name}</span>
                    </div>
                    <div className={styles.cancelInfoRow}>
                      <span className={styles.cancelInfoLabel}>Elder:</span>
                      <span className={styles.cancelInfoValue}>{bookingToCancel.elder_name}</span>
                    </div>
                  </div>

                  <div className={styles.cancelModalNotice}>
                    <span className={styles.noticeText}>A full refund will be processed to your account</span>
                  </div>
                </div>

                <div className={styles.cancelModalFooter}>
                  <button
                    className={styles.cancelModalNoButton}
                    onClick={closeCancelModal}
                  >
                    No, Keep Booking
                  </button>
                  <button
                    className={styles.cancelModalYesButton}
                    onClick={confirmCancellation}
                  >
                    Yes, Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rating Modal */}
          {showRatingModal && bookingToRate && (
            <div className={styles.modalOverlay} onClick={closeRatingModal}>
              <div className={styles.ratingModalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.ratingModalHeader}>
                  <h2 className={styles.ratingModalTitle}>
                    {bookingToRate.rating_id ? 'Your Rating' : 'Rate Caregiver'}
                  </h2>
                  <button className={styles.modalClose} onClick={closeRatingModal}>✕</button>
                </div>

                <div className={styles.ratingModalBody}>
                  {/* Caregiver Info */}
                  <div className={styles.ratingCaregiverInfo}>
                    <div className={styles.ratingInfoIcon}>🧑‍💼</div>
                    <div className={styles.ratingInfoText}>
                      <h3>{bookingToRate.caregiver_name}</h3>
                      <p>Booking #{bookingToRate.request_id}</p>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className={styles.starRatingSection}>
                    <label className={styles.ratingLabel}>Rating</label>
                    <div className={styles.starRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`${styles.star} ${
                            star <= ratingData.rating ? styles.filled : ''
                          } ${bookingToRate.rating_id ? styles.disabled : ''}`}
                          onClick={() => !bookingToRate.rating_id && handleStarClick(star)}
                          style={{
                            cursor: bookingToRate.rating_id ? 'default' : 'pointer',
                            fontSize: '2.5rem'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {ratingData.rating > 0 && (
                      <p className={styles.ratingText}>
                        {ratingData.rating === 1 && 'Poor'}
                        {ratingData.rating === 2 && 'Fair'}
                        {ratingData.rating === 3 && 'Good'}
                        {ratingData.rating === 4 && 'Very Good'}
                        {ratingData.rating === 5 && 'Excellent'}
                      </p>
                    )}
                  </div>

                  {/* Feedback */}
                  <div className={styles.feedbackSection}>
                    <label className={styles.ratingLabel}>
                      Feedback {!bookingToRate.rating_id && <span className={styles.optional}>(Optional)</span>}
                    </label>
                    <textarea
                      className={styles.feedbackTextarea}
                      placeholder="Share your experience with this caregiver..."
                      value={ratingData.feedback}
                      onChange={(e) => setRatingData(prev => ({ ...prev, feedback: e.target.value }))}
                      rows={4}
                      disabled={bookingToRate.rating_id}
                      readOnly={bookingToRate.rating_id}
                    />
                  </div>

                  {/* Rating Date (if already rated) */}
                  {bookingToRate.rating_id && bookingToRate.rating_date && (
                    <div className={styles.ratingDateSection}>
                      <span className={styles.ratingDateLabel}>Rated on:</span>
                      <span className={styles.ratingDateValue}>
                        {new Date(bookingToRate.rating_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Booking Not Ended Notice */}
                  {!bookingToRate.rating_id && !hasBookingEnded(bookingToRate) && (
                    <div className={styles.ratingNoticeSection}>
                      <span className={styles.noticeIcon}>ℹ️</span>
                      <span className={styles.noticeText}>
                        You can rate this caregiver after the booking period ends on{' '}
                        {new Date(bookingToRate.end_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.ratingModalFooter}>
                  <button
                    className={styles.ratingCancelButton}
                    onClick={closeRatingModal}
                  >
                    {bookingToRate.rating_id ? 'Close' : 'Cancel'}
                  </button>
                  {!bookingToRate.rating_id && (
                    <button
                      className={styles.ratingSubmitButton}
                      onClick={handleSubmitRating}
                      disabled={submittingRating || ratingData.rating === 0 || !hasBookingEnded(bookingToRate)}
                    >
                      {submittingRating ? (
                        <>
                          <span className={styles.buttonSpinner}></span>
                          Submitting...
                        </>
                      ) : (
                        'Submit Rating'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default CaregiverBookings;
