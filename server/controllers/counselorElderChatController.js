const pool = require('../db');

// Get elders with appointments for a counselor
const getEldersWithAppointments = async (req, res) => {
  try {
    const { counselorId } = req.params;
    
    console.log('Fetching elders with appointments for counselor:', counselorId);

    const query = `
      SELECT DISTINCT
        e.elder_id,
        e.name as elder_name,
        e.email as elder_email,
        e.contact as elder_contact,
        e.age,
        e.gender,
        e.district as elder_district,
        e.medical_conditions,
        e.profile_photo,
        e.created_at as elder_registered_at,
        COUNT(ca.appointment_id) as total_appointments,
        COUNT(CASE WHEN ca.status = 'confirmed' THEN 1 END) as confirmed_appointments,
        COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_appointments,
        MAX(ca.date_time) as latest_appointment_date,
        MAX(ca.created_at) as latest_appointment_created
      FROM counselor_appointment ca
      INNER JOIN elder e ON ca.elder_id = e.elder_id
      WHERE ca.counselor_id = $1 
        AND ca.status IN ('confirmed', 'completed')
      GROUP BY 
        e.elder_id, e.name, e.email, e.contact, e.age, e.gender,
        e.district, e.medical_conditions, e.profile_photo, e.created_at
      ORDER BY MAX(ca.date_time) DESC
    `;

    const result = await pool.query(query, [counselorId]);
    
    console.log(`Found ${result.rows.length} elders with appointments for counselor ${counselorId}`);
    
    res.status(200).json({
      success: true,
      elders: result.rows
    });

  } catch (error) {
    console.error('Error fetching elders with appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch elders with appointments'
    });
  }
};

// Get appointment history between counselor and elder
const getAppointmentHistoryWithElder = async (req, res) => {
  try {
    const { counselorId, elderId } = req.params;
    
    console.log('Fetching appointment history between counselor and elder:', {
      counselorId,
      elderId
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
        e.name as elder_name,
        e.age as elder_age,
        e.gender as elder_gender,
        e.medical_conditions
      FROM counselor_appointment ca
      INNER JOIN elder e ON ca.elder_id = e.elder_id
      WHERE ca.counselor_id = $1 AND ca.elder_id = $2
      ORDER BY ca.date_time DESC
    `;

    const result = await pool.query(query, [counselorId, elderId]);
    
    console.log(`Found ${result.rows.length} appointments between counselor ${counselorId} and elder ${elderId}`);
    
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
  getEldersWithAppointments,
  getAppointmentHistoryWithElder
};
