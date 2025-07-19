const express = require('express');
const router = express.Router();
const {
  getAllAppointmentsByFamily,
  getUpcomingAppointmentsByFamily,
  getAppointmentCountByFamily,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentStats
} = require('../controllers/appointmentController');

// Get all confirmed appointments for a family member (with cancellation info)
router.get('/family/:familyMemberId', getAllAppointmentsByFamily);

// Get upcoming confirmed appointments for dashboard
router.get('/family/:familyMemberId/upcoming', getUpcomingAppointmentsByFamily);

// Get confirmed appointment count for dashboard
router.get('/family/:familyMemberId/count', getAppointmentCountByFamily);

// Get appointment statistics (with enhanced info)
router.get('/family/:familyMemberId/stats', getAppointmentStats);

// Get specific appointment by ID
router.get('/:appointmentId', getAppointmentById);

// Update appointment status
router.put('/:appointmentId/status', updateAppointmentStatus);

// Cancel appointment with refund processing
router.put('/:appointmentId/cancel', cancelAppointment);

module.exports = router;
