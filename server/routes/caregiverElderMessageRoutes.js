const express = require('express');
const router = express.Router();
const caregiverElderMessageController = require('../controllers/caregiverElderMessageController');

// Routes for caregiver-elder messaging

// Get elders assigned to a caregiver for messaging
router.get('/caregiver/:caregiverId/elders', caregiverElderMessageController.getEldersForCaregiver);

// Get caregivers assigned to an elder for messaging
router.get('/elder/:elderUserId/caregivers', caregiverElderMessageController.getCaregiversForElder);

// Get care assignment details between caregiver and elder
router.get('/caregiver/:caregiverId/elder/:elderUserId/assignment', caregiverElderMessageController.getCareAssignmentDetails);

// Send message between caregiver and elder
router.post('/caregiver/:caregiverId/elder/:elderUserId/message', caregiverElderMessageController.sendMessage);

// Get messages between caregiver and elder
router.get('/caregiver/:caregiverId/elder/:elderUserId/messages', caregiverElderMessageController.getMessages);

module.exports = router;