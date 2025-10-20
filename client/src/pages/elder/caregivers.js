import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import ElderLayout from '../../components/ElderLayout';
import styles from '../../components/css/elder/caregivers.module.css';
import { 
  getElderDetailsByEmail,
  getCareAssignmentsByWeek 
} from '../../services/elderApi2';
import { 
  getUpcomingCareAssignments
} from '../../services/caregiverApi';

const Caregivers = () => {
  const { currentUser } = useAuth();
  const [elderDetails, setElderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upcoming care schedule state
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  // Monthly calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyAssignments, setMonthlyAssignments] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Modal state for day details
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayAssignments, setSelectedDayAssignments] = useState([]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch elder details
  useEffect(() => {
    const fetchElderDetails = async () => {
      if (!currentUser?.email) return;

      try {
        setLoading(true);
        console.log('====== CAREGIVERS PAGE LOADING ======');
        console.log('Fetching elder details for email:', currentUser.email);
        
        const response = await getElderDetailsByEmail(currentUser.email);
        console.log('Elder details received:', response.data);
        console.log('Elder ID:', response.data.elder_id);
        console.log('Elder Name:', response.data.name);
        
        setElderDetails(response.data);

        // Fetch upcoming assignments
        if (response.data?.elder_id) {
          console.log('Fetching care assignments for elder_id:', response.data.elder_id);
          await fetchUpcomingAssignments(response.data.elder_id);
          await fetchMonthlyAssignments(response.data.elder_id, currentMonth);
        } else {
          console.error('No elder_id found!');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching elder details:', err);
        setError('Failed to load your details');
        setLoading(false);
      }
    };

    fetchElderDetails();
  }, [currentUser.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch upcoming assignments
  const fetchUpcomingAssignments = async (elderId) => {
    try {
      setUpcomingLoading(true);
      const response = await getUpcomingCareAssignments(elderId);
      console.log('Upcoming assignments:', response.data);
      setUpcomingAssignments(response.data.assignments || []);
      setUpcomingLoading(false);
    } catch (err) {
      console.error('Error fetching upcoming assignments:', err);
      setUpcomingLoading(false);
    }
  };

  // Fetch monthly assignments (using week endpoint)
  const fetchMonthlyAssignments = async (elderId, month) => {
    try {
      setMonthlyLoading(true);
      console.log('=== Fetching Monthly Assignments (via weeks) ===');
      console.log('Elder ID:', elderId);
      console.log('Month:', month);
      
      // Get first day of the month
      const year = month.getFullYear();
      const monthNum = month.getMonth();
      const firstDay = new Date(year, monthNum, 1);
      const lastDay = new Date(year, monthNum + 1, 0);
      
      // Find the Sunday before or on the first day
      const startOfFirstWeek = new Date(firstDay);
      startOfFirstWeek.setDate(firstDay.getDate() - firstDay.getDay());
      
      const allDailyAssignments = [];
      const weeksToFetch = [];
      
      // Calculate all week starts we need to fetch
      let currentWeekStart = new Date(startOfFirstWeek);
      while (currentWeekStart <= lastDay) {
        weeksToFetch.push(new Date(currentWeekStart));
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
      
      console.log(`Fetching ${weeksToFetch.length} weeks of data...`);
      
      // Fetch all weeks
      const weekPromises = weeksToFetch.map(weekStart =>
        getCareAssignmentsByWeek(elderId, weekStart.toISOString().split('T')[0])
      );
      
      const weekResponses = await Promise.all(weekPromises);
      
      // Combine all daily assignments and filter to only this month
      weekResponses.forEach(response => {
        if (response.data.success && response.data.dailyAssignments) {
          response.data.dailyAssignments.forEach(day => {
            const dayDate = new Date(day.date);
            // Only include days that are in the target month
            if (dayDate.getMonth() === monthNum && dayDate.getFullYear() === year) {
              allDailyAssignments.push(day);
            }
          });
        }
      });
      
      console.log('Total daily assignments for month:', allDailyAssignments.length);
      console.log('Days with assignments:', allDailyAssignments.filter(d => d.assignments.length > 0).length);
      
      setMonthlyAssignments(allDailyAssignments);
      setMonthlyLoading(false);
    } catch (err) {
      console.error('Error fetching monthly assignments:', err);
      setMonthlyLoading(false);
    }
  };

  // Month navigation
  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    if (elderDetails?.elder_id) {
      fetchMonthlyAssignments(elderDetails.elder_id, newMonth);
    }
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (elderDetails?.elder_id) {
      fetchMonthlyAssignments(elderDetails.elder_id, today);
    }
  };

  // Handle day click
  const handleDayClick = async (date, assignments) => {
    if (assignments && assignments.length > 0) {
      setSelectedDay(date);
      setSelectedDayAssignments(assignments);
      setShowDayModal(true);
    }
  };

  // Format date helpers
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return today.getDate() === checkDate.getDate() &&
           today.getMonth() === checkDate.getMonth() &&
           today.getFullYear() === checkDate.getFullYear();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    console.log('=== Generating Calendar Days ===');
    console.log('Current Month:', currentMonth);
    console.log('Year:', year, 'Month:', month);
    console.log('Monthly Assignments Array:', monthlyAssignments);
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ isEmpty: true });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Find assignments for this date from the array
      const dayData = monthlyAssignments.find(d => d.date === dateStr);
      const assignments = dayData ? dayData.assignments : [];
      
      if (day <= 5) { // Log first 5 days for debugging
        console.log(`Day ${day} (${dateStr}):`, assignments.length, 'assignments', assignments);
      }
      
      days.push({
        date: dateStr,
        day: day,
        assignments: assignments,
        isToday: isToday(dateStr)
      });
    }

    console.log('Total days generated:', days.length);
    return days;
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <ElderLayout>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading your care information...</p>
          </div>
        </ElderLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <ElderLayout>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Error Loading Care Information</h2>
            <p>{error}</p>
            <button 
              className={styles.retryBtn}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </ElderLayout>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <ElderLayout>
        <div className={styles.contentWrapper}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <h1>My Caregivers</h1>
              <p>View and manage your care assignments</p>
            </div>
          </div>

          {/* Upcoming Care Schedule Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Upcoming Care Schedule</h2>
              <p>Your scheduled care sessions in the coming days</p>
            </div>

            <div className={styles.sectionContent}>
              {upcomingLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading upcoming assignments...</p>
                </div>
              ) : upcomingAssignments.length > 0 ? (
                <div className={styles.upcomingGrid}>
                  {upcomingAssignments.map((assignment, index) => (
                    <div key={index} className={styles.upcomingCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.caregiverIcon}>👨‍⚕️</div>
                        <div className={styles.cardHeaderInfo}>
                          <h3>{assignment.caregiver_name}</h3>
                          <span className={styles.statusBadge}>
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className={styles.cardBody}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>📞 Phone:</span>
                          <span className={styles.infoValue}>{assignment.caregiver_phone}</span>
                        </div>
                        
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}> Start Date:</span>
                          <span className={styles.infoValue}>{formatDate(assignment.start_date)}</span>
                        </div>
                        
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>End Date:</span>
                          <span className={styles.infoValue}>{formatDate(assignment.end_date)}</span>
                        </div>
                        
                        
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noData}>
                  <div className={styles.noDataIcon}>📋</div>
                  <h3>No Upcoming Care Sessions</h3>
                  <p>You don't have any care sessions scheduled at the moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Calendar Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>📆 My Care Assignments</h2>
              <p>Monthly calendar view of your care schedule</p>
            </div>

            <div className={styles.calendarNavigation}>
              <button 
                className={styles.navBtn}
                onClick={() => handleMonthChange('prev')}
              >
                &#8249; Previous Month
              </button>
              
              <div className={styles.monthDisplay}>
                <span className={styles.monthText}>{formatMonthYear(currentMonth)}</span>
                {!isCurrentMonth() && (
                  <button 
                    className={styles.currentMonthBtn}
                    onClick={goToCurrentMonth}
                  >
                    This Month
                  </button>
                )}
              </div>
              
              <button 
                className={styles.navBtn}
                onClick={() => handleMonthChange('next')}
              >
                Next Month &#8250;
              </button>
            </div>

            <div className={styles.calendarContent}>
              {monthlyLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading calendar...</p>
                </div>
              ) : (
                <>
                  {/* Day headers */}
                  <div className={styles.calendarHeader}>
                    <div className={styles.dayHeader}>Sun</div>
                    <div className={styles.dayHeader}>Mon</div>
                    <div className={styles.dayHeader}>Tue</div>
                    <div className={styles.dayHeader}>Wed</div>
                    <div className={styles.dayHeader}>Thu</div>
                    <div className={styles.dayHeader}>Fri</div>
                    <div className={styles.dayHeader}>Sat</div>
                  </div>

                  {/* Calendar grid */}
                  <div className={styles.calendarGrid}>
                    {generateCalendarDays().length === 0 ? (
                      <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px'}}>
                        <p>No calendar days generated</p>
                      </div>
                    ) : (
                      generateCalendarDays().map((dayInfo, index) => (
                        dayInfo.isEmpty ? (
                          <div key={`empty-${index}`} className={styles.emptyDay}></div>
                        ) : (
                          <div 
                            key={dayInfo.date}
                            className={`${styles.calendarDay} ${
                              dayInfo.isToday ? styles.todayDay : ''
                            } ${
                              dayInfo.assignments.length > 0 ? styles.hasAssignment : ''
                            }`}
                            onClick={() => handleDayClick(dayInfo.date, dayInfo.assignments)}
                          >
                            <div className={styles.dayNumber}>{dayInfo.day}</div>
                            
                            {dayInfo.isToday && (
                              <div className={styles.todayBadge}>Today</div>
                            )}
                            
                            {dayInfo.assignments.length > 0 && (
                              <div className={styles.assignmentsPreview}>
                                {dayInfo.assignments.map((assignment, idx) => (
                                  <div key={idx} className={styles.assignmentPreviewItem}>
                                    <div className={styles.caregiverNamePreview}>
                                      {assignment.caregiver_name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ElderLayout>

      {/* Day Details Modal */}
      {showDayModal && (
        <div className={styles.modal} onClick={() => setShowDayModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Care Assignments</h3>
                <div className={styles.modalDate}>{formatDate(selectedDay)}</div>
              </div>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowDayModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {selectedDayAssignments.map((assignment, index) => (
                <div key={index} className={styles.modalAssignmentCard}>
                  <div className={styles.modalCardHeader}>
                    <div className={styles.modalCaregiverIcon}>👨‍⚕️</div>
                    <div>
                      <h4>{assignment.caregiver_name}</h4>
                      <span className={styles.modalStatusBadge}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.modalCardBody}>
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoLabel}>📞 Phone:</span>
                      <span className={styles.modalInfoValue}>{assignment.caregiver_phone}</span>
                    </div>

                    {assignment.caregiver_fixed_line && (
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalInfoLabel}>☎️ Fixed Line:</span>
                        <span className={styles.modalInfoValue}>{assignment.caregiver_fixed_line}</span>
                      </div>
                    )}

                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoLabel}>📍 District:</span>
                      <span className={styles.modalInfoValue}>{assignment.caregiver_district}</span>
                    </div>

                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoLabel}>📧 Email:</span>
                      <span className={styles.modalInfoValue}>{assignment.caregiver_email}</span>
                    </div>

                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoLabel}>📆 Start Date:</span>
                      <span className={styles.modalInfoValue}>{formatDate(assignment.start_date)}</span>
                    </div>

                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoLabel}>📆 End Date:</span>
                      <span className={styles.modalInfoValue}>{formatDate(assignment.end_date)}</span>
                    </div>

                    {assignment.duration && (
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalInfoLabel}>⏱️ Duration:</span>
                        <span className={styles.modalInfoValue}>{assignment.duration}</span>
                      </div>
                    )}

                    {assignment.certifications && (
                      <div className={styles.modalCertifications}>
                        <span className={styles.modalInfoLabel}>🎓 Certifications:</span>
                        <span className={styles.modalCertificationsValue}>{assignment.certifications}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caregivers;
