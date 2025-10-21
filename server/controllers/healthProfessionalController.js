const db = require('../db');

exports.getByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    console.log('Fetching health professional for user ID:', userId);
    
    // Get counselor data from database
    const query = `
      SELECT 
        c.counselor_id,
        c.user_id,
        c.specialization,
        c.license_number,
        c.alternative_number,
        c.years_of_experience,
        c.current_institution,
        c.proof,
        c.status,
        c.district,
        u.name,
        u.email,
        u.phone
      FROM counselor c
      JOIN "User" u ON c.user_id = u.user_id
      WHERE c.user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      console.log('No health professional found for user ID:', userId);
      return res.status(404).json({ 
        error: 'Health professional not found',
        message: 'No counselor profile exists for this user. Please contact admin.' 
      });
    }
    
    const hp = result.rows[0];
    
    console.log('Health professional found:', hp.counselor_id);
    
    res.json({ 
      healthprofessional: {
        counselor_id: hp.counselor_id,
        user_id: hp.user_id,
        name: hp.name,
        email: hp.email,
        phone: hp.phone,
        specialization: hp.specialization,
        license_number: hp.license_number,
        alternative_number: hp.alternative_number,
        years_of_experience: hp.years_of_experience,
        current_institution: hp.current_institution,
        proof: hp.proof,
        status: hp.status,
        district: hp.district
      }
    });
  } catch (error) {
    console.error('Error fetching health professional:', error);
    res.status(500).json({ 
      error: 'Failed to fetch health professional',
      details: error.message 
    });
  }
};

// Get dashboard data for health professional
exports.getDashboard = async (req, res) => {
  try {
    const counselorId = req.params.counselorId;
    
    console.log('Fetching dashboard data for counselor ID:', counselorId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's appointments from counselor_appointment table
    const todayQuery = `
      SELECT 
        ca.appointment_id,
        ca.elder_id,
        ca.family_id,
        ca.counselor_id,
        ca.date_time,
        ca.status,
        ca.appointment_type,
        ca.session_type,
        ca.notes,
        ca.session_duration,
        ca.meeting_link,
        e.name as elder_name,
        e.dob as elder_dob,
        e.gender as elder_gender,
        e.contact as elder_contact,
        e.address as elder_address,
        e.medical_conditions,
        e.profile_photo as elder_avatar
      FROM counselor_appointment ca
      LEFT JOIN elder e ON ca.elder_id = e.elder_id
      WHERE ca.counselor_id = $1
      AND ca.date_time >= $2
      AND ca.date_time < $3
      ORDER BY ca.date_time ASC
    `;
    
    const todayResult = await db.query(todayQuery, [counselorId, today, tomorrow]);
    
    // Get all upcoming appointments (from current time onwards) from counselor_appointment table
    const now = new Date();
    const upcomingQuery = `
      SELECT 
        ca.appointment_id,
        ca.elder_id,
        ca.family_id,
        ca.counselor_id,
        ca.date_time,
        ca.status,
        ca.appointment_type,
        ca.session_type,
        ca.notes,
        ca.session_duration,
        ca.meeting_link,
        e.name as elder_name,
        e.dob as elder_dob,
        e.gender as elder_gender,
        e.contact as elder_contact,
        e.address as elder_address,
        e.medical_conditions,
        e.profile_photo as elder_avatar
      FROM counselor_appointment ca
      LEFT JOIN elder e ON ca.elder_id = e.elder_id
      WHERE ca.counselor_id = $1
      AND ca.date_time > $2
      AND ca.status IN ('pending', 'confirmed', 'approved')
      ORDER BY ca.date_time ASC
    `;
    
    console.log('Upcoming appointments SQL:', upcomingQuery);
    console.log('Upcoming appointments params - counselorId:', counselorId, 'current time:', now);
    const upcomingResult = await db.query(upcomingQuery, [counselorId, now]);
    console.log('Upcoming appointments result count:', upcomingResult.rows.length);
    console.log('Upcoming appointments result:', upcomingResult.rows);

    // Get next appointment (first upcoming after now) from counselor_appointment table
    const nextQuery = `
      SELECT 
        ca.appointment_id,
        ca.elder_id,
        ca.family_id,
        ca.counselor_id,
        ca.date_time,
        ca.status,
        ca.appointment_type,
        ca.session_type,
        ca.notes,
        ca.session_duration,
        ca.meeting_link,
        e.name as elder_name,
        e.dob as elder_dob,
        e.gender as elder_gender,
        e.contact as elder_contact,
        e.address as elder_address,
        e.medical_conditions,
        e.profile_photo as elder_avatar
      FROM counselor_appointment ca
      LEFT JOIN elder e ON ca.elder_id = e.elder_id
      WHERE ca.counselor_id = $1
      AND ca.date_time > $2
      AND ca.status IN ('confirmed', 'approved')
      ORDER BY ca.date_time ASC
      LIMIT 1
    `;
    
    const nextResult = await db.query(nextQuery, [counselorId, now]);
    
    const dashboardData = {
      todaysAppointments: todayResult.rows,
      upcomingAppointments: upcomingResult.rows,
      nextAppointment: nextResult.rows[0] || null,
      counts: {
        todaysAppointments: todayResult.rows.length,
        upcomingAppointments: upcomingResult.rows.length
      }
    };
    
    console.log('Dashboard data counts:', dashboardData.counts);
    
    res.json({ data: dashboardData });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    });
  }
};

// Get appointment statistics for health professional
exports.getAppointmentStatistics = async (req, res) => {
  try {
    const counselorId = req.params.counselorId;
    
    console.log('Fetching appointment statistics for counselor ID:', counselorId);
    
    // Get appointment counts by type from counselor_appointment table
    const statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN appointment_type = 'online' THEN 1 ELSE 0 END), 0) as online,
        COALESCE(SUM(CASE WHEN appointment_type != 'online' THEN 1 ELSE 0 END), 0) as physical,
        COALESCE(COUNT(*), 0) as total
      FROM counselor_appointment 
      WHERE counselor_id = $1 
      AND status IN ('completed', 'confirmed')
    `;
    
    const result = await db.query(statsQuery, [counselorId]);
    
    console.log('Raw stats result:', result.rows);
    
    const stats = result.rows[0] || { online: 0, physical: 0, total: 0 };
    
    // Convert to numbers to ensure proper calculation
    const statsResponse = {
      online: parseInt(stats.online) || 0,
      physical: parseInt(stats.physical) || 0,
      total: parseInt(stats.total) || 0
    };
    
    console.log('Processed stats response:', statsResponse);
    
    res.json(statsResponse);
  } catch (error) {
    console.error('Error fetching counselor appointment statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch appointment statistics',
      details: error.message 
    });
  }
}; 