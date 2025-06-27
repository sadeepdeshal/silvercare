const express = require('express');
const router = express.Router();
const {
  createFamilyMemberRegistration,
  createCaregiverRegistration,
  createDoctorRegistration,
  getRegistrations
} = require('../controllers/registerController');

router.get('/', getRegistrations);
router.post('/family-member', createFamilyMemberRegistration);
router.post('/caregiver', createCaregiverRegistration);
router.post('/doctor', createDoctorRegistration);

module.exports = router;
