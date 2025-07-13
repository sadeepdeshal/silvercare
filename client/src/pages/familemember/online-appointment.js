import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberLayout from '../../components/FamilyMemberLayout';
import styles from '../../components/css/familymember/online-appointment.module.css';

const OnlineAppointment = () => {
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
    emergencyContact: '',
    preferredPlatform: 'zoom'
  });
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [elderInfo, setElderInfo] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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
            fee: response.doctor.online_fee,
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
      
      days.push({
        day,
        date: date.toISOString().split('T')[0],
        isToday,
        isPast,
        isAvailable: !isPast // Online appointments available all days
      });
    }
    
    return days;
  };

  // Generate available time slots for online appointments
  const generateTimeSlots = () => {
    const slots = [];
    // Extended hours for online appointments (8 AM - 8 PM)
    for (let hour = 8; hour < 20; hour++) {
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
      
      const appointmentData = {
        doctorId: parseInt(doctorId),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        appointmentType: 'online',
        patientName: appointmentDetails.patientName,
        contactNumber: appointmentDetails.contactNumber,
        symptoms: appointmentDetails.symptoms,
        notes: appointmentDetails.notes,
        emergencyContact: appointmentDetails.emergencyContact,
        preferredPlatform: appointmentDetails.preferredPlatform
      };

      console.log('Submitting appointment data:', appointmentData);

      const response = await elderApi.createAppointment(elderId, appointmentData);
      
      if (response.success) {
        setSuccessMessage('Online appointment booked successfully!');
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
                💻 Book Online Appointment
              </h1>
              <p className={styles.subtitle}>
                Schedule a video consultation (1 hour duration)
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
                    <p>🌐 {doctorInfo.district}</p>
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
                <p><strong>Meeting Type:</strong> Online</p>
                <p><strong>Duration:</strong> 1 hour</p>
                <p><strong>Consultation Fee:</strong> Rs. {doctorInfo?.fee || 1800}</p>
                <p><strong>Platform:</strong> Video Call</p>
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

                <div className={styles.formRow}>
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
                    <label htmlFor="preferredPlatform">Preferred Platform</label>
                    <select
                      id="preferredPlatform"
                      name="preferredPlatform"
                      value={appointmentDetails.preferredPlatform}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="zoom">Zoom</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="meet">Google Meet</option>
                      <option value="whatsapp">WhatsApp Video</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="symptoms">Symptoms / Reason for Visit</label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    value={appointmentDetails.symptoms}
                    onChange={handleInputChange}
                    placeholder="Describe symptoms or reason for the online consultation"
                    rows="4"
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
                    placeholder="Any additional information for the doctor (medical history, current medications, etc.)"
                    rows="3"
                  />
                </div>

                {/* Online Meeting Requirements */}
                <div className={styles.requirementsSection}>
                  <h3>📋 Online Meeting Requirements</h3>
                  <div className={styles.requirements}>
                    <div className={styles.requirement}>
                      <span className={styles.requirementIcon}>💻</span>
                      <span>Stable internet connection</span>
                    </div>
                    <div className={styles.requirement}>
                      <span className={styles.requirementIcon}>📹</span>
                      <span>Working camera and microphone</span>
                    </div>
                    <div className={styles.requirement}>
                      <span className={styles.requirementIcon}>🔇</span>
                      <span>Quiet environment for consultation</span>
                    </div>
                    <div className={styles.requirement}>
                      <span className={styles.requirementIcon}>📱</span>
                      <span>Backup contact number available</span>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                {selectedDate && selectedTime && (
                  <div className={styles.appointmentSummary}>
                    <h3>📋 Appointment Summary</h3>
                    <div className={styles.summaryContent}>
                      <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {selectedTime}</p>
                      <p><strong>Duration:</strong> 1 hour</p>
                      <p><strong>Type:</strong> Online Meeting</p>
                      <p><strong>Platform:</strong> {appointmentDetails.preferredPlatform}</p>
                      <p><strong>Fee:</strong> Rs. {doctorInfo?.fee || 1800}</p>
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
                      '💻 Book Online Appointment'
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

export default OnlineAppointment;

