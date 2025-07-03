const express = require('express');
const router = express.Router();
const {
  createFamilyMemberRegistration,
  createCaregiverRegistration,
  createDoctorRegistration,
  createHealthProfessionalRegistration,
  createElderRegistration,
  getRegistrations,
  getEldersByFamilyMember,
  getElderById,
  updateElderById
} = require('../controllers/registerController');

// General registration routes
router.get('/', getRegistrations);
router.post('/family-member', createFamilyMemberRegistration);
router.post('/caregiver', createCaregiverRegistration);
router.post('/doctor', createDoctorRegistration);
router.post('/health-professional', createHealthProfessionalRegistration);
router.post('/elder', createElderRegistration);

// Elder-specific routes
router.get('/elders/family-member/:familyMemberId', getEldersByFamilyMember);
router.get('/elders/:elderId', getElderById);
router.put('/elders/:elderId', updateElderById);

module.exports = router;
