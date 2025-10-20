process.env.TZ = 'Asia/Colombo';
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

// Join appointment (for doctors)
const joinAppointment = async (req, res) => {
  const { doctorId, appointmentId } = req.params;

  try {
    // Check if appointment exists, belongs to doctor, is online, and confirmed
    const appointmentCheck = await doctorModel.getAppointmentForJoin(appointmentId, doctorId);

    if (!appointmentCheck) {
      return res.status(404).json({
        success: false,
        error: "Online appointment not found or not confirmed",
      });
    }

    const appointment = appointmentCheck;

    // Check if appointment is within the allowed time window (15 minutes before to 30 minutes after)
    const appointmentTime = new Date(appointment.date_time);
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 15) {
      return res.status(400).json({
        success: false,
        error: "You can only join the appointment 15 minutes before the scheduled time",
      });
    }

    if (minutesDiff < -60) { // Allow joining up to 1 hour after start time
      return res.status(400).json({
        success: false,
        error: "This appointment has ended",
      });
    }

    // Generate or retrieve meeting link
    let meetingLink = appointment.zoom_join_url;
    
    if (!meetingLink) {
      // Generate unique meeting link
      const meetingId = `doc-${doctorId}-apt-${appointmentId}-${Date.now()}`;
      meetingLink = `http://localhost:3000/consultation/${meetingId}?doctor=${doctorId}&patient=${appointment.elder_id}&type=consultation`;
      
      // Update appointment with meeting link
      await doctorModel.updateAppointmentMeetingLink(appointmentId, meetingLink, meetingId);
    }

    res.json({
      success: true,
      message: "Joining appointment",
      meetingLink: meetingLink,
      appointment: {
        appointment_id: appointment.appointment_id,
        patient_name: appointment.elder_name,
        date_time: appointment.date_time,
        appointment_type: appointment.appointment_type,
        status: appointment.status
      },
    });
  } catch (err) {
    console.error("Error joining appointment:", err);
    res.status(500).json({
      success: false,
      error: "Error joining appointment",
    });
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


// Get family members who have appointments with this doctor
const getFamilyMembersWithAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const familyMembers = await doctorModel.getFamilyMembersWithAppointments(doctorId);
    
    res.json({
      success: true,
      familyMembers: familyMembers,
      count: familyMembers.length
    });
  } catch (error) {
    console.error('Error fetching family members with appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch family members with appointments'
    });
  }
};

// Get appointment history between doctor and specific family member
const getAppointmentHistoryWithFamilyMember = async (req, res) => {
  try {
    const { doctorId, familyMemberId } = req.params;
    
    const appointments = await doctorModel.getAppointmentHistoryWithFamilyMember(doctorId, familyMemberId);
    
    res.json({
      success: true,
      appointments: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Error fetching appointment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointment history'
    });
  }
};

// Get appointment statistics for a doctor
const getDoctorAppointmentStatistics = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    
    const statistics = await doctorModel.getDoctorAppointmentStatistics(doctorId);
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching appointment statistics:', error);
    res.status(500).json({ error: 'Error fetching appointment statistics' });
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
  updateDoctorProfile,
  getFamilyMembersWithAppointments,
  getAppointmentHistoryWithFamilyMember,
  joinAppointment,
  getDoctorAppointmentStatistics
};