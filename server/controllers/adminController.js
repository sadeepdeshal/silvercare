const pool = require('../db');

const getAdminDashboard = async (req, res) => {
  console.log('Admin dashboard endpoint hit');
  
  try {
    // Fetch all dashboard data in parallel
    const [
      newBookingsResult,
      monthlySignupsResult,
      pendingDoctorsResult,
      recentRegistrationsResult,
      dashboardStatsResult
    ] = await Promise.all([
      // New bookings (last 7 days)
      pool.query(`
        SELECT COUNT(*) as count 
        FROM appointment 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `).catch(() => ({ rows: [{ count: 0 }] })),
      
      // Monthly signups
      pool.query(`
        SELECT COUNT(*) as count 
        FROM "User" 
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `),
      
      // Pending doctors for approval
      pool.query(`
        SELECT d.*, u.name, u.email, u.phone 
        FROM doctor d 
        JOIN "User" u ON d.user_id = u.user_id 
        WHERE d.status = 'pending' 
        ORDER BY d.created_at DESC 
        LIMIT 10
      `).catch(() => ({ rows: [] })),
      
      // Recent registrations (simplified without CASE statement)
      pool.query(`
        SELECT u.user_id, u.name, u.email, u.role, u.created_at
        FROM "User" u
        WHERE u.role != 'admin'
        ORDER BY u.created_at DESC 
        LIMIT 15
      `),
      
      // Dashboard statistics
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM "User" WHERE role = 'family_member') as family_members,
          (SELECT COUNT(*) FROM "User" WHERE role = 'elder') as elders,
          (SELECT COUNT(*) FROM "User" WHERE role = 'caregiver') as caregivers,
          (SELECT COUNT(*) FROM doctor WHERE status = 'confirmed') as active_doctors,
          (SELECT COUNT(*) FROM doctor WHERE status = 'pending') as pending_doctors,
          0 as upcoming_appointments
      `).catch(() => ({
        rows: [{
          family_members: 0,
          elders: 0,
          caregivers: 0,
          active_doctors: 0,
          pending_doctors: 0,
          upcoming_appointments: 0
        }]
      }))
    ]);

    // Add status information separately for recent registrations
    const recentRegistrationsWithStatus = await Promise.all(
      recentRegistrationsResult.rows.map(async (user) => {
        let status = 'active';
        
        if (user.role === 'doctor') {
          try {
            const doctorStatus = await pool.query(
              'SELECT status FROM doctor WHERE user_id = $1',
              [user.user_id]
            );
            if (doctorStatus.rows.length > 0) {
              status = doctorStatus.rows[0].status;
            }
          } catch (err) {
            console.log('Error fetching doctor status:', err.message);
          }
        }
        
        return {
          ...user,
          status: status
        };
      })
    );

    const dashboardData = {
      newBookings: parseInt(newBookingsResult.rows[0].count || 0),
      monthlySignups: parseInt(monthlySignupsResult.rows[0].count || 0),
      pendingDoctors: pendingDoctorsResult.rows || [],
      recentRegistrations: recentRegistrationsWithStatus || [],
      stats: dashboardStatsResult.rows[0] || {
        family_members: 0,
        elders: 0,
        caregivers: 0,
        active_doctors: 0,
        pending_doctors: 0,
        upcoming_appointments: 0
      }
    };

    console.log('Dashboard data prepared:', dashboardData);

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching dashboard data', 
      details: error.message 
    });
  }
};

const approveProfessional = async (req, res) => {
  const { professionalId, type } = req.params;
  console.log('Approving professional:', type, professionalId);
  
  try {
    let query;
    if (type === 'doctor') {
      query = 'UPDATE doctor SET status = $1 WHERE doctor_id = $2 RETURNING *';
    } else {
      return res.status(400).json({ success: false, error: 'Invalid professional type' });
    }

    const result = await pool.query(query, ['confirmed', professionalId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Professional not found' });
    }

    res.json({
      success: true,
      message: `${type} approved successfully`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error approving professional:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error approving professional', 
      details: error.message 
    });
  }
};

const rejectProfessional = async (req, res) => {
  const { professionalId, type } = req.params;
  console.log('Rejecting professional:', type, professionalId);
  
  try {
    let query;
    if (type === 'doctor') {
      query = 'UPDATE doctor SET status = $1 WHERE doctor_id = $2 RETURNING *';
    } else {
      return res.status(400).json({ success: false, error: 'Invalid professional type' });
    }

    const result = await pool.query(query, ['rejected', professionalId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Professional not found' });
    }

    res.json({
      success: true,
      message: `${type} rejected successfully`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error rejecting professional:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error rejecting professional', 
      details: error.message 
    });
  }
};

const getAllUsers = async (req, res) => {
  console.log('Getting all users');
  
  try {
    // Get users without the problematic CASE statement
    const usersResult = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.role, u.created_at
      FROM "User" u
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);

    // Add status information separately
    const usersWithStatus = await Promise.all(
      usersResult.rows.map(async (user) => {
        let status = 'active';
        
        if (user.role === 'doctor') {
          try {
            const doctorStatus = await pool.query(
              'SELECT status FROM doctor WHERE user_id = $1',
              [user.user_id]
            );
            if (doctorStatus.rows.length > 0) {
              status = doctorStatus.rows[0].status;
            }
          } catch (err) {
            console.log('Error fetching doctor status:', err.message);
          }
        }
        
        return {
          ...user,
          status: status
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStatus
    });

  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching users', 
      details: error.message 
    });
  }
};

module.exports = {
  getAdminDashboard,
  approveProfessional,
  rejectProfessional,
  getAllUsers
};