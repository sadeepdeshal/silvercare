const doctorModel = require('../models/doctormodel');

// Get all appointments for a doctor
const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    const appointments = await doctorModel.getAppointmentsByDoctorId(doctorId);
    res.json({ appointments, count: appointments.length });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Error fetching appointments' });
  }
};

// Get upcoming appointments for a doctor
const getUpcomingAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    const appointments = await doctorModel.getUpcomingAppointmentsByDoctorId(doctorId);
    res.json({ appointments, count: appointments.length });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: 'Error fetching upcoming appointments' });
  }
};

// Get today's appointments for a doctor
const getTodaysAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    const appointments = await doctorModel.getTodaysAppointmentsByDoctorId(doctorId);
    res.json({ appointments, count: appointments.length });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({ error: 'Error fetching today\'s appointments' });
  }
};

// Get next appointment for a doctor
const getNextAppointment = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    const appointment = await doctorModel.getNextAppointmentByDoctorId(doctorId);
    res.json({ appointment });
  } catch (error) {
    console.error('Error fetching next appointment:', error);
    res.status(500).json({ error: 'Error fetching next appointment' });
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;
    if (!appointmentId || !status) {
      return res.status(400).json({ error: 'Appointment ID and status are required' });
    }
    const updated = await doctorModel.updateAppointmentStatus(appointmentId, status, notes);
    res.json({ appointment: updated });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Error updating appointment status' });
  }
};

// Get doctor dashboard data
const getDoctorDashboard = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    // Fetch all dashboard data in parallel
    const [
      todaysAppointments,
      upcomingAppointments,
      nextAppointment
    ] = await Promise.all([
      doctorModel.getTodaysAppointmentsByDoctorId(doctorId),
      doctorModel.getUpcomingAppointmentsByDoctorId(doctorId),
      doctorModel.getNextAppointmentByDoctorId(doctorId)
    ]);

    res.json({
      data: {
        todaysAppointments: todaysAppointments || [],
        upcomingAppointments: upcomingAppointments || [],
        nextAppointment: nextAppointment || null,
        counts: {
          todaysAppointments: todaysAppointments ? todaysAppointments.length : 0,
          upcomingAppointments: upcomingAppointments ? upcomingAppointments.length : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Error fetching dashboard data', details: error.message });
  }
};

// Get doctor information by user ID (for authentication context)
const getDoctorByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const doctor = await doctorModel.getDoctorByUserId(userId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ doctor });
  } catch (error) {
    console.error('Error fetching doctor by user ID:', error);
    res.status(500).json({ error: 'Error fetching doctor by user ID' });
  }
};

// Update doctor profile
const updateDoctorProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Validate required fields
    if (!profileData.name || !profileData.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const updatedProfile = await doctorModel.updateDoctorProfile(userId, profileData);
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      doctor: updatedProfile 
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Error updating doctor profile' });
  }
};

module.exports = {
  getDoctorAppointments,
  getUpcomingAppointments,
  getTodaysAppointments,
  getNextAppointment,
  updateAppointmentStatus,
  getDoctorDashboard,
  getDoctorByUserId,
  updateDoctorProfile
};