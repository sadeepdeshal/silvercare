const express = require('express');
const router = express.Router();
const caregivermessageController = require('../controllers/caregivermessageController');

// Family member routes
router.get('/caregivers/:familyMemberId', caregivermessageController.getCaregiversWithAssignments);
router.get('/assignments/:familyMemberId/:caregiverId', caregivermessageController.getCareAssignmentDetails);

// Caregiver routes
router.get('/family-members/:caregiverId', caregivermessageController.getFamilyMembersForCaregiver);

module.exports = router;