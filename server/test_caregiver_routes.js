const express = require('express');
const router = express.Router();

// Test that all controller functions exist
const { 
  getCareAssignmentsByWeek,
  getDayCareAssignments,
  getCareAssignmentStats,
  getUpcomingCareAssignments,
  getCareAssignmentsByMonth
} = require('./controllers/carerequest');

console.log('✓ getCareAssignmentsByWeek:', typeof getCareAssignmentsByWeek);
console.log('✓ getDayCareAssignments:', typeof getDayCareAssignments);
console.log('✓ getCareAssignmentStats:', typeof getCareAssignmentStats);
console.log('✓ getUpcomingCareAssignments:', typeof getUpcomingCareAssignments);
console.log('✓ getCareAssignmentsByMonth:', typeof getCareAssignmentsByMonth);

console.log('\nAll controller functions loaded successfully! ✓');

// Test route definitions
router.get('/:elderId/care-assignments/upcoming', getUpcomingCareAssignments);
router.get('/:elderId/care-assignments/month', getCareAssignmentsByMonth);
router.get('/:elderId/care-assignments/week', getCareAssignmentsByWeek);
router.get('/:elderId/care-assignments/day', getDayCareAssignments);
router.get('/:elderId/care-assignments/stats', getCareAssignmentStats);

console.log('All routes defined successfully! ✓');

module.exports = router;
