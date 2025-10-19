import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import CaregiverLayout from '../../components/CaregiverLayout';
import caregiverApi from '../../services/caregiverApi2';
import { useAuth } from '../../context/AuthContext';
import DailyCareReportModal from '../../components/DailyCareReportModal.js';
import ErrorModal from '../../components/ErrorModal';

const Carelogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCarelog, setSelectedCarelog] = useState(null);
  
  // Cache to store fetched monthly data
  const [monthlyCache, setMonthlyCache] = useState({});
  
  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [reportSubmissionLoading, setReportSubmissionLoading] = useState(false);

  // Handle daily report submission
  const handleReportSubmit = async (reportData) => {
    try {
      setReportSubmissionLoading(true);
      
      console.log('=== CARELOG REPORT SUBMISSION ===');
      console.log('Report data:', reportData);
      console.log('Selected carelog:', selectedCarelog);
      
      const response = await caregiverApi.submitDailyReport(
        user.caregiver_id,
        selectedCarelog.elder_id,
        {
          ...reportData,
          date: selectedCarelog.date
        }
      );
      
      console.log('Report submitted successfully:', response);
      alert('Daily care report submitted successfully!');
      
      // Close modal
      setShowReportModal(false);
      setSelectedCarelog(null);
      
      // Clear cache for current month to force refresh
      const cacheKey = `${currentYear}-${currentMonth}`;
      setMonthlyCache(prev => {
        const newCache = { ...prev };
        delete newCache[cacheKey];
        return newCache;
      });
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchMonthlyReports(currentMonth, currentYear);
      }, 500);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit report. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setReportSubmissionLoading(false);
    }
  };

  // Fetch monthly reports using the same logic as dashboard
  const fetchMonthlyReports = async (month, year) => {
    const caregiverId = user.caregiver_id;
    
    if (!caregiverId) {
      console.error('❌ No caregiver_id found!');
      return;
    }
    
    // Check cache first
    const cacheKey = `${year}-${month}`;
    if (monthlyCache[cacheKey]) {
      console.log('✅ Using cached data for', cacheKey);
      setMonthlyReports(monthlyCache[cacheKey]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log(`🚀 Fetching monthly reports for caregiver ID: ${caregiverId}, Month: ${month + 1}, Year: ${year}`);
      
      const allReports = [];
      
      // Get first and last day of the month
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      // Make API calls week by week to cover the entire month
      let currentDate = new Date(startOfMonth);
      
      while (currentDate <= endOfMonth) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        if (weekEnd > endOfMonth) {
          weekEnd.setTime(endOfMonth.getTime());
        }
        
        const startDateStr = weekStart.toISOString().split('T')[0];
        const endDateStr = weekEnd.toISOString().split('T')[0];
        
        console.log(`📅 API Call: /api/caregivers/${caregiverId}/weekly-reports?startDate=${startDateStr}&endDate=${endDateStr}`);
        
        try {
          const weekData = await caregiverApi.fetchWeeklyReports(caregiverId, startDateStr, endDateStr);
          if (weekData && weekData.length > 0) {
            allReports.push(...weekData);
          }
        } catch (weekError) {
          console.error(`❌ Error fetching week ${startDateStr}:`, weekError);
        }
        
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      console.log('📊 All monthly reports combined:', allReports);
      setMonthlyReports(allReports);
      
      // Cache the result
      setMonthlyCache(prev => ({
        ...prev,
        [cacheKey]: allReports
      }));
      
    } catch (error) {
      console.error('❌ Error fetching monthly reports:', error);
      setMonthlyReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user.caregiver_id) {
      console.error('❌ No user or caregiver_id found!');
      return;
    }
  }, [user]);

  useEffect(() => {
    if (user?.caregiver_id) {
      fetchMonthlyReports(currentMonth, currentYear);
    }
  }, [currentMonth, currentYear, user]);

  // Calendar helper functions
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Get day report data for a specific date
  const getDayReportData = (day) => {
    if (!day) return null;
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return monthlyReports.find(report => {
      if (!report.date) return false;
      const reportDate = new Date(report.date).toISOString().split('T')[0];
      return reportDate === dateStr;
    });
  };

  const handleDateClick = (day, dayReport) => {
    if (!day || !dayReport || !dayReport.elder_id) return;
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(currentYear, currentMonth, day);
    targetDate.setHours(0, 0, 0, 0);
    
    const isPast = targetDate < today;
    const isToday = targetDate.getTime() === today.getTime();
    
    console.log('=== CARELOG DATE CLICK DEBUG ===');
    console.log('Date:', dateStr);
    console.log('Is Today:', isToday);
    console.log('Is Past:', isPast);
    console.log('Has Report:', dayReport.hasReport);
    console.log('Existing Report:', dayReport.existingReport);
    
    if (dayReport.hasReport) {
      // Has existing report
      if (isToday) {
        // Today's report - can be edited
        console.log('Opening today\'s report (editable)');
        setSelectedCarelog({
          date: dateStr,
          elder_name: dayReport.elder_name,
          elder_id: dayReport.elder_id,
          isReadOnly: false,
          existingReport: dayReport.existingReport || {}
        });
        setShowReportModal(true);
      } else if (isPast) {
        // Past date report - read-only
        console.log('Opening past report (read-only)');
        setSelectedCarelog({
          date: dateStr,
          elder_name: dayReport.elder_name,
          elder_id: dayReport.elder_id,
          isReadOnly: true,
          existingReport: dayReport.existingReport || {}
        });
        setShowReportModal(true);
      }
    } else {
      // No existing report
      if (isToday) {
        // Today - can upload new report
        console.log('Opening new report form for today');
        setSelectedCarelog({
          date: dateStr,
          elder_name: dayReport.elder_name,
          elder_id: dayReport.elder_id,
          isReadOnly: false,
          existingReport: null
        });
        setShowReportModal(true);
      } else if (isPast) {
        // Past date without report - show error
        console.log('Cannot upload report for past date');
        setErrorModalMessage('Cannot upload reports for past dates. Reports must be submitted on the same day.');
        setShowErrorModal(true);
      }
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div style={{ padding: '30px', minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: "'Segoe UI', sans-serif" }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
              <div style={{ width: 50, height: 50, border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 20 }} />
              <p style={{ color: '#667eea', fontSize: 18, fontWeight: 500 }}>Loading care logs...</p>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  // Get calendar days
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const calendarDays = [];
  
  // Add actual days only (no empty cells)
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <>
      <Navbar />
      <CaregiverLayout>
        <div style={{ padding: '30px', minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: "'Segoe UI', sans-serif" }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            background: 'white',
            padding: '20px 28px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h1 style={{
              color: '#2c3e50',
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Care Logs
            </h1>
          </div>

          {/* Month Navigation */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <button 
              onClick={goToPreviousMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              ←
            </button>
            
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              style={{
                padding: '10px 16px',
                fontSize: '15px',
                fontWeight: 600,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#667eea',
                cursor: 'pointer',
                minWidth: '140px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                outline: 'none'
              }}
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              size="1"
              style={{
                padding: '10px 14px',
                fontSize: '15px',
                fontWeight: 600,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#764ba2',
                cursor: 'pointer',
                minWidth: '100px',
                maxHeight: '140px',
                overflowY: 'auto',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                outline: 'none',
                scrollbarWidth: 'thin',
                scrollbarColor: '#764ba2 rgba(255, 255, 255, 0.3)'
              }}
            >
              {Array.from({ length: 26 }, (_, i) => 2015 + i).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            
            <button 
              onClick={goToNextMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              →
            </button>
          </div>

          {/* Calendar */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.12)',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            {/* Calendar Days */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '20px'}}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} />;
                }

                const dayReport = getDayReportData(day);
                const today = new Date();
                const targetDate = new Date(currentYear, currentMonth, day);
                today.setHours(0, 0, 0, 0);
                targetDate.setHours(0, 0, 0, 0);
                
                const isToday = targetDate.getTime() === today.getTime();
                const isPast = targetDate < today;
                const isFuture = targetDate > today;
                const hasElderAssignment = dayReport && dayReport.elder_id;
                const hasReport = dayReport && dayReport.hasReport;
                
                const shouldShowStatus = hasElderAssignment && (isToday || isPast);
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day, dayReport)}
                    style={{
                      background: isToday 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        : hasElderAssignment 
                          ? 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)'
                          : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                      border: isToday 
                        ? '3px solid #764ba2' 
                        : hasElderAssignment 
                          ? '2px solid #e9d5ff' 
                          : '2px solid #e5e7eb',
                      borderRadius: '20px',
                      padding: '20px 16px',
                      cursor: hasElderAssignment ? 'pointer' : 'default',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      minHeight: '150px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: isToday 
                        ? '0 8px 24px rgba(118, 75, 162, 0.35)' 
                        : hasElderAssignment
                          ? '0 4px 12px rgba(102, 126, 234, 0.08)'
                          : '0 2px 6px rgba(0, 0, 0, 0.04)',
                      opacity: hasElderAssignment ? 1 : 0.5,
                      transform: 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (hasElderAssignment) {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)';
                        e.currentTarget.style.boxShadow = isToday
                          ? '0 12px 36px rgba(118, 75, 162, 0.45)'
                          : '0 12px 28px rgba(102, 126, 234, 0.18)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasElderAssignment) {
                        e.currentTarget.style.transform = 'scale(1) translateY(0px)';
                        e.currentTarget.style.boxShadow = isToday 
                          ? '0 8px 24px rgba(118, 75, 162, 0.35)' 
                          : hasElderAssignment
                            ? '0 4px 12px rgba(102, 126, 234, 0.08)'
                            : '0 2px 6px rgba(0, 0, 0, 0.04)';
                      }
                    }}
                  >
                    {isToday && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#764ba2',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '5px 10px',
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        letterSpacing: '0.5px'
                      }}>
                        TODAY
                      </div>
                    )}
                    
                    <div style={{
                      fontSize: '13px', 
                      fontWeight: 700, 
                      color: isToday ? 'rgba(255, 255, 255, 0.9)' : '#9ca3af', 
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][targetDate.getDay()]}
                    </div>
                    
                    <div style={{
                      fontSize: '32px', 
                      fontWeight: 800, 
                      color: isToday ? '#ffffff' : hasElderAssignment ? '#667eea' : '#9ca3af',
                      marginBottom: '12px',
                      textShadow: isToday ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
                    }}>
                      {day}
                    </div>
                    
                    <div style={{
                      fontSize: '12px', 
                      color: isToday ? 'rgba(255, 255, 255, 0.95)' : '#6b7280', 
                      marginBottom: '12px',
                      fontWeight: 600,
                      lineHeight: '1.4',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {dayReport && dayReport.elder_name && dayReport.elder_name !== 'No care today' ? (
                        <span style={{
                          color: isToday ? '#ffffff' : '#667eea', 
                          fontWeight: 700,
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: isToday ? 'rgba(255, 255, 255, 0.2)' : 'rgba(102, 126, 234, 0.1)',
                          borderRadius: '8px'
                        }}>
                          {dayReport.elder_name}
                        </span>
                      ) : (
                        <span style={{
                          color: isToday ? 'rgba(255, 255, 255, 0.7)' : '#cbd5e1', 
                          fontStyle: 'italic',
                          fontSize: '11px'
                        }}>
                          No care today
                        </span>
                      )}
                    </div>
                    
                    {shouldShowStatus && (
                      <div style={{
                        fontSize: '10px', 
                        fontWeight: 700, 
                        color: hasReport ? '#065f46' : '#dc2626',
                        background: hasReport 
                          ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                          : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        padding: '7px 14px',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        border: hasReport ? '2px solid #10b981' : '2px solid #f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: hasReport 
                          ? '0 2px 8px rgba(16, 185, 129, 0.2)'
                          : '0 2px 8px rgba(239, 68, 68, 0.2)'
                      }}>
                        {hasReport ? (
                          <>
                            <span style={{fontSize: '12px'}}>✓</span>
                            Uploaded
                          </>
                        ) : (
                          <>
                            <span style={{fontSize: '12px'}}>✗</span>
                            Not Uploaded
                          </>
                        )}
                      </div>
                    )}
                    
                    {hasElderAssignment && isFuture && (
                      <div style={{
                        fontSize: '10px', 
                        fontWeight: 700, 
                        color: '#667eea',
                        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                        padding: '7px 14px',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        border: '2px solid #c7d2fe',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)'
                      }}>
                        <span style={{fontSize: '12px'}}>⏰</span>
                        Scheduled
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DailyCareReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedCarelog(null);
            // Refresh data after closing modal
            fetchMonthlyReports(currentMonth, currentYear);
          }}
          onSubmit={handleReportSubmit}
          elderName={selectedCarelog?.elder_name}
          reportDate={selectedCarelog?.date}
          existingReport={selectedCarelog?.existingReport}
          isSubmitting={reportSubmissionLoading}
          isReadOnly={selectedCarelog?.isReadOnly || false}
          isCarelogMode={true}
        />

        {/* Error Modal */}
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Upload Restricted"
          message={errorModalMessage}
          icon="🚫"
        />
      </CaregiverLayout>
    </>
  );
};

export default Carelogs;

