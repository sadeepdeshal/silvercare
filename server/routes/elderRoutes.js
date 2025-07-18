const express = require('express');
const router = express.Router();
const { 
  getEldersByFamilyMember, 
  getElderCount, 
  getElderById, 
  updateElder,
  createElder,
  getDoctorsByElderDistrict,
  getAllDoctorsForOnlineMeeting,
  getDoctorById,
  getAppointmentBookingInfo,
  createAppointment,
  getElderAppointments,
  getUpcomingAppointmentsByFamily,
  getAppointmentCountByFamily,

  getBlockedTimeSlots ,// Add this import
   createTemporaryBooking,
  confirmPaymentAndCreateAppointment,
  cancelTemporaryBooking,
  cleanupExpiredBookings

 

} = require('../controllers/elderController');

const { 
  getElderDetails,
  updateElderProfile,
  upload,
  getElderDashboardStats,
  getUpcomingAppointments,
  getPastAppointments,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  joinAppointment // Replace rescheduleAppointment with joinAppointment
} = require('../controllers/elder');

// Get all elders for a specific family member
router.get('/family-member/:familyMemberId', getEldersByFamilyMember);

// Get elder count for a specific family member
router.get('/count/:familyMemberId', getElderCount);
router.get('/family-member/:familyMemberId/appointments/upcoming', getUpcomingAppointmentsByFamily);

// Get appointment count for a family member
router.get('/family-member/:familyMemberId/appointments/count', getAppointmentCountByFamily);

// Fetch elder details - MUST BE BEFORE /:elderId route
router.get('/elderDetails', getElderDetails);

// Get blocked time slots for a doctor on a specific date - MUST BE BEFORE /:elderId route
router.get('/doctor/:doctorId/blocked-slots/:date', getBlockedTimeSlots);

// Get appointment booking info (both elder and doctor) - MUST BE BEFORE /:elderId route
router.get('/:elderId/appointment-booking/:doctorId', getAppointmentBookingInfo);

// Get doctor info by ID - MUST BE BEFORE /:elderId route
router.get('/doctor/:doctorId', getDoctorById);

// Get doctors by elder's district for physical meetings - MUST BE BEFORE /:elderId route
router.get('/:elderId/doctors', getDoctorsByElderDistrict);

// Get all doctors for online meetings - MUST BE BEFORE /:elderId route
router.get('/:elderId/doctors/online', getAllDoctorsForOnlineMeeting);

// Get dashboard stats for an elder - MUST BE BEFORE /:elderId route
router.get('/:elderId/dashboard-stats', getElderDashboardStats);

// Update elder profile with file upload - MUST BE BEFORE /:elderId route
router.put('/:elderId/profile', upload.single('profile_photo'), updateElderProfile);

// Create new appointment - MUST BE BEFORE /:elderId route
router.post('/:elderId/appointments', createAppointment);

// Get elder appointments - MUST BE BEFORE /:elderId route
router.get('/:elderId/appointments', getElderAppointments);

// Appointment routes for elders - MUST BE BEFORE /:elderId route
router.get('/:elderId/appointments/upcoming', getUpcomingAppointments);
router.get('/:elderId/appointments/past', getPastAppointments);
router.get('/:elderId/appointments/:appointmentId', getAppointmentById);
router.put('/:elderId/appointments/:appointmentId/cancel', cancelAppointment);
router.post('/:elderId/appointments/:appointmentId/join', joinAppointment); // Replace reschedule with join

// Get specific elder by ID
router.get('/:elderId', getElderById);

// Update elder details
router.put('/:elderId', updateElder);

// Create new elder
router.post('/', createElder);

// Temporary booking routes - MUST BE BEFORE /:elderId route
router.post('/:elderId/temporary-booking', createTemporaryBooking);
router.post('/:elderId/confirm-payment', confirmPaymentAndCreateAppointment);
router.delete('/temporary-booking/:tempBookingId', cancelTemporaryBooking);

// Cleanup route (for maintenance)
router.delete('/cleanup-expired-bookings', cleanupExpiredBookings);

module.exports = router;

