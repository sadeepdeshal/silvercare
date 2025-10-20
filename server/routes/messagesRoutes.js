const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');

// Send a new message
router.post('/send', messagesController.sendMessage);

// Get conversation between two users
router.get('/conversation/:userId1/:userId2', messagesController.getConversation);

// Mark messages as read
router.put('/mark-read', messagesController.markAsRead);

// Get unread message count
router.get('/unread-count/:userId', messagesController.getUnreadCount);

// Get healthcare professionals who have appointments with family member's elders
router.get('/healthcare-professionals-with-appointments/:familyUserId', messagesController.getHealthcareProfessionalsWithAppointments);

// Get family members who have elders that have appointments with this healthcare professional
router.get('/family-members-with-appointments/:healthcareProfessionalUserId', messagesController.getFamilyMembersWithAppointments);

module.exports = router;
