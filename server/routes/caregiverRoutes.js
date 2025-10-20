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
  updateCareRequestStatus,
  getBlockedDates,  // NEW: Get blocked dates for caregiver
  createTemporaryCaregiverBooking,  // NEW: Create temporary booking
  getTemporaryCaregiverBooking,  // NEW: Get temporary booking by ID
  confirmPaymentAndCreateCareRequest,  // NEW: Confirm payment
  cancelTemporaryCaregiverBooking,  // NEW: Cancel temporary booking
  cleanupExpiredCaregiverBookings,  // NEW: Cleanup expired bookings
  getCaregiverBookingsByFamily,  // NEW: Get caregiver bookings for family
  cancelCaregiverBooking,  // NEW: Cancel caregiver booking with refund
  submitCaregiverRating,  // NEW: Submit rating for booking
  getBookingRating,  // NEW: Get rating for booking
} = require('../controllers/caregiverController');

const { 
  getCareRequestById,
  getAssignedElders,
  getAssignedFamiliesCount,
  getcarelogsCount,
  fetchSchedules,
  fetchCareRequests,
  updateCaregiverProfile,
  updateCaregiverPassword,
  getUpcomingShifts,
  getCarelogs,
  addCarelog,
  getElderDetails,
  getElderCarelogs,
  addElderReport,
  getWeeklyReports,
  submitDailyReport
} = require('../controllers/caregiver');

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

// NEW: Get blocked dates for a caregiver
router.get('/:caregiverId/blocked-dates', getBlockedDates);

// NEW: Payment and booking routes
router.post('/temporary-booking', createTemporaryCaregiverBooking);
router.get('/temporary-booking/:tempBookingId', getTemporaryCaregiverBooking);
router.post('/confirm-payment', confirmPaymentAndCreateCareRequest);
router.delete('/temporary-booking/:tempBookingId', cancelTemporaryCaregiverBooking);
router.post('/cleanup-expired', cleanupExpiredCaregiverBookings);

// NEW: Caregiver bookings management
router.get('/bookings/family/:familyMemberId', getCaregiverBookingsByFamily);
router.post('/bookings/:requestId/cancel', cancelCaregiverBooking);

// NEW: Rating and feedback routes
router.post('/bookings/:careRequestId/rating', submitCaregiverRating);
router.get('/bookings/:careRequestId/rating', getBookingRating);

// Get specific caregiver by ID
router.get('/:caregiverId', getCaregiverById);

// Create care request (book caregiver)
router.post('/:caregiverId/request', createCareRequest);

// Update care request status
router.put('/requests/:requestId/status', updateCareRequestStatus);

// Get care request details by ID(role caregiver)
router.get('/requests/:requestId', getCareRequestById);

//get assigned elders(role caregiver)
router.get('/:id/assigned-elders', getAssignedElders);

//Number of families assigned to specific caregiver(role caregiver)
router.get('/:id/assigned-families', getAssignedFamiliesCount);

//Number of carelogs(role caregiver)
router.get('/:id/carelogs-count', getcarelogsCount);

//Number of carelogs(role caregiver)
router.get('/:id/caregiver-schedules', fetchSchedules);

//Get care requests for caregiver(role caregiver)
router.get('/:id/care-requests', fetchCareRequests);

//Get upcoming shifts for caregiver(role caregiver)
router.get('/:id/upcoming-shifts', getUpcomingShifts);

// Update caregiver profile(role caregiver)
router.put('/:caregiverId/profile', updateCaregiverProfile);

// Update caregiver password(role caregiver)
router.put('/:caregiverId/password', updateCaregiverPassword);

// Carelogs for caregiver
router.get('/:id/carelogs', getCarelogs);
router.post('/:id/carelogs', addCarelog);

// Elder management routes
router.get('/elder/:elderId/details', getElderDetails);
router.get('/:caregiverId/elder/:elderId/carelogs', getElderCarelogs);
router.post('/:caregiverId/elder/:elderId/report', addElderReport);

// Daily reports routes
router.get('/:caregiverId/weekly-reports', getWeeklyReports);
router.post('/:caregiverId/daily-report', submitDailyReport);

module.exports = router;
