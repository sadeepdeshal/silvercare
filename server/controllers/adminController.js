// Try to import pool the same way as your other files
// Check your doctorController.js or other controllers to see the correct import
const pool = require('../db'); // Update this based on your other controllers

const getAdminDashboard = async (req, res) => {
  try {
    console.log('=== ADMIN DASHBOARD DEBUG START ===');
    
    // Get basic stats using the correct status values
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM "User" WHERE role = 'family_member') as family_members,
        (SELECT COUNT(*) FROM "User" WHERE role = 'elder') as elders,
        (SELECT COUNT(*) FROM "User" WHERE role = 'caregiver') as caregivers,
        (SELECT COUNT(*) FROM doctor WHERE status = 'confirmed') as active_doctors,
        (SELECT COUNT(*) FROM doctor WHERE status = 'pending') as pending_doctors,
        (SELECT COUNT(*) FROM appointment WHERE date_time >= CURRENT_TIMESTAMP) as upcoming_appointments
    `;
    
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];
    console.log('Stats result:', stats);

    // Get pending doctors with full details
    const pendingDoctorsQuery = `
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
        u.created_at
      FROM doctor d
      JOIN "User" u ON d.user_id = u.user_id
      WHERE d.status = 'pending'
      ORDER BY u.created_at DESC
    `;
    
    const pendingResult = await pool.query(pendingDoctorsQuery);
    console.log('Pending doctors found:', pendingResult.rows.length);
    console.log('Pending doctors data:', pendingResult.rows);
    
    const pendingDoctors = pendingResult.rows;

    // Get recent registrations
    const recentRegistrationsQuery = `
      SELECT user_id, name, email, role, created_at
      FROM "User"
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const recentRegistrationsResult = await pool.query(recentRegistrationsQuery);
    const recentRegistrations = recentRegistrationsResult.rows;

    // Get new bookings (appointments in last 7 days)
    const newBookingsQuery = `
      SELECT COUNT(*) as count
      FROM appointment
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;
    
    let newBookings = 0;
    try {
      const newBookingsResult = await pool.query(newBookingsQuery);
      newBookings = parseInt(newBookingsResult.rows[0]?.count || 0);
    } catch (bookingError) {
      console.log('Error getting new bookings:', bookingError.message);
    }

    // Get monthly signups
    const monthlySignupsQuery = `
      SELECT COUNT(*) as count
      FROM "User"
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const monthlySignupsResult = await pool.query(monthlySignupsQuery);
    const monthlySignups = parseInt(monthlySignupsResult.rows[0]?.count || 0);

    const responseData = {
      success: true,
      data: {
        stats: stats,
        pendingDoctors: pendingDoctors,
        pendingHealthProfessionals: [], // Add empty array for health professionals
        recentRegistrations: recentRegistrations,
        newBookings: newBookings,
        monthlySignups: monthlySignups
      }
    };

    console.log('Final response:');
    console.log('- Pending doctors count:', pendingDoctors.length);
    console.log('- Stats pending_doctors:', stats.pending_doctors);
    console.log('=== ADMIN DASHBOARD DEBUG END ===');

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    });
  }
};

const approveProfessional = async (req, res) => {
  try {
    const { type, id } = req.params;
    console.log(`Approving ${type} with ID: ${id}`);
    
    if (type === 'doctor') {
      // Use 'confirmed' as the approved status
      const result = await pool.query(
        'UPDATE doctor SET status = $1 WHERE doctor_id = $2 RETURNING *', 
        ['confirmed', id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Doctor not found' 
        });
      }
      
      console.log('Doctor approved successfully:', result.rows[0]);
    }
    
    res.json({ 
      success: true, 
      message: `${type} approved successfully` 
    });
    
  } catch (error) {
    console.error('Error approving professional:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to approve professional',
      details: error.message 
    });
  }
};

const rejectProfessional = async (req, res) => {
  try {
    const { type, id } = req.params;
    console.log(`Rejecting ${type} with ID: ${id}`);
    
    if (type === 'doctor') {
      // Use 'rejected' as the rejected status
      const result = await pool.query(
        'UPDATE doctor SET status = $1 WHERE doctor_id = $2 RETURNING *', 
        ['rejected', id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Doctor not found' 
        });
      }
      
      console.log('Doctor rejected successfully:', result.rows[0]);
    }
    
    res.json({ 
      success: true, 
      message: `${type} rejected successfully` 
    });
    
  } catch (error) {
    console.error('Error rejecting professional:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reject professional',
      details: error.message 
    });
  }
};

module.exports = {
  getAdminDashboard,
  approveProfessional,
  rejectProfessional
};