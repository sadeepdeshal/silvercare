const express = require('express');
const router = express.Router();
const { getAllFeedback } = require('../controllers/feedbackController');

// Get all feedback entries
router.get('/', getAllFeedback);

module.exports = router;