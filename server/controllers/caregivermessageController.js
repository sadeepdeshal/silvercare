const db = require('../db');

const caregivermessageController = {
  // Get caregivers assigned to family member's elders
  getCaregiversWithAssignments: async (req, res) => {
    try {
      const { familyMemberId } = req.params;

      console.log('Fetching caregivers for family member:', familyMemberId);

      const query = `
        SELECT DISTINCT 
          c.caregiver_id,
          c.user_id,
          u.name as caregiver_name,
          u.email as caregiver_email,
          u.phone as caregiver_phone,
          c.district as caregiver_district,
          c.availability,
          COUNT(DISTINCT ca.request_id) as total_assignments,
          COUNT(DISTINCT CASE WHEN ca.status = 'approved' THEN ca.request_id END) as active_assignments,
          COUNT(DISTINCT CASE WHEN ca.status = 'completed' THEN ca.request_id END) as completed_assignments,
          STRING_AGG(DISTINCT e.name, ', ') as assigned_elders,
          MAX(ca.start_date) as latest_assignment_date
        FROM caregiver c
        JOIN "User" u ON c.user_id = u.user_id
        JOIN carerequest ca ON c.caregiver_id = ca.caregiver_id
        JOIN Elder e ON ca.elder_id = e.elder_id
        JOIN FamilyMember fm ON e.family_id = fm.family_id
        WHERE fm.user_id = $1
          AND ca.status IN ('approved', 'completed', 'confirmed')
        GROUP BY 
          c.caregiver_id, c.user_id, u.name, u.email, u.phone, 
          c.district, c.availability
        ORDER BY MAX(ca.start_date) DESC
      `;

      const result = await db.query(query, [familyMemberId]);

      console.log(`Found ${result.rows.length} caregivers for family member ${familyMemberId}`);

      res.json({
        success: true,
        caregivers: result.rows
      });

    } catch (error) {
      console.error('Error fetching caregivers with assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch caregivers'
      });
    }
  },

  // Get family members for a caregiver to chat with
  getFamilyMembersForCaregiver: async (req, res) => {
    try {
      const { caregiverId } = req.params;

      console.log('Fetching family members for caregiver:', caregiverId);

      const query = `
        SELECT DISTINCT 
          fm.family_id,
          u.user_id,
          u.name as family_member_name,
          u.email as family_member_email,
          u.phone as family_member_phone,
          'Family Member' as relationship,
          COUNT(DISTINCT ca.request_id) as total_assignments,
          COUNT(DISTINCT CASE WHEN ca.status = 'approved' THEN ca.request_id END) as active_assignments,
          STRING_AGG(DISTINCT e.name, ', ') as elders_cared_for,
          MAX(ca.start_date) as latest_assignment_date
        FROM FamilyMember fm
        JOIN "User" u ON fm.user_id = u.user_id
        JOIN Elder e ON fm.family_id = e.family_id
        JOIN carerequest ca ON e.elder_id = ca.elder_id
        WHERE ca.caregiver_id = $1
          AND ca.status IN ('approved', 'completed', 'confirmed')
        GROUP BY 
          fm.family_id, u.user_id, u.name, u.email, u.phone
        ORDER BY MAX(ca.start_date) DESC
      `;

      const result = await db.query(query, [caregiverId]);

      console.log(`Found ${result.rows.length} family members for caregiver ${caregiverId}`);

      res.json({
        success: true,
        familyMembers: result.rows
      });

    } catch (error) {
      console.error('Error fetching family members for caregiver:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch family members'
      });
    }
  },

  // Get care assignment details between family member and caregiver
  getCareAssignmentDetails: async (req, res) => {
    try {
      const { familyMemberId, caregiverId } = req.params;

      const query = `
        SELECT 
          ca.*,
          e.name as elder_name,
          e.age as elder_age,
          e.medical_conditions,
          c.availability as caregiver_availability,
          u_fm.name as family_member_name,
          u_c.name as caregiver_name
        FROM carerequest ca
        JOIN Elder e ON ca.elder_id = e.elder_id
        JOIN caregiver c ON ca.caregiver_id = c.caregiver_id
        JOIN FamilyMember fm ON e.family_id = fm.family_id
        JOIN "User" u_fm ON fm.user_id = u_fm.user_id
        JOIN "User" u_c ON c.user_id = u_c.user_id
        WHERE fm.user_id = $1 
          AND ca.caregiver_id = $2
          AND ca.status IN ('approved', 'completed', 'confirmed')
        ORDER BY ca.start_date DESC
      `;

      const result = await db.query(query, [familyMemberId, caregiverId]);

      res.json({
        success: true,
        assignments: result.rows
      });

    } catch (error) {
      console.error('Error fetching care assignment details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment details'
      });
    }
  }
};

module.exports = caregivermessageController;