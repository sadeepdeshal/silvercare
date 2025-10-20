const pool = require('../db');


// Get elders who have confirmed or completed appointments with this doctor
const getEldersWithAppointments = async (req, res) => {
  const { doctorId } = req.params;
  
  try {
    console.log('Getting elders with appointments for doctor:', doctorId);
    
    const result = await pool.query(
      `SELECT DISTINCT
        e.elder_id,
        e.family_id,
        e.name as elder_name,
        e.email as elder_email,
        e.contact as elder_contact,
        e.gender,
        e.age,
        e.district,
        e.medical_conditions,
        e.profile_photo,
        e.created_at as elder_registered_at,
        u.user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        -- Count total appointments
        COUNT(a.appointment_id) as total_appointments,
        -- Count confirmed appointments
        COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed_appointments,
        -- Count completed appointments
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        -- Latest appointment date
        MAX(a.date_time) as latest_appointment_date,
        -- Most recent appointment status
        (SELECT a2.status FROM appointment a2 
         WHERE a2.elder_id = e.elder_id AND a2.doctor_id = $1 
         ORDER BY a2.date_time DESC LIMIT 1) as latest_appointment_status
      FROM elder e
      INNER JOIN "User" u ON LOWER(e.email) = LOWER(u.email)
      INNER JOIN appointment a ON e.elder_id = a.elder_id
      WHERE a.doctor_id = $1 
      AND a.status IN ('confirmed', 'completed')
      GROUP BY 
        e.elder_id, 
        e.family_id,
        e.name, 
        e.email, 
        e.contact,
        e.gender,
        e.age,
        e.district,
        e.medical_conditions,
        e.profile_photo,
        e.created_at,
        u.user_id,
        u.name,
        u.email,
        u.phone
      ORDER BY latest_appointment_date DESC`,
      [doctorId]
    );
    
    console.log(`Found ${result.rows.length} elders with appointments`);
    
    res.json({
      success: true,
      elders: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching elders with appointments:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching elders with appointments' 
    });
  }
};

// Get appointment history between doctor and specific elder
const getAppointmentHistoryWithElder = async (req, res) => {
  const { doctorId, elderId } = req.params;
  
  try {
    console.log('Getting appointment history for doctor:', doctorId, 'and elder:', elderId);
    
    const result = await pool.query(
      `SELECT 
        a.appointment_id,
        a.elder_id,
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
        e.age as elder_age,
        e.medical_conditions,
        d.specialization,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone
      FROM appointment a
      INNER JOIN elder e ON a.elder_id = e.elder_id
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE a.doctor_id = $1 
      AND a.elder_id = $2
      AND a.status IN ('confirmed', 'completed')
      ORDER BY a.date_time DESC`,
      [doctorId, elderId]
    );
    
    console.log(`Found ${result.rows.length} appointments between doctor ${doctorId} and elder ${elderId}`);
    
    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching appointment history with elder:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching appointment history with elder'
    });
  }
};

module.exports = {
  getEldersWithAppointments,
  getAppointmentHistoryWithElder
};
