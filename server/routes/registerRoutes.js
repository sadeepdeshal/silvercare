const express = require('express');
const router = express.Router();
const {
  createFamilyMemberRegistration,
  getRegistrations
} = require('../controllers/registerController');

router.get('/', getRegistrations);
router.post('/family-member', createFamilyMemberRegistration);

module.exports = router;
