const pool = require('../db');

/**
 * Service to handle automatic status updates for care requests
 */
class StatusUpdateService {
  
  /**
   * Update caregiver availability based on their active care assignments
   * DISABLED: Caregivers should manually set their availability to 'available' or 'unavailable' only.
   * This function is kept for backward compatibility but does nothing.
   */
  static async updateCaregiverAvailability(caregiverId) {
    try {
      console.log('⚠️ updateCaregiverAvailability called but DISABLED - caregivers must manually set availability');
      
      // DISABLED: No automatic status changes
      // Availability should only be 'available' or 'unavailable', set manually by the caregiver
      // The 'busy' status has been removed from the system
      
      return {
        caregiverId,
        availability: 'unchanged',
        hasActiveAssignments: false,
        disabled: true,
        message: 'Automatic availability updates are disabled. Caregivers must manually set availability.'
      };
      
    } catch (error) {
      console.error('Error in updateCaregiverAvailability:', error);
      throw error;
    }
  }
  
  /**
   * Update all caregivers availability based on their assignments
   * DISABLED: Caregivers should manually set their availability to 'available' or 'unavailable' only.
   * This function is kept for backward compatibility but does nothing.
   */
  static async updateAllCaregiversAvailability() {
    try {
      console.log('⚠️ updateAllCaregiversAvailability called but DISABLED - caregivers must manually set availability');
      
      // DISABLED: No automatic status changes
      // Availability should only be 'available' or 'unavailable', set manually by caregivers
      
      return {
        disabled: true,
        message: 'Automatic availability updates are disabled for all caregivers.'
      };
      
    } catch (error) {
      console.error('Error in updateAllCaregiversAvailability:', error);
      throw error;
    }
  }
  
  /**
   * Update pending requests to cancelled when end date has passed
   * Update approved requests to completed when end date has passed
   */
  static async updateExpiredRequests() {
    try {
      console.log('Running automatic status updates...');
      
      // Update pending requests to cancelled when end date equals or passes current date
      const cancelledResult = await pool.query(`
        UPDATE carerequest 
        SET status = 'cancelled'
        WHERE status = 'pending' 
        AND end_date <= CURRENT_DATE
        RETURNING request_id, elder_id, caregiver_id, end_date;
      `);
      
      if (cancelledResult.rows.length > 0) {
        console.log(`Updated ${cancelledResult.rows.length} pending requests to cancelled:`, 
          cancelledResult.rows.map(r => `Request ${r.request_id}`));
      }
      
      // NOTE: Status stays as 'confirmed' throughout assignment lifecycle
      // Display logic determines if assignment is "past" based on end_date comparison
      // No auto-update to 'completed' status
      /*
      // Update approved requests to completed when end date has passed
      const completedResult = await pool.query(`
        UPDATE carerequest 
        SET status = 'completed'
        WHERE status = 'approved' 
        AND end_date < CURRENT_DATE
        RETURNING request_id, elder_id, caregiver_id, end_date;
      `);
      
      if (completedResult.rows.length > 0) {
        console.log(`Updated ${completedResult.rows.length} approved requests to completed:`, 
          completedResult.rows.map(r => `Request ${r.request_id}`));
      }
      */
      
      return {
        cancelled: cancelledResult.rows.length,
        completed: 0 // Always 0 since we don't auto-update to completed
      };
      
    } catch (error) {
      console.error('Error updating expired requests:', error);
      throw error;
    }
  }
  
  /**
   * Update expired requests for a specific caregiver
   */
  static async updateExpiredRequestsForCaregiver(caregiverId) {
    try {
      // Update pending requests to cancelled
      const cancelledResult = await pool.query(`
        UPDATE carerequest 
        SET status = 'cancelled'
        WHERE caregiver_id = $1 
        AND status = 'pending' 
        AND end_date <= CURRENT_DATE
        RETURNING request_id;
      `, [caregiverId]);
      
      // NOTE: Status stays as 'confirmed' - no auto-update to completed
      /*
      // Update approved requests to completed
      const completedResult = await pool.query(`
        UPDATE carerequest 
        SET status = 'completed'
        WHERE caregiver_id = $1 
        AND status = 'approved' 
        AND end_date < CURRENT_DATE
        RETURNING request_id;
      `, [caregiverId]);
      */
      
      return {
        cancelled: cancelledResult.rows.length,
        completed: 0 // Always 0 since we don't auto-update to completed
      };
      
    } catch (error) {
      console.error('Error updating expired requests for caregiver:', error);
      throw error;
    }
  }
  
  /**
   * Update expired requests for a specific family
   */
  static async updateExpiredRequestsForFamily(familyId) {
    try {
      // Update pending requests to cancelled
      const cancelledResult = await pool.query(`
        UPDATE carerequest 
        SET status = 'cancelled'
        WHERE family_id = $1 
        AND status = 'pending' 
        AND end_date <= CURRENT_DATE
        RETURNING request_id;
      `, [familyId]);
      
      // NOTE: Status stays as 'confirmed' - no auto-update to completed
      /*
      // Update approved requests to completed
      const completedResult = await pool.query(`
        UPDATE carerequest 
        SET status = 'completed'
        WHERE family_id = $1 
        AND status = 'approved' 
        AND end_date < CURRENT_DATE
        RETURNING request_id;
      `, [familyId]);
      */
      
      return {
        cancelled: cancelledResult.rows.length,
        completed: 0 // Always 0 since we don't auto-update to completed
      };
      
    } catch (error) {
      console.error('Error updating expired requests for family:', error);
      throw error;
    }
  }
}

module.exports = StatusUpdateService;
