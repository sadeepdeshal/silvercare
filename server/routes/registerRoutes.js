const express = require('express');
const router = express.Router();
const {
  createFamilyMemberRegistration,
  createCaregiverRegistration,
  getRegistrations
} = require('../controllers/registerController');

router.get('/', getRegistrations);
router.post('/family-member', createFamilyMemberRegistration);
router.post('/caregiver', createCaregiverRegistration);

module.exports = router;
