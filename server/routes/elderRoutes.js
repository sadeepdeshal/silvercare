const express = require('express');
const router = express.Router();
const { getEldersByFamilyMember, getElderCount } = require('../controllers/elderController');

// Get all elders for a specific family member
router.get('/family-member/:familyMemberId', getEldersByFamilyMember);

// Get elder count for a specific family member
router.get('/count/:familyMemberId', getElderCount);

module.exports = router;
