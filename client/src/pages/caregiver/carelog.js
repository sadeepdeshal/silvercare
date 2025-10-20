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
          <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 60, border: '6px solid #e2e8f0', borderTop: '6px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 24 }} />
            <p style={{ color: '#667eea', fontSize: 20, fontWeight: 500 }}>Loading carelogs...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  // Get calendar days
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
  const calendarDays = [];
  
  // Add empty cells for days before the first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <>
      <Navbar />
      <CaregiverLayout>
        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
          {/* Header */}
          <div style={{ 
            marginBottom: '32px', 
            padding: '32px', 
            background: 'white', 
            borderRadius: '20px', 
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.10)',
            textAlign: 'center'
          }}>
            <h1 style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 12,
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#2b4c7e',
              margin: 0,
              marginBottom: '8px'
            }}>
              <span role="img" aria-label="Carelogs" style={{fontSize: '3rem'}}>📝</span> 
              Care Logs Calendar
            </h1>
            <p style={{
              color: '#718096',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Track and manage your daily care reports with elder assignments
            </p>
          </div>

          {/* Month Navigation */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button 
              onClick={goToPreviousMonth}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ← Previous Month
            </button>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              color: '#2b4c7e',
              margin: 0
            }}>
              {months[currentMonth]} {currentYear}
            </h2>
            <button 
              onClick={goToNextMonth}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Next Month →
            </button>
          </div>

          {/* Calendar */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.10)'
          }}>
            {/* Day Headers */}
            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '16px', 
              marginBottom: '20px'
            }}>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#4a5568',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px'}}>
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
                      background: isToday ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : '#ffffff',
                      border: isToday ? '3px solid #10b981' : '2px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '20px 16px',
                      cursor: hasElderAssignment ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      minHeight: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: isToday ? '0 4px 16px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      opacity: hasElderAssignment ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (hasElderAssignment) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasElderAssignment) {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = isToday ? '0 4px 16px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)';
                      }
                    }}
                  >
                    {isToday && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '12px'
                      }}>
                        TODAY
                      </div>
                    )}
                    
                    <div style={{
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: '#4a5568', 
                      marginBottom: '8px',
                      textTransform: 'uppercase'
                    }}>
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][targetDate.getDay()]}
                    </div>
                    
                    <div style={{
                      fontSize: '28px', 
                      fontWeight: 700, 
                      color: isToday ? '#065f46' : '#2d3748',
                      marginBottom: '12px'
                    }}>
                      {day}
                    </div>
                    
                    <div style={{
                      fontSize: '12px', 
                      color: '#718096', 
                      marginBottom: '12px',
                      fontWeight: 500,
                      lineHeight: '1.3'
                    }}>
                      {dayReport && dayReport.elder_name && dayReport.elder_name !== 'No care today' ? (
                        <span style={{color: '#4a5568', fontWeight: 600}}>{dayReport.elder_name}</span>
                      ) : (
                        <span style={{color: '#a0aec0', fontStyle: 'italic'}}>No care today</span>
                      )}
                    </div>
                    
                    {shouldShowStatus && (
                      <div style={{
                        fontSize: '11px', 
                        fontWeight: 600, 
                        color: hasReport ? '#065f46' : '#dc2626',
                        backgroundColor: hasReport ? '#d1fae5' : '#fee2e2',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        border: hasReport ? '1px solid #10b981' : '1px solid #f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {hasReport ? (
                          <>
                            <span style={{fontSize: '10px'}}>📤</span>
                            Uploaded
                          </>
                        ) : (
                          <>
                            <span style={{fontSize: '10px'}}>⚠️</span>
                            Not Uploaded
                          </>
                        )}
                      </div>
                    )}
                    
                    {hasElderAssignment && isFuture && (
                      <div style={{
                        fontSize: '11px', 
                        fontWeight: 500, 
                        color: '#6b7280',
                        backgroundColor: '#f9fafb',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        border: '1px solid #d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{fontSize: '10px'}}>⏳</span>
                        Future care
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
