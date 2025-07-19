const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const jwt = require('jsonwebtoken');

// Integrated authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Protect all doctor routes
// router.use(authenticate);

// Routes remain unchanged
router.get('/user/:userId', doctorController.getDoctorByUserId);
router.put('/user/:userId', doctorController.updateDoctorProfile);
router.get('/:doctorId/appointments', doctorController.getDoctorAppointments);
router.get('/:doctorId/upcoming', doctorController.getUpcomingAppointments);
router.get('/:doctorId/today', doctorController.getTodaysAppointments);
router.get('/:doctorId/next', doctorController.getNextAppointment);
router.get('/:doctorId/dashboard', doctorController.getDoctorDashboard);
router.put('/appointments/:appointmentId/status', doctorController.updateAppointmentStatus);

module.exports = router;