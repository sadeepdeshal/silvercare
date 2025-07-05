const express = require('express');
const router = express.Router();
const { 
  getEldersByFamilyMember, 
  getElderCount, 
  getElderById, 
  updateElder,
  createElder 
} = require('../controllers/elderController');

// Get all elders for a specific family member
router.get('/family-member/:familyMemberId', getEldersByFamilyMember);

// Get elder count for a specific family member
router.get('/count/:familyMemberId', getElderCount);

// Get specific elder by ID
router.get('/:elderId', getElderById);

// Update elder details
router.put('/:elderId', updateElder);

// Create new elder
router.post('/', createElder);

module.exports = router;
