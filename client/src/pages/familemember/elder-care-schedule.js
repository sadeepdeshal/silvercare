import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import { familyMemberApi } from '../../services/familyMemberApi';
import { getCareAssignmentsByWeek } from '../../services/caregiverApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/familymember/elder-care-schedule.module.css';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';

const ElderCareSchedule = () => {
  const { elderId } = useParams();
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [elder, setElder] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monthly calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyAssignments, setMonthlyAssignments] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Modal state for day details
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayAssignments, setSelectedDayAssignments] = useState([]);

  // Carelog state
  const [carelogStatus, setCarelogStatus] = useState([]);
  const [carelogLoading, setCarelogLoading] = useState(false);
  const [selectedDayCarelogs, setSelectedDayCarelogs] = useState([]);
  const [carelogDetailsLoading, setCarelogDetailsLoading] = useState(false);

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

  // Fetch elder details and care data
  useEffect(() => {
    const fetchElderAndCareData = async () => {
      if (!elderId || !currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        // Fetch elder details from family member's elders
        const response = await elderApi.getEldersByFamilyMember(currentUser.user_id);
        
        if (response.success) {
          const elderData = response.elders.find(e => e.elder_id === parseInt(elderId));
          
          if (elderData) {
            setElder(elderData);
            
            // Fetch monthly assignments
            await fetchMonthlyAssignments(elderId, currentMonth);
          } else {
            setError('Elder not found or not accessible');
          }
        } else {
          setError('Failed to load elder data');
        }
        
      } catch (err) {
        console.error('Error fetching elder data:', err);
        setError('Failed to load elder care schedule');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'family_member') {
      fetchElderAndCareData();
    }
  }, [elderId, currentUser, currentMonth]);

  // Fetch monthly assignments
  const fetchMonthlyAssignments = async (elderId, month) => {
    try {
      setMonthlyLoading(true);
      
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
      
      setMonthlyAssignments(allDailyAssignments);
      
      // Also fetch carelog status for the month
      await fetchMonthlyCarelogStatus(elderId, month);
      
      setMonthlyLoading(false);
    } catch (err) {
      console.error('Error fetching monthly assignments:', err);
      setMonthlyLoading(false);
    }
  };

  // Fetch carelog status for the month
  const fetchMonthlyCarelogStatus = async (elderId, month) => {
    if (!currentUser?.user_id) return;
    
    try {
      setCarelogLoading(true);
      
      // Get first and last day of the month
      const year = month.getFullYear();
      const monthNum = month.getMonth();
      const firstDay = new Date(year, monthNum, 1);
      const lastDay = new Date(year, monthNum + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      const response = await familyMemberApi.getElderCarelogStatus(
        currentUser.user_id, 
        elderId, 
        startDate, 
        endDate
      );
      
      if (response.success) {
        setCarelogStatus(response.carelogStatus);
        console.log('Carelog status received:', response.carelogStatus);
      } else {
        console.error('Failed to fetch carelog status:', response.message);
        setCarelogStatus([]);
      }
      
      setCarelogLoading(false);
    } catch (err) {
      console.error('Error fetching carelog status:', err);
      setCarelogStatus([]);
      setCarelogLoading(false);
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
    if (elderId) {
      fetchMonthlyAssignments(elderId, newMonth);
    }
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (elderId) {
      fetchMonthlyAssignments(elderId, today);
    }
  };

  // Handle day click
  const handleDayClick = async (date, assignments, hasCarelog = false) => {
    if (assignments && assignments.length > 0 || hasCarelog) {
      setSelectedDay(date);
      setSelectedDayAssignments(assignments || []);
      setSelectedDayCarelogs([]);
      
      // If there's carelog data, fetch it
      if (hasCarelog && currentUser?.user_id && elderId) {
        setCarelogDetailsLoading(true);
        try {
          const response = await familyMemberApi.getElderCarelogByDate(
            currentUser.user_id, 
            elderId, 
            date
          );
          
          if (response.success) {
            setSelectedDayCarelogs(response.carelogs);
          } else {
            console.error('Failed to fetch carelog details:', response.message);
            setSelectedDayCarelogs([]);
          }
        } catch (err) {
          console.error('Error fetching carelog details:', err);
          setSelectedDayCarelogs([]);
        }
        setCarelogDetailsLoading(false);
      }
      
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
      
      // Find carelog status for this date
      const carelogData = carelogStatus.find(c => c.log_date === dateStr);
      const hasCarelog = carelogData && carelogData.report_count > 0;
      
      // Debug logging for carelog status
      if (hasCarelog) {
        console.log(`Date ${dateStr} has carelog:`, carelogData);
      }
      
      days.push({
        date: dateStr,
        day: day,
        assignments: assignments,
        isToday: isToday(dateStr),
        hasCarelog: hasCarelog,
        carelogInfo: carelogData
      });
    }

    return days;
  };

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

  if (dataLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading elder care schedule...</p>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.errorContainer}>
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  if (!elder) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.errorContainer}>
            <h2>⚠️ Elder Not Found</h2>
            <p>The requested elder could not be found.</p>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/family-member/todays-care-report')}
            >
              Back to Care Report
            </button>
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
          {/* Header Section */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.elderInfo}>
                <div>
                  <h1 className={styles.title}>Care Reports for {elder.name}</h1>
                  <p className={styles.subtitle}>
                    Care reports overview and schedule
                  </p>
                </div>
              </div>
              <button 
                className={styles.backButton}
                onClick={() => navigate('/family-member/todays-care-report')}
              >
                ← Back to Elders
              </button>
            </div>
          </div>

          {/* Monthly Calendar Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>📆 Care Calendar</h2>
              <p>Monthly view of {elder.name}'s care schedule</p>
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
                    {generateCalendarDays().map((dayInfo, index) => (
                      dayInfo.isEmpty ? (
                        <div key={`empty-${index}`} className={styles.emptyDay}></div>
                      ) : (
                        <div 
                          key={dayInfo.date}
                          className={`${styles.calendarDay} ${
                            dayInfo.isToday ? styles.todayDay : ''
                          } ${
                            dayInfo.assignments.length > 0 ? styles.hasAssignment : ''
                          } ${
                            dayInfo.hasCarelog ? styles.hasCarelog : ''
                          }`}
                          onClick={() => handleDayClick(dayInfo.date, dayInfo.assignments, dayInfo.hasCarelog)}
                        >
                          <div className={styles.dayNumber}>{dayInfo.day}</div>
                          
                          {dayInfo.isToday && (
                            <div className={styles.todayCalendarBadge}>Today</div>
                          )}
                          
                          {dayInfo.hasCarelog && (
                            <div className={styles.submittedBadge}>Submitted</div>
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
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </FamilyMemberLayout>

      {/* Day Details Modal */}
      {showDayModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDayModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {elder.name}'s Care on {formatDate(selectedDay)}
              </h3>
              <button 
                className={styles.modalCloseBtn}
                onClick={() => setShowDayModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Care Assignments Section */}
              {selectedDayAssignments.length > 0 && (
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSectionTitle}>📋 Care Assignments</h4>
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
              )}

              {/* Carelog Reports Section */}
              {carelogDetailsLoading ? (
                <div className={styles.modalSection}>
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading care reports...</p>
                  </div>
                </div>
              ) : selectedDayCarelogs.length > 0 ? (
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSectionTitle}>📝 Care Reports</h4>
                  {selectedDayCarelogs.map((carelog, index) => (
                    <div key={index} className={styles.modalCarelogCard}>
                      <div className={styles.modalCardHeader}>
                        <div className={styles.modalCarelogIcon}>📋</div>
                        <div>
                          <h4>Report by {carelog.caregiver_name}</h4>
                          <span className={styles.modalDateBadge}>
                            {new Date(carelog.date).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className={styles.modalCardBody}>
                        <div className={styles.modalInfoRow}>
                          <span className={styles.modalInfoLabel}>👨‍⚕️ Caregiver:</span>
                          <span className={styles.modalInfoValue}>{carelog.caregiver_name}</span>
                        </div>

                        <div className={styles.modalInfoRow}>
                          <span className={styles.modalInfoLabel}>📞 Contact:</span>
                          <span className={styles.modalInfoValue}>{carelog.caregiver_phone}</span>
                        </div>

                        {carelog.mood && (
                          <div className={styles.modalInfoRow}>
                            <span className={styles.modalInfoLabel}>😊 Mood:</span>
                            <span className={styles.modalInfoValue}>{carelog.mood}</span>
                          </div>
                        )}

                        {carelog.health_status && (
                          <div className={styles.modalInfoSection}>
                            <span className={styles.modalInfoLabel}>🏥 Health Status:</span>
                            <div className={styles.modalInfoText}>{carelog.health_status}</div>
                          </div>
                        )}

                        {carelog.activities && (
                          <div className={styles.modalInfoSection}>
                            <span className={styles.modalInfoLabel}>🎯 Activities:</span>
                            <div className={styles.modalInfoText}>{carelog.activities}</div>
                          </div>
                        )}

                        {carelog.medications_given && (
                          <div className={styles.modalInfoSection}>
                            <span className={styles.modalInfoLabel}>💊 Medications Given:</span>
                            <div className={styles.modalInfoText}>{carelog.medications_given}</div>
                          </div>
                        )}

                        {carelog.notes && (
                          <div className={styles.modalInfoSection}>
                            <span className={styles.modalInfoLabel}>📝 Notes:</span>
                            <div className={styles.modalInfoText}>{carelog.notes}</div>
                          </div>
                        )}

                        {carelog.concerns && (
                          <div className={styles.modalInfoSection}>
                            <span className={styles.modalInfoLabel}>⚠️ Concerns:</span>
                            <div className={styles.modalInfoText}>{carelog.concerns}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Empty state */}
              {selectedDayAssignments.length === 0 && selectedDayCarelogs.length === 0 && !carelogDetailsLoading && (
                <div className={styles.modalEmptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <h4>No Data Available</h4>
                  <p>No care assignments or reports found for this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElderCareSchedule;