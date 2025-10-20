const pool = require('../db');

// Get counselors with appointments for an elder
const getCounselorsWithAppointments = async (req, res) => {
  try {
    const { elderId } = req.params;
    
    console.log('Fetching counselors with appointments for elder:', elderId);

    const query = `
      SELECT DISTINCT
        c.counselor_id,
        c.specialization,
        c.license_number,
        c.years_of_experience,
        c.current_institution,
        c.district as counselor_district,
        u.user_id,
        u.name as counselor_name,
        u.email as counselor_email,
        u.phone as counselor_contact,
        COUNT(ca.appointment_id) as total_appointments,
        COUNT(CASE WHEN ca.status = 'confirmed' THEN 1 END) as confirmed_appointments,
        COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_appointments,
        MAX(ca.date_time) as latest_appointment_date,
        MAX(ca.created_at) as counselor_registered_at
      FROM counselor_appointment ca
      INNER JOIN counselor c ON ca.counselor_id = c.counselor_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE ca.elder_id = $1 
        AND ca.status IN ('confirmed', 'completed')
        AND c.status = 'confirmed'
      GROUP BY 
        c.counselor_id, c.specialization, c.license_number, c.years_of_experience,
        c.current_institution, c.district, u.user_id, u.name, u.email, u.phone
      ORDER BY MAX(ca.date_time) DESC
    `;

    const result = await pool.query(query, [elderId]);
    
    console.log(`Found ${result.rows.length} counselors with appointments for elder ${elderId}`);
    
    res.status(200).json({
      success: true,
      counselors: result.rows
    });

  } catch (error) {
    console.error('Error fetching counselors with appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch counselors with appointments'
    });
  }
};

// Get appointment history between elder and counselor
const getAppointmentHistoryWithCounselor = async (req, res) => {
  try {
    const { elderId, counselorId } = req.params;
    
    console.log('Fetching appointment history between elder and counselor:', {
      elderId,
      counselorId
    });

    const query = `
      SELECT 
        ca.appointment_id,
        ca.date_time,
        ca.status,
        ca.appointment_type,
        ca.session_type,
        ca.session_duration,
        ca.patient_concerns,
        ca.notes,
        ca.created_at,
        c.specialization,
        c.current_institution,
        u.name as counselor_name
      FROM counselor_appointment ca
      INNER JOIN counselor c ON ca.counselor_id = c.counselor_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE ca.elder_id = $1 AND ca.counselor_id = $2
      ORDER BY ca.date_time DESC
    `;

    const result = await pool.query(query, [elderId, counselorId]);
    
    console.log(`Found ${result.rows.length} appointments between elder ${elderId} and counselor ${counselorId}`);
    
    res.status(200).json({
      success: true,
      appointments: result.rows
    });

  } catch (error) {
    console.error('Error fetching appointment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointment history'
    });
  }
};

module.exports = {
  getCounselorsWithAppointments,
  getAppointmentHistoryWithCounselor
};
