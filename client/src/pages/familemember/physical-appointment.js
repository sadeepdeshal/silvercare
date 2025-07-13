import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  const [dataLoading, setDataLoading] = useState(false);

  // Mock data - replace with actual API calls later
  useEffect(() => {
    // Mock doctor and elder info
    setDoctorInfo({
      name: 'Dr. John Smith',
      specialization: 'Cardiology',
      institution: 'General Hospital',
      district: 'Colombo',
      fee: 2500
    });
    
    setElderInfo({
      name: 'Mary Johnson',
      age: 75,
      district: 'Colombo'
    });
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

  // Generate calendar days for current month
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
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push({
        day,
        date: date.toISOString().split('T')[0],
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission - will implement later
    console.log('Appointment booking data:', {
      elderId,
      doctorId,
      meetingType,
      selectedDate,
      selectedTime,
      appointmentDetails
    });
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
                    <p>📍 {elderInfo.district}</p>
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
                    onClick={() => setSelectedTime(time)}
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

                {/* Summary Section */}
                {selectedDate && selectedTime && (
                  <div className={styles.appointmentSummary}>
                    <h3>📋 Appointment Summary</h3>
                    <div className={styles.summaryContent}>
                      <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {selectedTime}</p>
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
                    disabled={!selectedDate || !selectedTime || !appointmentDetails.patientName}
                  >
                    📅 Book Physical Appointment
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
