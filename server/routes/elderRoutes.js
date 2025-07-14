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
  createAppointment,        // Add this import
  getElderAppointments,      // Add this import
  getUpcomingAppointmentsByFamily,  // Add this import
  getAppointmentCountByFamily       // Add this import
} = require('../controllers/elderController');

const { 
  getElderDetails,
  getUpcomingAppointments,
  getPastAppointments,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment
} = require('../controllers/elder');

// Get all elders for a specific family member
router.get('/family-member/:familyMemberId', getEldersByFamilyMember);

// Get elder count for a specific family member
router.get('/count/:familyMemberId', getElderCount);
router.get('/family-member/:familyMemberId/appointments/upcoming', getUpcomingAppointmentsByFamily);

// Get appointment count for a family member - ADD THIS ROUTE
router.get('/family-member/:familyMemberId/appointments/count', getAppointmentCountByFamily);

// Fetch elder details - MUST BE BEFORE /:elderId route
router.get('/elderDetails', getElderDetails);

// Get appointment booking info (both elder and doctor) - MUST BE BEFORE /:elderId route
router.get('/:elderId/appointment-booking/:doctorId', getAppointmentBookingInfo);

// Get doctor info by ID - MUST BE BEFORE /:elderId route
router.get('/doctor/:doctorId', getDoctorById);

// Get doctors by elder's district for physical meetings - MUST BE BEFORE /:elderId route
router.get('/:elderId/doctors', getDoctorsByElderDistrict);

// Get all doctors for online meetings - MUST BE BEFORE /:elderId route
router.get('/:elderId/doctors/online', getAllDoctorsForOnlineMeeting);

// Create new appointment - MUST BE BEFORE /:elderId route
router.post('/:elderId/appointments', createAppointment);

// Get elder appointments - MUST BE BEFORE /:elderId route
router.get('/:elderId/appointments', getElderAppointments);

// Appointment routes for elders - MUST BE BEFORE /:elderId route
router.get('/:elderId/appointments/upcoming', getUpcomingAppointments);
router.get('/:elderId/appointments/past', getPastAppointments);
router.get('/:elderId/appointments/:appointmentId', getAppointmentById);
router.get('/:elderId/appointments', getAllAppointments);
router.put('/:elderId/appointments/:appointmentId/cancel', cancelAppointment);
router.put('/:elderId/appointments/:appointmentId/reschedule', rescheduleAppointment);

// Get specific elder by ID
router.get('/:elderId', getElderById);

// Update elder details
router.put('/:elderId', updateElder);

// Create new elder
router.post('/', createElder);

module.exports = router;
