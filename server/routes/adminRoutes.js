const express = require('express');
const router = express.Router();
const { 
  getAdminDashboard, 
  approveProfessional, 
  rejectProfessional,
  getAllUsers 
} = require('../controllers/adminController');

// Get admin dashboard data
router.get('/dashboard', getAdminDashboard);

// Approve professional (doctor or health professional)
router.put('/approve/:type/:professionalId', approveProfessional);

// Reject professional (doctor or health professional)
router.put('/reject/:type/:professionalId', rejectProfessional);

// Get all users
router.get('/users', getAllUsers);

module.exports = router;