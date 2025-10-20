const express = require('express');
const router = express.Router();
const healthProfessionalController = require('../controllers/healthProfessionalController');
const { 
  getEldersWithAppointments,
  getAppointmentHistoryWithElder
} = require('../controllers/counselorElderChatController');

// GET /api/healthprofessional/user/:userId
router.get('/user/:userId', healthProfessionalController.getByUserId);

// GET /api/healthprofessional/:counselorId/appointment-statistics
router.get('/:counselorId/appointment-statistics', healthProfessionalController.getAppointmentStatistics);

// Get elders with appointments for chat (counselor perspective) - MUST BE BEFORE /:counselorId route
router.get('/:counselorId/elders-with-appointments', getEldersWithAppointments);
router.get('/:counselorId/elder/:elderId/appointments', getAppointmentHistoryWithElder);

module.exports = router; 