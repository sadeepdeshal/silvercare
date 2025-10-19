const pool = require('../db');

// Get family member details by user ID
const getFamilyMemberDetails = async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log('Fetching family member details for user ID:', userId);
    
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        fm.family_id,
        fm.phone_fixed
      FROM "User" u
      INNER JOIN familymember fm ON u.user_id = fm.user_id
      WHERE u.user_id = $1 AND u.role = 'family_member'
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyMember = result.rows[0];
    console.log('Family member details fetched successfully');
    
    res.json({
      success: true,
      familyMember: familyMember
    });
    
  } catch (err) {
    console.error('Error fetching family member details:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching family member details' 
    });
  }
};

// Update family member details
const updateFamilyMemberDetails = async (req, res) => {
  const { userId } = req.params;
  const { name, email, phone, phone_fixed } = req.body;
  
  try {
    console.log('Updating family member details for user ID:', userId);
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Update User table
    const userUpdateResult = await pool.query(`
      UPDATE "User" 
      SET name = $1, email = $2, phone = $3
      WHERE user_id = $4 AND role = 'family_member'
      RETURNING user_id, name, email, phone, role, created_at
    `, [name, email, phone, userId]);
    
    if (userUpdateResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    // Update familymember table
    const familyMemberUpdateResult = await pool.query(`
      UPDATE familymember 
      SET phone_fixed = $1
      WHERE user_id = $2
      RETURNING family_id, phone_fixed
    `, [phone_fixed, userId]);
    
    await pool.query('COMMIT');
    
    // Combine the results
    const updatedFamilyMember = {
      ...userUpdateResult.rows[0],
      family_id: familyMemberUpdateResult.rows[0].family_id,
      phone_fixed: familyMemberUpdateResult.rows[0].phone_fixed
    };
    
    console.log('Family member details updated successfully');
    
    res.json({
      success: true,
      message: 'Family member details updated successfully',
      familyMember: updatedFamilyMember
    });
    
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error updating family member details:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating family member details' 
    });
  }
};

// Get carelog data for a specific elder on a specific date
const getElderCarelogByDate = async (req, res) => {
  const { userId, elderId } = req.params;
  const { date } = req.query;
  
  try {
    console.log('Fetching carelog for elder ID:', elderId, 'date:', date);
    
    // First verify that this family member has access to this elder
    const familyResult = await pool.query(`
      SELECT fm.family_id 
      FROM familymember fm
      JOIN elder e ON fm.family_id = e.family_id
      WHERE fm.user_id = $1 AND e.elder_id = $2
    `, [userId, elderId]);
    
    if (familyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found or not accessible'
      });
    }
    
    // Get carelog data for the specific date
    const carelogQuery = `
      SELECT 
        cl.log_id,
        cl.elder_id,
        cl.caregiver_id,
        cl.notes,
        cl.mood,
        cl.date,
        cl.health_status,
        cl.medications_given,
        cl.activities,
        cl.concerns,
        e.name as elder_name,
        c.user_id as caregiver_user_id,
        u.name as caregiver_name,
        u.phone as caregiver_phone,
        u.email as caregiver_email
      FROM carelog cl
      JOIN elder e ON cl.elder_id = e.elder_id
      JOIN caregiver c ON cl.caregiver_id = c.caregiver_id
      JOIN "User" u ON c.user_id = u.user_id
      WHERE cl.elder_id = $1 
        AND cl.date IS NOT NULL
        AND DATE(cl.date) = $2
      ORDER BY cl.date DESC
    `;
    
    const carelogResult = await pool.query(carelogQuery, [elderId, date]);
    
    console.log('Carelog data fetched successfully');
    
    res.json({
      success: true,
      carelogs: carelogResult.rows
    });
    
  } catch (err) {
    console.error('Error fetching carelog data:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching carelog data' 
    });
  }
};

// Get carelog status for multiple dates (for calendar display)
const getElderCarelogStatus = async (req, res) => {
  const { userId, elderId } = req.params;
  const { startDate, endDate } = req.query;
  
  try {
    console.log('Fetching carelog status for elder ID:', elderId, 'from:', startDate, 'to:', endDate);
    
    // First verify that this family member has access to this elder
    const familyResult = await pool.query(`
      SELECT fm.family_id 
      FROM familymember fm
      JOIN elder e ON fm.family_id = e.family_id
      WHERE fm.user_id = $1 AND e.elder_id = $2
    `, [userId, elderId]);
    
    if (familyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found or not accessible'
      });
    }
    
    // Get dates where carelogs exist
    const statusQuery = `
      SELECT 
        DATE(cl.date)::text as log_date,
        COUNT(*) as report_count,
        array_agg(DISTINCT u.name) as caregiver_names
      FROM carelog cl
      JOIN caregiver c ON cl.caregiver_id = c.caregiver_id
      JOIN "User" u ON c.user_id = u.user_id
      WHERE cl.elder_id = $1 
        AND cl.date IS NOT NULL
        AND DATE(cl.date) >= $2 
        AND DATE(cl.date) <= $3
      GROUP BY DATE(cl.date)
      ORDER BY log_date DESC
    `;
    
    const statusResult = await pool.query(statusQuery, [elderId, startDate, endDate]);
    
    console.log('Carelog status fetched successfully');
    
    res.json({
      success: true,
      carelogStatus: statusResult.rows
    });
    
  } catch (err) {
    console.error('Error fetching carelog status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching carelog status' 
    });
  }
};

// Get appointment statistics for family member
const getAppointmentStatistics = async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log('Fetching appointment statistics for user ID:', userId);
    
    // First, get the family_id from user_id
    const familyResult = await pool.query(`
      SELECT family_id FROM familymember WHERE user_id = $1
    `, [userId]);
    
    if (familyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyId = familyResult.rows[0].family_id;
    
    // Get doctor appointment statistics
    const doctorStatsQuery = `
      SELECT 
        appointment_type,
        COUNT(*) as count
      FROM appointment 
      WHERE family_id = $1 
        AND doctor_id IS NOT NULL 
        AND counselor_id IS NULL
      GROUP BY appointment_type
    `;
    
    const doctorStatsResult = await pool.query(doctorStatsQuery, [familyId]);
    
    // Get health professional appointment statistics
    const healthProfessionalStatsQuery = `
      SELECT 
        appointment_type,
        COUNT(*) as count
      FROM appointment 
      WHERE family_id = $1 
        AND counselor_id IS NOT NULL 
        AND doctor_id IS NULL
      GROUP BY appointment_type
    `;
    
    const healthProfessionalStatsResult = await pool.query(healthProfessionalStatsQuery, [familyId]);
    
    // Process doctor statistics
    const doctorStats = {
      online: 0,
      physical: 0,
      total: 0
    };
    
    doctorStatsResult.rows.forEach(row => {
      const count = parseInt(row.count);
      if (row.appointment_type === 'online') {
        doctorStats.online = count;
      } else if (row.appointment_type === 'physical') {
        doctorStats.physical = count;
      }
      doctorStats.total += count;
    });
    
    // Process health professional statistics
    const healthProfessionalStats = {
      online: 0,
      physical: 0,
      total: 0
    };
    
    healthProfessionalStatsResult.rows.forEach(row => {
      const count = parseInt(row.count);
      if (row.appointment_type === 'online') {
        healthProfessionalStats.online = count;
      } else if (row.appointment_type === 'physical') {
        healthProfessionalStats.physical = count;
      }
      healthProfessionalStats.total += count;
    });
    
    // Calculate total appointments
    const totalAppointments = doctorStats.total + healthProfessionalStats.total;
    
    const stats = {
      doctorStats,
      healthProfessionalStats,
      totalAppointments
    };
    
    console.log('Appointment statistics fetched successfully:', stats);
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (err) {
    console.error('Error fetching appointment statistics:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching appointment statistics' 
    });
  }
};

// Get upcoming sessions for family member's elders
const getUpcomingSessions = async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log('Fetching upcoming sessions for family member:', userId);
    
    // First, get the family_id from user_id
    const familyResult = await pool.query(`
      SELECT family_id FROM familymember WHERE user_id = $1
    `, [userId]);
    
    if (familyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyId = familyResult.rows[0].family_id;
    
    const today = new Date();
    
    // Get upcoming counseling sessions for all elders in this family
    const result = await pool.query(`
      SELECT 
        ca.appointment_id,
        ca.elder_id,
        ca.counselor_id,
        ca.date_time,
        ca.appointment_type,
        ca.status,
        ca.meeting_link,
        ca.notes,
        e.name as elder_name,
        c.counselor_id as counselor_user_id,
        u.name as counselor_name,
        u.email as counselor_email,
        u.phone as counselor_phone,
        c.specialization,
        c.district as counselor_district
      FROM counselor_appointment ca
      INNER JOIN elder e ON ca.elder_id = e.elder_id
      INNER JOIN counselor c ON ca.counselor_id = c.counselor_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE e.family_id = $1 
        AND ca.date_time > $2
        AND ca.status IN ('pending', 'confirmed', 'approved')
      ORDER BY ca.date_time ASC
      LIMIT 10
    `, [familyId, today]);
    
    res.json({
      success: true,
      sessions: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching upcoming sessions:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching upcoming sessions' 
    });
  }
};

// Get upcoming care visits for family member's elders
const getUpcomingCareVisits = async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log('Fetching upcoming care visits for family member:', userId);
    
    // First, get the family_id from user_id
    const familyResult = await pool.query(`
      SELECT family_id FROM familymember WHERE user_id = $1
    `, [userId]);
    
    if (familyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyId = familyResult.rows[0].family_id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get upcoming care visits for all elders in this family
    const result = await pool.query(`
      SELECT 
        cr.request_id,
        cr.caregiver_id,
        cr.elder_id,
        cr.start_date,
        cr.end_date,
        cr.status,
        cr.duration,
        e.name as elder_name,
        u.name as caregiver_name,
        u.email as caregiver_email,
        u.phone as caregiver_phone,
        c.certifications,
        c.fixed_line as caregiver_fixed_line,
        c.district as caregiver_district,
        c.availability
      FROM carerequest cr
      INNER JOIN elder e ON cr.elder_id = e.elder_id
      INNER JOIN caregiver c ON cr.caregiver_id = c.caregiver_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE e.family_id = $1 
        AND cr.status IN ('approved', 'completed', 'confirmed')
        AND cr.end_date >= $2
      ORDER BY cr.start_date ASC
      LIMIT 10
    `, [familyId, today]);
    
    res.json({
      success: true,
      careVisits: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching upcoming care visits:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching upcoming care visits' 
    });
  }
};

module.exports = {
  getFamilyMemberDetails,
  updateFamilyMemberDetails,
  getAppointmentStatistics,
  getElderCarelogByDate,
  getElderCarelogStatus,
  getUpcomingSessions,
  getUpcomingCareVisits
};
