import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/physical-appointment.module.css';

const PhysicalAppointment = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { elderId, doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const meetingType = searchParams.get('meetingType');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [elderInfo, setElderInfo] = useState(null);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Alternative simple approach for date formatting
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

  // Alternative simple approach for time formatting
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHour = hour12 === 0 ? 12 : hour12;
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Fetch appointment booking info from backend
  useEffect(() => {
    const fetchAppointmentInfo = async () => {
      if (!elderId || !doctorId) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        console.log('Fetching appointment booking info for elder:', elderId, 'doctor:', doctorId);
        
        const response = await elderApi.getAppointmentBookingInfo(elderId, doctorId);
        
        if (response.success) {
          console.log('Appointment booking info received:', response);
          
          setDoctorInfo({
            name: `Dr. ${response.doctor.name}`,
            specialization: response.doctor.specialization,
            institution: response.doctor.institution,
            district: response.doctor.district,
            fee: response.doctor.physical_fee,
            email: response.doctor.email,
            phone: response.doctor.phone,
            years_experience: response.doctor.years_experience
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
          throw new Error(response.error || 'Failed to fetch appointment information');
        }
        
      } catch (err) {
        console.error('Error fetching appointment info:', err);
        setError(err.message || 'Failed to load appointment information');
      } finally {
        setDataLoading(false);
      }
    };

    fetchAppointmentInfo();
  }, [elderId, doctorId]);

  // Fetch blocked time slots when date is selected
  // Update the fetchBlockedSlots useEffect
useEffect(() => {
  const fetchBlockedSlots = async () => {
    if (!selectedDate || !doctorId) return;
    
    try {
      console.log('Fetching blocked slots for doctor:', doctorId, 'date:', selectedDate, 'type: physical');
      
      const response = await elderApi.getBlockedTimeSlots(doctorId, selectedDate, 'physical');
      
      if (response.success) {
        console.log('Blocked slots received:', response.blockedSlots);
        console.log('Appointment details:', response.appointmentDetails);
        setBlockedSlots(response.blockedSlots || []);
      } else {
        console.error('Failed to fetch blocked slots:', response.error);
        setBlockedSlots([]);
      }
      
    } catch (err) {
      console.error('Error fetching blocked slots:', err);
      setBlockedSlots([]);
    }
  };

  fetchBlockedSlots();
}, [selectedDate, doctorId]);


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

  // Generate calendar days for current month without timezone issues
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push({
        day,
        date: dateString,
        isToday,
        isPast,
        isWeekend,
        isAvailable: !isPast && !isWeekend
      });
    }
    
    return days;
  };

  // Generate available time slots for physical appointments (2 hour duration)
  const generateTimeSlots = () => {
    const slots = [];
    // Morning slots (9 AM - 12 PM)
    for (let hour = 9; hour < 12; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    // Afternoon slots (2 PM - 5 PM)
    for (let hour = 14; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Check if a time slot is blocked
  const isTimeSlotBlocked = (timeSlot) => {
    return blockedSlots.includes(timeSlot);
  };

  const handleDateSelection = (dateString) => {
    setSelectedDate(dateString);
    setSelectedTime(''); // Reset selected time when date changes
    console.log('Calendar day clicked, date set to:', dateString);
  };

  const handleTimeSelection = (time) => {
    if (!isTimeSlotBlocked(time)) {
      setSelectedTime(time);
      console.log('Selected time:', time);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time for the appointment');
      return;
    }

    if (isTimeSlotBlocked(selectedTime)) {
      setError('Selected time slot is not available. Please choose a different time.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
            const appointmentData = {
        doctorId: parseInt(doctorId),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        appointmentType: 'physical',
        patientName: elderInfo.name,
        contactNumber: elderInfo.contact,
        symptoms: 'Physical consultation requested',
        notes: 'Booked through physical appointment system',
        emergencyContact: elderInfo.contact
      };

      console.log('Submitting appointment data:', appointmentData);

      const response = await elderApi.createAppointment(elderId, appointmentData);
      
      if (response.success) {
        setSuccessMessage('Physical appointment booked successfully!');
        console.log('Appointment created:', response.appointment);
        
        setTimeout(() => {
          navigate(`/family-member/elder/${elderId}/appointments`);
        }, 2000);
      } else {
        throw new Error(response.error || 'Failed to book appointment');
      }
      
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calendarDays = generateCalendarDays();
  const timeSlots = generateTimeSlots();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

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

  // Show loading while fetching appointment data
  if (dataLoading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h2>Loading appointment information...</h2>
            </div>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  // Show error if failed to load data
  if (error && !doctorInfo) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.errorContainer}>
              <h2>Error Loading Appointment Information</h2>
              <p>{error}</p>
              <button 
                className={styles.retryButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
              <button 
                className={styles.backButton}
                onClick={() => navigate(`/family-member/elder/${elderId}/doctors`)}
              >
                ← Back to Doctors
              </button>
            </div>
          </div>
        </FamilyMemberLayout>
      </div>
    );
  }

  // Show success message
  if (successMessage) {
    return (
      <div className={styles.container}>
        <Navbar />
        <FamilyMemberLayout>
          <div className={styles.content}>
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>✅</div>
              <h2>Appointment Booked Successfully!</h2>
              <p>{successMessage}</p>
              <p>Redirecting to appointments page...</p>
              <div className={styles.loadingSpinner}></div>
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
                🏥 Book Physical Appointment
              </h1>
              <p className={styles.subtitle}>
                Schedule an in-person consultation (2 hours duration)
              </p>
            </div>
            <button 
              className={styles.backButton}
              onClick={() => navigate(`/family-member/elder/${elderId}/doctors`)}
            >
              ← Back to Doctors
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {/* Appointment Info Cards */}
          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>👨‍⚕️</div>
              <div className={styles.cardContent}>
                <h3>Doctor Information</h3>
                {doctorInfo && (
                  <>
                    <p><strong>{doctorInfo.name}</strong></p>
                    <p>{doctorInfo.specialization}</p>
                    <p>{doctorInfo.institution}</p>
                    <p>📍 {doctorInfo.district}</p>
                    <p>📞 {doctorInfo.phone}</p>
                    <p>📧 {doctorInfo.email}</p>
                    <p>🎓 {doctorInfo.years_experience} years experience</p>
                  </>
                )}
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>👴</div>
              <div className={styles.cardContent}>
                <h3>Patient Information</h3>
                {elderInfo && (
                  <>
                    <p><strong>{elderInfo.name}</strong></p>
                    <p>Age: {elderInfo.age} years</p>
                    <p>Gender: {elderInfo.gender}</p>
                    <p>📍 {elderInfo.district}</p>
                    <p>📞 {elderInfo.contact}</p>
                    {elderInfo.medical_conditions && (
                      <p><strong>Medical Conditions:</strong> {elderInfo.medical_conditions}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>💰</div>
              <div className={styles.cardContent}>
                <h3>Appointment Details</h3>
                <p><strong>Meeting Type:</strong> Physical</p>
                <p><strong>Duration:</strong> 2 hours</p>
                <p><strong>Consultation Fee:</strong> Rs. {doctorInfo?.fee || 2500}</p>
              </div>
            </div>
          </div>

          <div className={styles.appointmentForm}>
            {/* Calendar Section */}
            <div className={styles.calendarSection}>
              <h2 className={styles.sectionTitle}>📅 Select Date</h2>
              <div className={styles.calendarContainer}>
                <div className={styles.calendarHeader}>
                  <h3>{currentMonth} {currentYear}</h3>
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
                            dayInfo.isToday ? styles.today :
                            dayInfo.isPast ? styles.pastDay :
                            dayInfo.isWeekend ? styles.weekend :
                            dayInfo.date === selectedDate ? styles.selected :
                            styles.available
                          ) : styles.empty
                        }`}
                        onClick={() => {
                          if (dayInfo && dayInfo.isAvailable) {
                            handleDateSelection(dayInfo.date);
                          }
                        }}
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
                    <div className={styles.legendColor + ' ' + styles.weekendColor}></div>
                    <span>Weekend</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor + ' ' + styles.pastColor}></div>
                    <span>Past</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Selection */}
            <div className={styles.timeSection}>
              <h2 className={styles.sectionTitle}>🕐 Select Time</h2>
              {selectedDate && blockedSlots.length > 0 && (
                <div className={styles.blockedSlotsInfo}>
                  <p className={styles.infoText}>
                    ⚠️ Some time slots are unavailable due to existing appointments (2-hour blocks for physical appointments)
                  </p>
                </div>
              )}
              <div className={styles.timeSlots}>
                {timeSlots.map(time => {
                  const isBlocked = isTimeSlotBlocked(time);
                  return (
                    <button
                      key={time}
                      className={`${styles.timeSlot} ${
                        selectedTime === time ? styles.selectedTime : ''
                      } ${isBlocked ? styles.blockedTime : ''}`}
                      onClick={() => handleTimeSelection(time)}
                      disabled={!selectedDate || isBlocked}
                      title={isBlocked ? 'This time slot is not available (conflicts with existing appointment)' : ''}
                    >
                      {time}
                      {isBlocked && <span className={styles.blockedIcon}>🚫</span>}
                    </button>
                  );
                })}
              </div>
              <div className={styles.timeSlotLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor + ' ' + styles.availableTimeColor}></div>
                  <span>Available</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor + ' ' + styles.selectedTimeColor}></div>
                  <span>Selected</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor + ' ' + styles.blockedTimeColor}></div>
                  <span>Blocked</span>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            {selectedDate && selectedTime && (
              <div className={styles.appointmentSummary}>
                <h3>📋 Appointment Summary</h3>
                <div className={styles.summaryContent}>
                  <p><strong>Date:</strong> {formatDateForDisplay(selectedDate)}</p>
                  <p><strong>Time:</strong> {formatTimeForDisplay(selectedTime)}</p>
                  <p><strong>Duration:</strong> 2 hours</p>
                  <p><strong>Type:</strong> Physical Meeting</p>
                  <p><strong>Fee:</strong> Rs. {doctorInfo?.fee || 2500}</p>
                </div>
              </div>
            )}

            {/* Book Button */}
            <div className={styles.submitSection}>
              <button
                className={styles.submitButton}
                onClick={handleBookAppointment}
                disabled={!selectedDate || !selectedTime || submitting || isTimeSlotBlocked(selectedTime)}
              >
                {submitting ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    Booking Appointment...
                  </>
                ) : (
                  '📅 Book Physical Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default PhysicalAppointment;

