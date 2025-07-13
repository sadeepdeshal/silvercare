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
  const [appointmentDetails, setAppointmentDetails] = useState({
    patientName: '',
    contactNumber: '',
    symptoms: '',
    notes: '',
    emergencyContact: ''
  });
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [elderInfo, setElderInfo] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Alternative simple approach for date formatting
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    // Split the date string and create month names array
    const [year, month, day] = dateString.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Create date object and get day of week
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
          
          // Set doctor info
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
          
          // Set elder info
          setElderInfo({
            name: response.elder.name,
            age: response.elder.age,
            district: response.elder.district,
            gender: response.elder.gender,
            contact: response.elder.contact,
            medical_conditions: response.elder.medical_conditions
          });
          
          // Pre-fill form with elder's information
          setAppointmentDetails(prev => ({
            ...prev,
            patientName: response.elder.name,
            contactNumber: response.elder.contact,
            emergencyContact: response.elder.contact // Default to same contact
          }));
          
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

  // FIXED: Generate calendar days for current month without timezone issues
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month - FIXED: Create date string manually to avoid timezone conversion
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date string manually in YYYY-MM-DD format
      const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Create date object for comparison (using local timezone consistently)
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push({
        day,
        date: dateString, // Use manually created string instead of toISOString()
        isToday,
        isPast,
        isWeekend,
        isAvailable: !isPast && !isWeekend
      });
    }
    
    return days;
  };

  // Generate available time slots
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time for the appointment');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Create proper datetime string for Sri Lankan timezone
      const appointmentDateTime = `${selectedDate}T${selectedTime}:00`;
      
      const appointmentData = {
        doctorId: parseInt(doctorId),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        appointmentDateTime: appointmentDateTime,
        appointmentType: 'physical',
        patientName: appointmentDetails.patientName,
        contactNumber: appointmentDetails.contactNumber,
        symptoms: appointmentDetails.symptoms,
        notes: appointmentDetails.notes,
        emergencyContact: appointmentDetails.emergencyContact
      };

      console.log('Submitting appointment data:', appointmentData);
      console.log('Selected date for display:', formatDateForDisplay(selectedDate));
      console.log('Selected time for display:', formatTimeForDisplay(selectedTime));

      const response = await elderApi.createAppointment(elderId, appointmentData);
      
      if (response.success) {
        setSuccessMessage('Physical appointment booked successfully!');
        console.log('Appointment created:', response.appointment);
        
        // Redirect to appointments page after 2 seconds
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
                            setSelectedDate(dayInfo.date);
                            console.log('Calendar day clicked:', dayInfo.day);
                            console.log('Date string created:', dayInfo.date);
                            console.log('Selected date set to:', dayInfo.date);
                            console.log('Formatted for display:', formatDateForDisplay(dayInfo.date));
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
              <div className={styles.timeSlots}>
                {timeSlots.map(time => (
                  <button
                    key={time}
                    className={`${styles.timeSlot} ${
                      selectedTime === time ? styles.selectedTime : ''
                    }`}
                    onClick={() => {
                      setSelectedTime(time);
                      console.log('Selected time:', time);
                      console.log('Formatted for display:', formatTimeForDisplay(time));
                    }}
                    disabled={!selectedDate}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointment Form */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>📝 Appointment Details</h2>
              <form onSubmit={handleSubmit} className={styles.appointmentDetailsForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="patientName">Patient Name</label>
                    <input
                      type="text"
                      id="patientName"
                      name="patientName"
                      value={appointmentDetails.patientName}
                      onChange={handleInputChange}
                      placeholder="Enter patient's full name"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="contactNumber">Contact Number</label>
                    <input
                      type="tel"
                      id="contactNumber"
                      name="contactNumber"
                      value={appointmentDetails.contactNumber}
                      onChange={handleInputChange}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="symptoms">Symptoms / Reason for Visit</label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    value={appointmentDetails.symptoms}
                    onChange={handleInputChange}
                    placeholder="Describe symptoms or reason for the appointment"
                    rows="4"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="emergencyContact">Emergency Contact</label>
                  <input
                    type="tel"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={appointmentDetails.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Emergency contact number"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="notes">Additional Notes (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={appointmentDetails.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information for the doctor"
                    rows="3"
                  />
                </div>

                {/* Summary Section - FIXED DATE DISPLAY WITH ALTERNATIVE APPROACH */}
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

                {/* Submit Button */}
                <div className={styles.submitSection}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={!selectedDate || !selectedTime || !appointmentDetails.patientName || submitting}
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
              </form>
            </div>
          </div>
        </div>
      </FamilyMemberLayout>
    </div>
  );
};

export default PhysicalAppointment;

