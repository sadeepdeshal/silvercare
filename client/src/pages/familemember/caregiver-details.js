import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { caregiverApi } from '../../services/caregiverApi';
import { elderApi } from '../../services/elderApi';
import Navbar from '../../components/navbar';
import FamilyMemberSidebar from '../../components/familymember_sidebar';
import styles from '../../components/css/familymember/caregiver-details.module.css';

const CaregiverDetails = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [caregivers, setCaregivers] = useState([]);
  const [elders, setElders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCertification, setSelectedCertification] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [bookingData, setBookingData] = useState({
    elder_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_hours: 1,
    service_type: '',
    special_instructions: '',
    address: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Sri Lankan districts
  const districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Mullaitivu', 'Vavuniya', 'Puttalam', 'Kurunegala', 'Anuradhapura',
    'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle',
    'Ampara', 'Batticaloa', 'Trincomalee'
  ];

  const serviceTypes = [
    'Personal Care',
    'Medical Care',
    'Companionship',
    'Housekeeping',
    'Meal Preparation',
    'Transportation',
    'Medication Management',
    'Physical Therapy Support'
  ];

  const certificationTypes = [
    'Nursing',
    'First Aid',
    'CPR',
    'Elderly Care',
    'Medical Assistant',
    'Physical Therapy',
    'Mental Health',
    'Nutrition'
  ];

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

  // Fetch caregivers and elders data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.user_id) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        // Fetch both caregivers and elders
        const [caregiversResponse, eldersResponse] = await Promise.all([
          caregiverApi.getAllCaregivers(),
          elderApi.getEldersByFamilyMember(currentUser.user_id)
        ]);
        
        if (caregiversResponse.success) {
          setCaregivers(caregiversResponse.caregivers);
        }
        
        if (eldersResponse.success) {
          setElders(eldersResponse.elders);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load caregivers data');
      } finally {
        setDataLoading(false);
      }
    };

        if (currentUser && currentUser.role === 'family_member') {
      fetchData();
    }
  }, [currentUser]);

  // Handle search
  const handleSearch = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const searchParams = {
        query: searchQuery,
        district: selectedDistrict,
        certifications: selectedCertification
      };
      
      const response = await caregiverApi.searchCaregivers(searchParams);
      
      if (response.success) {
        setCaregivers(response.caregivers);
      }
      
    } catch (err) {
      console.error('Error searching caregivers:', err);
      setError('Failed to search caregivers');
    } finally {
      setDataLoading(false);
    }
  };

  // Reset search
  const handleResetSearch = async () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setSelectedCertification('');
    
    try {
      setDataLoading(true);
      const response = await caregiverApi.getAllCaregivers();
      if (response.success) {
        setCaregivers(response.caregivers);
      }
    } catch (err) {
      console.error('Error resetting search:', err);
      setError('Failed to reset search');
    } finally {
      setDataLoading(false);
    }
  };

  // Handle booking modal
  const handleBookAppointment = (caregiver) => {
    setSelectedCaregiver(caregiver);
    setShowBookingModal(true);
    setBookingData({
      elder_id: '',
      appointment_date: '',
      appointment_time: '',
      duration_hours: 1,
      service_type: '',
      special_instructions: '',
      address: ''
    });
  };

  // Handle booking form submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCaregiver || !currentUser?.user_id) return;
    
    try {
      setBookingLoading(true);
      
      const appointmentData = {
        ...bookingData,
        family_member_id: currentUser.user_id
      };
      
      const response = await caregiverApi.bookCaregiverAppointment(
        selectedCaregiver.caregiver_id,
        appointmentData
      );
      
      if (response.success) {
        alert('Caregiver appointment booked successfully!');
        setShowBookingModal(false);
        setSelectedCaregiver(null);
      }
      
    } catch (err) {
      console.error('Error booking appointment:', err);
      alert(err.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
        <p>Checking authentication...</p>
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
    <div className={styles.caregiverDetailsContainer}>
      <Navbar />
      <FamilyMemberSidebar />
      
      <div className={styles.mainContent}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Find Caregivers</h1>
            <p className={styles.pageSubtitle}>
              Book professional caregivers for your elderly family members
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className={styles.searchSection}>
          <div className={styles.searchCard}>
            <div className={styles.searchGrid}>
              <div className={styles.searchField}>
                <label htmlFor="searchQuery">Search by Name or Certification</label>
                <input
                  type="text"
                  id="searchQuery"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter caregiver name or certification..."
                  className={styles.searchInput}
                />
              </div>
              
              <div className={styles.searchField}>
                <label htmlFor="district">District</label>
                <select
                  id="district"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className={styles.searchSelect}
                >
                  <option value="">All Districts</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              
              <div className={styles.searchField}>
                <label htmlFor="certification">Certification</label>
                <select
                  id="certification"
                  value={selectedCertification}
                  onChange={(e) => setSelectedCertification(e.target.value)}
                  className={styles.searchSelect}
                >
                  <option value="">All Certifications</option>
                  {certificationTypes.map(cert => (
                    <option key={cert} value={cert}>{cert}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className={styles.searchActions}>
              <button 
                onClick={handleSearch}
                className={styles.searchButton}
                disabled={dataLoading}
              >
                {dataLoading ? 'Searching...' : 'Search Caregivers'}
              </button>
              <button 
                onClick={handleResetSearch}
                className={styles.resetButton}
                disabled={dataLoading}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Caregivers List */}
        <div className={styles.caregiversSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Available Caregivers</h2>
            <span className={styles.caregiverCount}>
              {caregivers.length} caregiver{caregivers.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {dataLoading ? (
            <div className={styles.loadingContent}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading caregivers...</p>
            </div>
          ) : caregivers.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🧑‍💼</div>
              <h3>No Caregivers Found</h3>
              <p>No caregivers match your search criteria. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className={styles.caregiversGrid}>
              {caregivers.map((caregiver) => (
                <div key={caregiver.caregiver_id} className={styles.caregiverCard}>
                  <div className={styles.caregiverHeader}>
                    <div className={styles.caregiverAvatar}>
                      <div className={styles.caregiverInitial}>
                        {caregiver.caregiver_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className={styles.caregiverInfo}>
                      <h3 className={styles.caregiverName}>{caregiver.caregiver_name}</h3>
                      <p className={styles.caregiverCertifications}>
                        {caregiver.certifications || 'General Care'}
                      </p>
                      <div className={styles.caregiverMeta}>
                        <span className={styles.location}>
                          📍 {caregiver.district}
                        </span>
                        <span className={styles.availability}>
                          ✅ {caregiver.availability}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.caregiverDetails}>
                    <div className={styles.contactInfo}>
                      <p className={styles.contactItem}>
                        📧 {caregiver.caregiver_email}
                      </p>
                      <p className={styles.contactItem}>
                        📞 {caregiver.caregiver_phone}
                      </p>
                      {caregiver.fixed_line && (
                        <p className={styles.contactItem}>
                          ☎️ {caregiver.fixed_line}
                        </p>
                      )}
                    </div>

                    {caregiver.certifications && (
                      <div className={styles.certificationsSection}>
                        <h4>Certifications:</h4>
                        <p className={styles.certificationsText}>
                          {caregiver.certifications}
                        </p>
                      </div>
                    )}

                    <div className={styles.availabilityStatus}>
                      <span className={`${styles.statusBadge} ${styles[caregiver.availability]}`}>
                        {caregiver.availability === 'available' ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.caregiverActions}>
                    <button 
                      className={styles.appointmentButton}
                      onClick={() => handleBookAppointment(caregiver)}
                      disabled={caregiver.availability !== 'available'}
                    >
                      📅 Book Appointment
                    </button>
                    <button 
                      className={styles.viewProfileButton}
                      onClick={() => navigate(`/family-member/caregiver/${caregiver.caregiver_id}`)}
                    >
                      👁️ View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedCaregiver && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Book Appointment with {selectedCaregiver.caregiver_name}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowBookingModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className={styles.bookingForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="elder_id">Select Elder *</label>
                  <select
                    id="elder_id"
                    value={bookingData.elder_id}
                    onChange={(e) => setBookingData({...bookingData, elder_id: e.target.value})}
                    required
                    className={styles.formSelect}
                  >
                    <option value="">Choose an elder...</option>
                    {elders.map(elder => (
                      <option key={elder.elder_id} value={elder.elder_id}>
                        {elder.name} - {elder.contact}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="service_type">Service Type *</label>
                  <select
                    id="service_type"
                    value={bookingData.service_type}
                    onChange={(e) => setBookingData({...bookingData, service_type: e.target.value})}
                    required
                    className={styles.formSelect}
                  >
                    <option value="">Choose service type...</option>
                    {serviceTypes.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="appointment_date">Appointment Date *</label>
                  <input
                    type="date"
                    id="appointment_date"
                    value={bookingData.appointment_date}
                    onChange={(e) => setBookingData({...bookingData, appointment_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="appointment_time">Appointment Time *</label>
                  <input
                    type="time"
                    id="appointment_time"
                    value={bookingData.appointment_time}
                    onChange={(e) => setBookingData({...bookingData, appointment_time: e.target.value})}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="duration_hours">Duration (Hours) *</label>
                  <select
                    id="duration_hours"
                    value={bookingData.duration_hours}
                    onChange={(e) => setBookingData({...bookingData, duration_hours: parseInt(e.target.value)})}
                    required
                    className={styles.formSelect}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(hour => (
                      <option key={hour} value={hour}>{hour} hour{hour > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="address">Service Address</label>
                  <input
                    type="text"
                    id="address"
                    value={bookingData.address}
                    onChange={(e) => setBookingData({...bookingData, address: e.target.value})}
                    placeholder="Enter service address (optional)"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="special_instructions">Special Instructions</label>
                <textarea
                  id="special_instructions"
                  value={bookingData.special_instructions}
                  onChange={(e) => setBookingData({...bookingData, special_instructions: e.target.value})}
                  placeholder="Any special instructions or requirements..."
                  rows="3"
                  className={styles.formTextarea}
                />
              </div>

              {/* Caregiver Info Summary */}
              <div className={styles.caregiverSummary}>
                <h4>Caregiver Information:</h4>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span>Name:</span>
                    <span>{selectedCaregiver.caregiver_name}</span>
                                      </div>
                  <div className={styles.summaryItem}>
                    <span>District:</span>
                    <span>{selectedCaregiver.district}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Phone:</span>
                    <span>{selectedCaregiver.caregiver_phone}</span>
                  </div>
                  {selectedCaregiver.fixed_line && (
                    <div className={styles.summaryItem}>
                      <span>Fixed Line:</span>
                      <span>{selectedCaregiver.fixed_line}</span>
                    </div>
                  )}
                  <div className={styles.summaryItem}>
                    <span>Certifications:</span>
                    <span>{selectedCaregiver.certifications || 'General Care'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className={styles.cancelButton}
                  disabled={bookingLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={styles.bookButton}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverDetails;
