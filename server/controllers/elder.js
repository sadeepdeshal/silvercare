const pool = require("../db");

// Fetch elder details based on user email
const getElderDetails = async (req, res) => {
  const { email } = req.query;
  console.log("Received email:", email);

  try {
    // Query to join User, elder, familymember tables based on email
    const elderResult = await pool.query(
      `
      SELECT 
        e.elder_id,
        e.family_id,
        e.name as elder_name,
        e.dob,
        e.gender,
        e.contact,
        e.address,
        e.nic,
        e.medical_conditions,
        e.profile_photo,
        e.email as elder_email,
        e.created_at as elder_created_at,
        u.user_id,
        u.name as user_name,
        u.phone as user_phone,
        u.role,
        u.created_at as user_created_at,
        fm.family_id as fm_family_id,
        fm.user_id as fm_user_id,
        fm.address as fm_address,
        fm.phone_fixed as fm_phone_fixed,
        fu.user_id as family_user_id,
        fu.name as family_member_name,
        fu.email as family_member_email,
        fu.phone as family_member_phone,
        fu.created_at as family_member_created_at
      FROM elder e
      INNER JOIN "User" u ON LOWER(e.email) = LOWER(u.email)
      LEFT JOIN familymember fm ON e.family_id = fm.family_id
      LEFT JOIN "User" fu ON fm.user_id = fu.user_id
      WHERE LOWER(u.email) = LOWER($1)
    `,
      [email]
    );

    if (elderResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Elder details not found for this user" });
    }

    // Send the elder details in the response
    const elderData = elderResult.rows[0];

    // Format the response
    const response = {
      elder_id: elderData.elder_id,
      family_id: elderData.family_id,
      name: elderData.elder_name,
      dob: elderData.dob,
      gender: elderData.gender,
      contact: elderData.contact,
      address: elderData.address,
      nic: elderData.nic,
      medical_conditions: elderData.medical_conditions,
      profile_photo: elderData.profile_photo,
      email: elderData.elder_email,
      user_details: {
        user_id: elderData.user_id,
        user_name: elderData.user_name,
        user_phone: elderData.user_phone,
        role: elderData.role,
        user_created_at: elderData.user_created_at,
      },
      family_member: elderData.family_member_name
        ? {
            name: elderData.family_member_name,
            email: elderData.family_member_email,
            phone: elderData.family_member_phone,
            phone_fixed: elderData.fm_phone_fixed,
            address: elderData.fm_address,
            created_at: elderData.family_member_created_at,
          }
        : null,
      created_at: elderData.elder_created_at,
    };

    res.json(response);
  } catch (err) {
    console.error("Error in getElderDetails:", err);
    res
      .status(500)
      .json({ error: "Server error while fetching elder details" });
  }
};

// Get dashboard stats for an elder
const getElderDashboardStats = async (req, res) => {
  const { elderId } = req.params;
  console.log("Fetching dashboard stats for elder ID:", elderId);

  try {
    // Check if elder exists
    const elderCheck = await pool.query(
      "SELECT * FROM elder WHERE elder_id = $1",
      [elderId]
    );
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Elder not found",
      });
    }

    // Get upcoming appointments count
    const upcomingAppointmentsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM appointment 
      WHERE elder_id = $1 
      AND date_time > NOW()
      AND status IN ('approved', 'confirmed')
    `,
      [elderId]
    );

    // Get upcoming sessions count
    const upcomingSessionsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM session 
      WHERE elder_id = $1 
      AND date_time > NOW()
      AND status IN ('pending', 'completed')
    `,
      [elderId]
    );

    // Get upcoming campaigns count (booked campaigns)
    const upcomingCampaignsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM campaignbooking cb
      INNER JOIN campaignevent c ON cb.campaign_id = c.campaign_id
      WHERE cb.elder_id = $1 
      AND c.start_date > NOW()
    `,
      [elderId]
    );

    // Get active caregivers count (caregivers who have recent logs)
    const activeCaregiversResult = await pool.query(
      `
      SELECT COUNT(DISTINCT caregiver_id) as count
      FROM carelog 
      WHERE elder_id = $1
    `,
      [elderId]
    );

    const stats = {
      upcomingAppointments:
        parseInt(upcomingAppointmentsResult.rows[0].count) || 0,
      upcomingSessions: parseInt(upcomingSessionsResult.rows[0].count) || 0,
      upcomingCampaigns: parseInt(upcomingCampaignsResult.rows[0].count) || 0,
      assignedCaregivers: parseInt(activeCaregiversResult.rows[0].count) || 0,
    };

    console.log("Dashboard stats:", stats);

    res.json({
      success: true,
      stats: stats,
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching dashboard statistics",
    });
  }
};

// Get all appointments for an elder
const getElderAppointments = async (req, res) => {
  const { elderId } = req.params;
  console.log("Fetching appointments for elder ID:", elderId);

  try {
    const appointmentsResult = await pool.query(
      `
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.family_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        d.specialization,
        d.license_number,
        d.alternative_number,
        d.current_institution,
        d.years_experience,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone
      FROM appointment a
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE a.elder_id = $1 AND a.status != 'pending'
      ORDER BY a.date_time DESC
    `,
      [elderId]
    );

    res.json({
      success: true,
      appointments: appointmentsResult.rows,
    });
  } catch (err) {
    console.error("Error fetching elder appointments:", err);
    res.status(500).json({ error: "Server error while fetching appointments" });
  }
};

// Get upcoming appointments for an elder
const getUpcomingAppointments = async (req, res) => {
  const { elderId } = req.params;
  console.log("Fetching upcoming appointments for elder ID:", elderId);

  try {
    // Check if elder exists
    const elderCheck = await pool.query(
      "SELECT * FROM elder WHERE elder_id = $1",
      [elderId]
    );
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Elder not found",
      });
    }

    // Get upcoming appointments
    const result = await pool.query(
      `SELECT 
        a.appointment_id,
        a.date_time,
        a.status,
        a.notes,
        a.created_at,
        u.name as doctor_name,
        d.specialization,
        d.license_number,
        d.current_institution,
        u.email as doctor_email,
        u.phone as doctor_phone
      FROM appointment a
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN "User" u ON d.user_id = u.user_id
      WHERE a.elder_id = $1 
      AND a.date_time > NOW()
      AND a.status IN ('approved')
      ORDER BY a.date_time ASC`,
      [elderId]
    );

    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error("Error fetching upcoming appointments:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching upcoming appointments",
    });
  }
};

// Get past appointments for an elder
const getPastAppointments = async (req, res) => {
  const { elderId } = req.params;
  console.log("Fetching past appointments for elder ID:", elderId);

  try {
    // Check if elder exists
    const elderCheck = await pool.query(
      "SELECT * FROM elder WHERE elder_id = $1",
      [elderId]
    );
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Elder not found",
      });
    }

    // Get past appointments
    const result = await pool.query(
      `SELECT 
        a.appointment_id,
        a.date_time,
        a.status,
        a.notes,
        a.created_at,
        u.name as doctor_name,
        d.specialization,
        d.license_number,
        d.current_institution,
        u.email as doctor_email,
        u.phone as doctor_phone
      FROM appointment a
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN "User" u ON d.user_id = u.user_id
      WHERE a.elder_id = $1 
      AND (a.date_time < NOW() OR a.status IN ('completed', 'cancelled'))
      ORDER BY a.date_time DESC`,
      [elderId]
    );

    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error("Error fetching past appointments:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching past appointments",
    });
  }
};

// Get all appointments for an elder
const getAllAppointments = async (req, res) => {
  const { elderId } = req.params;

  try {
    // Check if elder exists
    const elderCheck = await pool.query(
      "SELECT * FROM elder WHERE elder_id = $1",
      [elderId]
    );
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Elder not found",
      });
    }

    // Get all appointments
    const result = await pool.query(
      `SELECT 
        a.appointment_id,
        a.date_time,
        a.status,
        a.notes,
        a.created_at,
        d.name as doctor_name,
        d.specialization,
        d.license_number,
        d.current_institution,
        u.email as doctor_email,
        u.phone as doctor_phone
      FROM appointment a
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN "User" u ON d.user_id = u.user_id
      WHERE a.elder_id = $1 
      ORDER BY a.date_time DESC`,
      [elderId]
    );

    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching appointments",
    });
  }
};

// Get specific appointment by ID
const getAppointmentById = async (req, res) => {
  const { elderId, appointmentId } = req.params;

  try {
    // Get specific appointment
    const result = await pool.query(
      `SELECT 
        a.appointment_id,
        a.elder_id,
        a.family_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        a.created_at,
        d.name as doctor_name,
        d.specialization,
        d.license_number,
        d.current_institution,
        u.email as doctor_email,
        u.phone as doctor_phone,
        e.name as elder_name,
        e.contact as elder_contact
      FROM appointment a
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN "User" u ON d.user_id = u.user_id
      JOIN elder e ON a.elder_id = e.elder_id
      WHERE a.appointment_id = $1 AND a.elder_id = $2`,
      [appointmentId, elderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found",
      });
    }

    res.json({
      success: true,
      appointment: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching appointment:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching appointment",
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  const { elderId, appointmentId } = req.params;
  const { reason } = req.body;

  try {
    // Check if appointment exists and belongs to elder
    const appointmentCheck = await pool.query(
      "SELECT * FROM appointment WHERE appointment_id = $1 AND elder_id = $2",
      [appointmentId, elderId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found",
      });
    }

    // Update appointment status to cancelled
    const result = await pool.query(
      `UPDATE appointment 
       SET status = 'cancelled', 
           notes = COALESCE(notes || ' | Cancelled: ' || $3, 'Cancelled: ' || $3),
           updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $1 AND elder_id = $2
       RETURNING *`,
      [appointmentId, elderId, reason || "Cancelled by elder"]
    );

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment: result.rows[0],
    });
  } catch (err) {
    console.error("Error cancelling appointment:", err);
    res.status(500).json({
      success: false,
      error: "Error cancelling appointment",
    });
  }
};

// Reschedule appointment
const rescheduleAppointment = async (req, res) => {
  const { elderId, appointmentId } = req.params;
  const { newDateTime, reason } = req.body;

  try {
    // Validate new date time
    if (!newDateTime) {
      return res.status(400).json({
        success: false,
        error: "New date and time is required",
      });
    }

    // Check if appointment exists and belongs to elder
    const appointmentCheck = await pool.query(
      "SELECT * FROM appointment WHERE appointment_id = $1 AND elder_id = $2",
      [appointmentId, elderId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found",
      });
    }

    // Update appointment with new date time
    const result = await pool.query(
      `UPDATE appointment 
       SET date_time = $3,
           notes = COALESCE(notes || ' | Rescheduled: ' || $4, 'Rescheduled: ' || $4),
           updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $1 AND elder_id = $2
       RETURNING *`,
      [appointmentId, elderId, newDateTime, reason || "Rescheduled by elder"]
    );

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: result.rows[0],
    });
  } catch (err) {
    console.error("Error rescheduling appointment:", err);
    res.status(500).json({
      success: false,
      error: "Error rescheduling appointment",
    });
  }
};

module.exports = {
  getElderDetails,
  getElderDashboardStats,
  getElderAppointments,
  getUpcomingAppointments,
  getPastAppointments,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
};
