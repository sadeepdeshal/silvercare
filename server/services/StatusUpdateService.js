const pool = require('../db');

/**
 * Service to handle automatic status updates for care requests
 */
class StatusUpdateService {
  
  /**
   * Update caregiver availability based on their active care assignments
   */
  static async updateCaregiverAvailability(caregiverId) {
    try {
      console.log('Updating caregiver availability for caregiver:', caregiverId);
      
      // Check if caregiver has any active confirmed assignments (current date is within start and end date)
      const activeAssignmentResult = await pool.query(`
        SELECT COUNT(*) as active_count
        FROM carerequest 
        WHERE caregiver_id = $1 
        AND status = 'confirmed'
        AND CURRENT_DATE >= start_date 
        AND CURRENT_DATE <= end_date
      `, [caregiverId]);
      
      const hasActiveAssignments = parseInt(activeAssignmentResult.rows[0].active_count) > 0;
      const newAvailability = hasActiveAssignments ? 'busy' : 'available';
      
      // Update caregiver availability
      const updateResult = await pool.query(`
        UPDATE caregiver 
        SET availability = $1
        WHERE caregiver_id = $2
        RETURNING caregiver_id, availability;
      `, [newAvailability, caregiverId]);
      
      if (updateResult.rows.length > 0) {
        console.log(`Updated caregiver ${caregiverId} availability to: ${newAvailability}`);
      }
      
      return {
        caregiverId,
        availability: newAvailability,
        hasActiveAssignments
      };
      
    } catch (error) {
      console.error('Error updating caregiver availability:', error);
      throw error;
    }
  }
  
  /**
   * Update all caregivers availability based on their assignments
   */
  static async updateAllCaregiversAvailability() {
    try {
      console.log('Updating all caregivers availability...');
      
      // Get all caregivers
      const caregiversResult = await pool.query(`
        SELECT caregiver_id FROM caregiver
      `);
      
      const updatePromises = caregiversResult.rows.map(row => 
        this.updateCaregiverAvailability(row.caregiver_id)
      );
      
      const results = await Promise.all(updatePromises);
      console.log(`Updated availability for ${results.length} caregivers`);
      
      return results;
      
    } catch (error) {
      console.error('Error updating all caregivers availability:', error);
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
