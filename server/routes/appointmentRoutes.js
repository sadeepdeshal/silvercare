const express = require('express');
const router = express.Router();
const {
  getAllAppointmentsByFamily,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentStats
} = require('../controllers/appointmentController');

// Get all appointments for a family member with filters
router.get('/family-member/:familyMemberId', getAllAppointmentsByFamily);

// Get appointment statistics for a family member
router.get('/family-member/:familyMemberId/stats', getAppointmentStats);

// Get specific appointment by ID
router.get('/:appointmentId', getAppointmentById);

// Update appointment status
router.put('/:appointmentId/status', updateAppointmentStatus);

// Cancel appointment
router.put('/:appointmentId/cancel', cancelAppointment);

module.exports = router;
