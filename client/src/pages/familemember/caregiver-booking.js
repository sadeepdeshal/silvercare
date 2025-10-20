import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caregiverApi } from '../../services/caregiverApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/caregiver-booking.module.css';

const CaregiverBooking = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { elderId, caregiverId } = useParams();

  const [selectedDates, setSelectedDates] = useState([]);
  const [caregiverInfo, setCaregiverInfo] = useState(null);
  const [elderInfo, setElderInfo] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = dayNames[date.getDay()];
    
    return `${dayOfWeek}, ${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  // Protect the route
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (currentUser.role !== 'family_member') {
      navigate('/login', { replace: true});
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate]);

  // Fetch booking info
  useEffect(() => {
    const fetchBookingInfo = async () => {
      if (!elderId || !caregiverId) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching caregiver booking info for elder:', elderId, 'caregiver:', caregiverId);
        
        const response = await caregiverApi.getCaregiverBookingInfo(elderId, caregiverId);
        
        if (response.success) {
          console.log('Booking info received:', response);
          
          setCaregiverInfo({
            name: response.caregiver.name,
            district: response.caregiver.district,
            certifications: response.caregiver.certifications,
            email: response.caregiver.email,
            phone: response.caregiver.phone,
            fixed_line: response.caregiver.fixed_line,
            daily_rate: response.caregiver.daily_rate
          });
          
          setElderInfo({
            name: response.elder.name,
            age: response.elder.age,
            district: response.elder.district,
            gender: response.elder.gender,
            contact: response.elder.contact,
            medical_conditions: response.elder.medical_conditions
          });
          
        } else {
          throw new Error(response.error || 'Failed to fetch booking information');
        }
        
      } catch (err) {
        console.error('Error fetching booking info:', err);
        setError(err.message || 'Failed to load booking information');
      } finally {
        setDataLoading(false);
      }
    };

    fetchBookingInfo();
  }, [elderId, caregiverId]);

  // Fetch blocked dates when month changes
  useEffect(() => {
    const fetchBlockedDates = async () => {
      if (!caregiverId) return;
      
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        console.log('Fetching blocked dates for caregiver:', caregiverId, year, month);
        
        const response = await caregiverApi.getBlockedDates(caregiverId, year, month);
        
        console.log('Full blocked dates API response:', response);
        
        if (response.success) {
          console.log('Blocked dates received:', response.blockedDates);
          console.log('Number of blocked dates:', response.blockedDates?.length || 0);
          console.log('Care requests:', response.careRequests);
          setBlockedDates(response.blockedDates || []);
        } else {
          console.error('Failed to fetch blocked dates:', response.error);
          setBlockedDates([]);
        }
        
      } catch (err) {
        console.error('Error fetching blocked dates:', err);
        setBlockedDates([]);
      }
    };

    if (caregiverId) {
      fetchBlockedDates();
    }
  }, [caregiverId, currentMonth]);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate day after tomorrow (minimum selectable date)
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    dayAfterTomorrow.setHours(0, 0, 0, 0);

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const isTodayOrTomorrow = date < dayAfterTomorrow; // Blocks today and tomorrow
      const isBlocked = blockedDates.includes(dateString);
      const isSelected = selectedDates.includes(dateString);
      
      // Debug logging for first few dates
      if (day <= 3) {
        console.log(`Date ${dateString}: isBlocked=${isBlocked}, isTodayOrTomorrow=${isTodayOrTomorrow}, blockedDates array:`, blockedDates);
      }
      
      days.push({
        day,
        date: dateString,
        isToday,
        isPast: isTodayOrTomorrow, // Mark today and tomorrow as "past" (unavailable)
        isBlocked,
        isSelected,
        isAvailable: !isTodayOrTomorrow && !isBlocked // Available only from day after tomorrow
      });
    }
    
    return days;
  };

  // Handle date selection with automatic range filling
  const handleDateToggle = (dateString) => {
    if (selectedDates.includes(dateString)) {
      // Deselect - remove this date
      setSelectedDates(selectedDates.filter(d => d !== dateString));
    } else {
      // Select
      if (selectedDates.length === 0) {
        // First date selection
        setSelectedDates([dateString]);
      } else {
        // Get all currently selected dates and the new date, then sort them
        const allDates = [...selectedDates, dateString].sort();
        const startDate = allDates[0];
        const endDate = allDates[allDates.length - 1];
        
        // Generate all dates between start and end (inclusive)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateRange = [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          
          // Check if date is not blocked and not past
          const dateObj = new Date(d);
          dateObj.setHours(0, 0, 0, 0);
          
          const isPast = dateObj < today;
          const isBlocked = blockedDates.includes(formattedDate);
          
          if (!isPast && !isBlocked) {
            dateRange.push(formattedDate);
          }
        }
        
        // Check if any dates in the range are blocked
        const totalDaysInRange = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (dateRange.length < totalDaysInRange) {
          setError('Cannot select this range: Some dates are unavailable or already booked');
          setTimeout(() => setError(null), 4000);
          return;
        }
        
        setSelectedDates(dateRange);
      }
    }
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    
    // Don't allow going to past months
    const today = new Date();
    if (newMonth.getMonth() < today.getMonth() && newMonth.getFullYear() <= today.getFullYear()) {
      return;
    }
    
    setCurrentMonth(newMonth);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Handle booking submission
  const handleProceedToSummary = () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one date for booking');
      return;
    }

    // Check for gaps in the selected date range
    if (selectedDates.length > 1) {
      const sortedDates = selectedDates.sort();
      const startDate = new Date(sortedDates[0]);
      const endDate = new Date(sortedDates[sortedDates.length - 1]);
      
      // Calculate the number of days between start and end
      const daysDifference = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // If the number of selected dates doesn't match the range, there are gaps
      if (selectedDates.length !== daysDifference) {
        setError('Please select a continuous date range without gaps. Remove any gaps between your start and end dates.');
        return;
      }
    }

    // Navigate to booking summary with selected dates
    const datesParam = selectedDates.sort().join(',');
    navigate(`/family-member/caregiver-booking-summary?caregiver=${caregiverId}&elder=${elderId}&dates=${datesParam}`);
  };

  // Clear all selected dates
  const handleClearDates = () => {
    setSelectedDates([]);
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    const dailyRate = caregiverInfo?.daily_rate || 0;
    return selectedDates.length * dailyRate;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const displayMonth = monthNames[currentMonth.getMonth()];
  const displayYear = currentMonth.getFullYear();

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

  // Show loading while fetching data
  if (dataLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading booking information...</h2>
            </div>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  // Show error if failed to load data
  if (error && !caregiverInfo) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.errorContainer}>
              <h2>Error Loading Booking Information</h2>
              <p>{error}</p>
              <button 
                className={styles.retryButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
              <button 
                className={styles.backButton}
                onClick={() => navigate(`/family-member/elder/${elderId}/caregivers-list`)}
              >
                ← Back to Caregivers
              </button>
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
              <h1 className={styles.title}>
                Book Caregiver Service
              </h1>
              <p className={styles.subtitle}>
                Select dates as a range - Click two dates to automatically select all dates in between. <br></br>Bookings must be made at least 2 days in advance.
              </p>
            </div>
            <button 
              className={styles.backButton}
              onClick={() => navigate(`/family-member/elder/${elderId}/caregivers-list`)}
            >
              ← Back to Caregivers
            </button>
          </div>

          {/* Calendar Section */}
          <div className={styles.bookingForm}>
            <div className={styles.calendarSection}>
              <h2 className={styles.sectionTitle}>Select Dates</h2>
              <p className={styles.calendarInstructions}>
                Click on available dates to select them. Click again to deselect. You can select multiple dates for booking. 
                <br></br><span style={{ color: '#dc2626', fontWeight: '600' }}>Note: Dates can only be selected from 2 days ahead.</span>
              </p>
              
              <div className={styles.calendarContainer}>
                <div className={styles.calendarHeader}>
                  <button 
                    className={styles.monthNavButton}
                    onClick={handlePreviousMonth}
                    disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                  >
                    ←
                  </button>
                  <h3>{displayMonth} {displayYear}</h3>
                  <button 
                    className={styles.monthNavButton}
                    onClick={handleNextMonth}
                  >
                    →
                  </button>
                </div>

                <div className={styles.calendarGrid}>
                  <div className={styles.dayHeaders}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className={styles.dayHeader}>{day}</div>
                    ))}
                  </div>
                  <div className={styles.daysGrid}>
                    {calendarDays.map((dayInfo, index) => (
                      <div
                        key={index}
                        className={`${styles.dayCell} ${
                          dayInfo ? (
                            dayInfo.isSelected ? styles.selected :
                            dayInfo.isToday ? styles.today :
                            dayInfo.isPast ? styles.pastDay :
                            dayInfo.isBlocked ? styles.blockedDay :
                            styles.available
                          ) : styles.empty
                        }`}
                        onClick={() => {
                          if (dayInfo && dayInfo.isAvailable) {
                            handleDateToggle(dayInfo.date);
                          }
                        }}
                        title={
                          dayInfo?.isBlocked ? 'This date is already booked' :
                          dayInfo?.isPast ? 'Not available (bookings must be at least 2 days in advance)' :
                          dayInfo?.isSelected ? 'Click to deselect' :
                          'Click to select'
                        }
                      >
                        {dayInfo?.day}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.calendarLegend}>
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor + ' ' + styles.availableColor}></div>
                    <span>Available</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor + ' ' + styles.selectedColor}></div>
                    <span>Selected</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor + ' ' + styles.blockedColor}></div>
                    <span>Blocked</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor + ' ' + styles.pastColor}></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Dates Summary */}
            {selectedDates.length > 0 && (
              <div className={styles.selectedDatesSummary}>
                <div className={styles.summaryHeader}>
                  <h3>Selected Dates ({selectedDates.length})</h3>
                  <button 
                    className={styles.clearButton}
                    onClick={handleClearDates}
                  >
                    Clear All
                  </button>
                </div>
                <div className={styles.selectedDatesList}>
                  {selectedDates.sort().map((date, index) => (
                    <div key={date} className={styles.selectedDateItem}>
                      <span className={styles.dateNumber}>{index + 1}.</span>
                      <span className={styles.dateText}>{formatDateForDisplay(date)}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.summaryTotal}>
                  <p><strong>Total Days:</strong> {selectedDates.length}</p>
                  <p><strong>Daily Rate:</strong> Rs. {caregiverInfo?.daily_rate?.toLocaleString() || 'N/A'}</p>
                  <p className={styles.totalCost}>
                    <strong>Total Cost:</strong> Rs. {calculateTotalCost().toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Book Button */}
            <div className={styles.submitSection}>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
              <button
                className={styles.submitButton}
                onClick={handleProceedToSummary}
                disabled={selectedDates.length === 0}
              >
                {selectedDates.length === 0 
                  ? 'Select at least one date to continue'
                  : `Proceed to Booking Summary (${selectedDates.length} ${selectedDates.length === 1 ? 'day' : 'days'})`
                }
              </button>
            </div>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default CaregiverBooking;
