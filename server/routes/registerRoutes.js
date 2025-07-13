const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  createFamilyMemberRegistration,
  createCaregiverRegistration,
  createDoctorRegistration,
  createHealthProfessionalRegistration,
  createElderRegistration,
  getRegistrations,
  getEldersByFamilyMember,
  getElderById,
  updateElderById
} = require('../controllers/registerController');

// --- Add this block for doctor credentials upload ---
const doctorStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/doctor_credentials/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doctor-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const doctorUpload = multer({
  storage: doctorStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    // Accept pdf, jpg, jpeg, png
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, or PNG files are allowed'));
    }
  }
});

// --- Add this block for health professional credentials upload ---
const healthProfessionalStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/health_professional_credentials/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'health-professional-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const healthProfessionalUpload = multer({
  storage: healthProfessionalStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    // Accept pdf, jpg, jpeg, png
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, or PNG files are allowed'));
    }
  }
});
// ----------------------------------------------------

// General registration routes
router.get('/', getRegistrations);
router.post('/family-member', createFamilyMemberRegistration);
router.post('/caregiver', createCaregiverRegistration);

// Use multer for doctor registration
router.post('/doctor', doctorUpload.single('medicalCredentials'), createDoctorRegistration);

// Use multer for health professional registration
router.post('/health-professional', healthProfessionalUpload.single('professionalCredentials'), createHealthProfessionalRegistration);
router.post('/elder', createElderRegistration);

// Elder-specific routes
router.get('/elders/family-member/:familyMemberId', getEldersByFamilyMember);
router.get('/elders/:elderId', getElderById);
router.put('/elders/:elderId', updateElderById);

module.exports = router;
