const pool = require('../db');

// Get all appointments for a family member (only approved status)
const getAllAppointmentsByFamily = async (req, res) => {
  const { familyMemberId } = req.params;
  const { type, limit, offset = 0 } = req.query;
  
  try {
    console.log('Getting approved appointments for family member:', familyMemberId);
    
    // First, get the family_id from the familymember table using the user_id
    const familyMemberResult = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [familyMemberId]
    );
    
    if (familyMemberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyId = familyMemberResult.rows[0].family_id;
    console.log('Found family_id:', familyId);
    
    // Build dynamic query - ONLY show approved appointments
    let query = `
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.family_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        a.appointment_type,
        a.created_at,
        a.updated_at,
        e.name as elder_name,
        e.contact as elder_contact,
        e.gender as elder_gender,
        e.dob as elder_dob,
        e.district as elder_district,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        d.specialization,
        d.current_institution,
        d.district as doctor_district,
        d.years_experience
      FROM appointment a
      INNER JOIN elder e ON a.elder_id = e.elder_id
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE a.family_id = $1 AND a.status = 'approved'
    `;
    
    const queryParams = [familyId];
    let paramCount = 1;
    
    // Add appointment type filter (if provided)
    if (type && type !== 'all') {
      paramCount++;
      query += ` AND a.appointment_type = $${paramCount}`;
      queryParams.push(type);
    }
    
    query += ` ORDER BY a.date_time DESC`;
    
    // Add limit if specified
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      
      if (offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        queryParams.push(parseInt(offset));
      }
    }
    
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination (only approved appointments)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM appointment a
      WHERE a.family_id = $1 AND a.status = 'approved'
    `;
    
    const countParams = [familyId];
    let countParamCount = 1;
    
    if (type && type !== 'all') {
      countParamCount++;
      countQuery += ` AND a.appointment_type = $${countParamCount}`;
      countParams.push(type);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);
    
    console.log('Found approved appointments:', result.rows.length);
    
    res.json({
      success: true,
      appointments: result.rows,
      pagination: {
        total: totalCount,
        limit: limit ? parseInt(limit) : null,
        offset: parseInt(offset),
        hasMore: limit ? (parseInt(offset) + parseInt(limit)) < totalCount : false
      }
    });
    
  } catch (err) {
    console.error('Error fetching approved appointments:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching appointments' 
    });
  }
};

// Get appointment by ID (only if approved)
const getAppointmentById = async (req, res) => {
  const { appointmentId } = req.params;
  
  try {
    console.log('Getting approved appointment by ID:', appointmentId);
    
    const result = await pool.query(
      `SELECT 
        a.appointment_id,
        a.elder_id,
        a.family_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        a.appointment_type,
        a.created_at,
        a.updated_at,
        e.name as elder_name,
        e.contact as elder_contact,
        e.gender as elder_gender,
        e.dob as elder_dob,
        e.district as elder_district,
        e.medical_conditions,
        e.profile_photo as elder_photo,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        d.specialization,
        d.current_institution,
        d.district as doctor_district,
        d.years_experience,
        d.license_number
      FROM appointment a
      INNER JOIN elder e ON a.elder_id = e.elder_id
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE a.appointment_id = $1 AND a.status = 'approved'`,
      [appointmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Approved appointment not found'
      });
    }
    
    res.json({
      success: true,
      appointment: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error fetching approved appointment:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching appointment details' 
    });
  }
};

// Update appointment status (can change from approved to other statuses)
const updateAppointmentStatus = async (req, res) => {
  const { appointmentId } = req.params;
  const { status, notes } = req.body;
  
  try {
    console.log('Updating appointment status:', appointmentId, status);
    
    const validStatuses = ['pending', 'approved', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const result = await pool.query(
      `UPDATE appointment 
       SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $3
       RETURNING *`,
      [status, notes, appointmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating appointment status' 
    });
  }
};

// Cancel appointment (only if currently approved)
const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { reason } = req.body;
  
  try {
    console.log('Cancelling approved appointment:', appointmentId);
    
    // First check if appointment exists and is approved
    const appointmentCheck = await pool.query(
      'SELECT * FROM appointment WHERE appointment_id = $1 AND status = $2',
      [appointmentId, 'approved']
    );
    
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Approved appointment not found or cannot be cancelled'
      });
    }
    
    const result = await pool.query(
      `UPDATE appointment 
       SET status = 'cancelled', 
           notes = CASE 
             WHEN notes IS NULL OR notes = '' THEN $1
             ELSE notes || ' | Cancellation reason: ' || $1
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $2
       RETURNING *`,
      [reason || 'Cancelled by family member', appointmentId]
    );
    
    res.json({
      success: true,
      message: 'Approved appointment cancelled successfully',
      appointment: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error cancelling approved appointment:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error cancelling appointment' 
    });
  }
};

// Get appointment statistics for family member (only approved appointments)
const getAppointmentStats = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    console.log('Getting approved appointment stats for family member:', familyMemberId);
    
    // Get family_id
    const familyMemberResult = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [familyMemberId]
    );
    
    if (familyMemberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyId = familyMemberResult.rows[0].family_id;
    
    // Get statistics (only for approved appointments)
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_approved_appointments,
        COUNT(CASE WHEN appointment_type = 'physical' THEN 1 END) as physical_appointments,
        COUNT(CASE WHEN appointment_type = 'online' THEN 1 END) as online_appointments,
        COUNT(CASE WHEN date_time > CURRENT_TIMESTAMP THEN 1 END) as upcoming_appointments,
        COUNT(CASE WHEN date_time < CURRENT_TIMESTAMP THEN 1 END) as past_appointments,
        COUNT(CASE WHEN DATE(date_time) = CURRENT_DATE THEN 1 END) as today_appointments
      FROM appointment 
      WHERE family_id = $1 AND status = 'approved'`,
      [familyId]
    );
    
    res.json({
      success: true,
      stats: {
        ...statsResult.rows[0],
        // Add some additional helpful stats
        status_filter: 'approved_only',
        message: 'Showing only approved appointments'
      }
    });
    
  } catch (err) {
    console.error('Error fetching approved appointment stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching appointment statistics' 
    });
  }
};

module.exports = {
  getAllAppointmentsByFamily,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentStats
};
