const express = require('express');
const router = express.Router();
const {
  createFamilyMemberRegistration,
  createCaregiverRegistration,
  createDoctorRegistration,
  createHealthProfessionalRegistration,
  createElderRegistration,
  getRegistrations
} = require('../controllers/registerController');

router.get('/', getRegistrations);
router.post('/family-member', createFamilyMemberRegistration);
router.post('/caregiver', createCaregiverRegistration);
router.post('/doctor', createDoctorRegistration);
router.post('/health-professional', createHealthProfessionalRegistration);
router.post('/elder', createElderRegistration);

module.exports = router;
