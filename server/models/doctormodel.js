const pool = require('../db');

// Get all appointments for a specific doctor
const getAppointmentsByDoctorId = async (doctorId) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        e.name as elder_name,
        e.email as elder_email,
        e.dob as elder_dob,
        e.gender as elder_gender,
        e.contact as elder_contact,
        e.address as elder_address,
        e.medical_conditions,
        e.profile_photo as elder_avatar
      FROM appointment a
      LEFT JOIN elder e ON a.elder_id = e.elder_id
      WHERE a.doctor_id = $1
      ORDER BY a.date_time ASC
    `, [doctorId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching appointments by doctor ID:', error);
    throw error;
  }
};

// Get upcoming appointments for a specific doctor
const getUpcomingAppointmentsByDoctorId = async (doctorId) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        e.name as elder_name,
        e.email as elder_email,
        e.dob as elder_dob,
        e.gender as elder_gender,
        e.contact as elder_contact,
        e.address as elder_address,
        e.medical_conditions,
        e.profile_photo as elder_avatar
      FROM appointment a
      LEFT JOIN elder e ON a.elder_id = e.elder_id
      WHERE a.doctor_id = $1 AND a.date_time >= CURRENT_TIMESTAMP
      ORDER BY a.date_time ASC
    `, [doctorId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    throw error;
  }
};

// Get today's appointments for a specific doctor
const getTodaysAppointmentsByDoctorId = async (doctorId) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        e.name as elder_name,
        e.email as elder_email,
        e.dob as elder_dob,
        e.gender as elder_gender,
        e.contact as elder_contact,
        e.address as elder_address,
        e.medical_conditions,
        e.profile_photo as elder_avatar
      FROM appointment a
      LEFT JOIN elder e ON a.elder_id = e.elder_id
      WHERE a.doctor_id = $1 
      AND DATE(a.date_time) = CURRENT_DATE
      ORDER BY a.date_time ASC
    `, [doctorId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    throw error;
  }
};

// Get next appointment for a specific doctor
const getNextAppointmentByDoctorId = async (doctorId) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        e.name as elder_name,
        e.email as elder_email,
        e.dob as elder_dob,
        e.gender as elder_gender,
        e.contact as elder_contact,
        e.address as elder_address,
        e.medical_conditions,
        e.profile_photo as elder_avatar
      FROM appointment a
      LEFT JOIN elder e ON a.elder_id = e.elder_id
      WHERE a.doctor_id = $1 
      AND a.date_time >= CURRENT_TIMESTAMP
      ORDER BY a.date_time ASC
      LIMIT 1
    `, [doctorId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching next appointment:', error);
    throw error;
  }
};

// Update appointment status
const updateAppointmentStatus = async (appointmentId, status, notes = null) => {
  try {
    const result = await pool.query(`
      UPDATE appointment 
      SET status = $1, notes = COALESCE($2, notes)
      WHERE appointment_id = $3
      RETURNING *
    `, [status, notes, appointmentId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

// Get doctor information by user ID
const getDoctorByUserId = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.doctor_id,
        d.user_id,
        d.specialization,
        d.license_number,
        d.alternative_number,
        d.current_institution,
        d.years_experience,
        d.status,
        u.name,
        u.email,
        u.phone,
        u.role
      FROM doctor d
      JOIN "User" u ON d.user_id = u.user_id
      WHERE d.user_id = $1
    `, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching doctor by user ID:', error);
    throw error;
  }
};

module.exports = {
  getAppointmentsByDoctorId,
  getUpcomingAppointmentsByDoctorId,
  getTodaysAppointmentsByDoctorId,
  getNextAppointmentByDoctorId,
  updateAppointmentStatus,
  getDoctorByUserId
};