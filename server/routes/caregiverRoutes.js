const express = require('express');
const router = express.Router();
const { 
  getAllCaregivers,
  getActiveCaregiverCount,
  getCaregiverStats,
  getCaregiverById,
  createCareRequest,
  getCareRequestsByFamily,
  searchCaregivers,
  updateCareRequestStatus
} = require('../controllers/caregiverController');

// Get all caregivers
router.get('/', getAllCaregivers);

// Get active caregiver count
router.get('/count/active', getActiveCaregiverCount);

// Get caregiver statistics
router.get('/stats', getCaregiverStats);

// Search caregivers
router.get('/search', searchCaregivers);

// Get care requests for a family member
router.get('/requests/family/:familyMemberId', getCareRequestsByFamily);

// Get specific caregiver by ID
router.get('/:caregiverId', getCaregiverById);

// Create care request (book caregiver)
router.post('/:caregiverId/request', createCareRequest);

// Update care request status
router.put('/requests/:requestId/status', updateCareRequestStatus);

module.exports = router;
