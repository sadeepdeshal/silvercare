const express = require('express');
const router = express.Router();
const { 
  getEldersByFamilyMember, 
  getElderCount, 
  getElderById, 
  updateElder,
  createElder 
} = require('../controllers/elderController');

const { getElderDetails } = require('../controllers/elder');

// Get all elders for a specific family member
router.get('/family-member/:familyMemberId', getEldersByFamilyMember);

// Get elder count for a specific family member
router.get('/count/:familyMemberId', getElderCount);

// Fetch elder details - MUST BE BEFORE /:elderId route
router.get('/elderDetails', getElderDetails);

// Get specific elder by ID
router.get('/:elderId', getElderById);

// Update elder details
router.put('/:elderId', updateElder);

// Create new elder
router.post('/', createElder);

module.exports = router;
