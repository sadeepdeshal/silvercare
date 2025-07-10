const express = require('express');
const router = express.Router();
const { getAdminDashboard, approveProfessional, rejectProfessional } = require('../controllers/adminController');

// Admin dashboard route
router.get('/dashboard', getAdminDashboard);

// Professional approval routes
router.put('/approve/:type/:id', approveProfessional);
router.put('/reject/:type/:id', rejectProfessional);

module.exports = router;