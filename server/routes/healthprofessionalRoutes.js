const express = require('express');
const router = express.Router();
const path = require('path');
const healthProfessionalController = require('../controllers/healthProfessionalController');

// Serve static files from the uploads directory
router.get('/uploads', express.static(path.join(__dirname, 'uploads')));

// GET /api/healthprofessional/user/:userId
router.get('/user/:userId', healthProfessionalController.getByUserId);

// GET /api/healthprofessional/counselors/:counselorId/elders
router.get('/counselors/:counselorId/elders', healthProfessionalController.getAssignedEldersForCounselor);

// GET /api/healthprofessional/counselors/:counselorId/sessions
router.get('/counselors/:counselorId/sessions', healthProfessionalController.getSessionsForCounselor);

// GET /api/healthprofessional/counselor-id/:userId
router.get('/counselor-id/:userId', healthProfessionalController.getCounselorIdByUserId);

module.exports = router;