const pool = require('../db');
const bcrypt = require('bcryptjs'); // Add this import
const { sendDoctorApprovalEmail, sendHealthProfessionalApprovalEmail } = require('../services/emailservice'); // Add this import

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
        (SELECT COUNT(*) FROM counselor WHERE status = 'confirmed') as active_health_professionals,
        (SELECT COUNT(*) FROM counselor WHERE status = 'pending') as pending_health_professionals,
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

    // Get pending health professionals with full details
    const pendingHealthProfessionalsQuery = `
      SELECT 
        c.counselor_id as health_professional_id,
        c.user_id,
        c.specialization,
        c.license_number,
        c.alternative_number,
        c.current_institution,
        c.years_of_experience,
        c.status,
        u.name,
        u.email,
        u.phone,
        u.created_at
      FROM counselor c
      JOIN "User" u ON c.user_id = u.user_id
      WHERE c.status = 'pending'
      ORDER BY u.created_at DESC
    `;
    
    const pendingHealthProfessionalsResult = await pool.query(pendingHealthProfessionalsQuery);
    console.log('Pending health professionals found:', pendingHealthProfessionalsResult.rows.length);
    console.log('Pending health professionals data:', pendingHealthProfessionalsResult.rows);
    
    const pendingHealthProfessionals = pendingHealthProfessionalsResult.rows;

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
        pendingHealthProfessionals: pendingHealthProfessionals, // Add health professionals data
        recentRegistrations: recentRegistrations,
        newBookings: newBookings,
        monthlySignups: monthlySignups
      }
    };

    console.log('Final response:');
    console.log('- Pending doctors count:', pendingDoctors.length);
    console.log('- Stats pending_doctors:', stats.pending_doctors);
    console.log('- Pending health professionals count:', pendingHealthProfessionals.length);
    console.log('- Stats pending_health_professionals:', stats.pending_health_professionals);
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
      // First, get the doctor's details including user information
      const doctorQuery = `
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
          u.phone
        FROM doctor d
        JOIN "User" u ON d.user_id = u.user_id
        WHERE d.doctor_id = $1
      `;
      
      const doctorResult = await pool.query(doctorQuery, [id]);
      
      if (doctorResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Doctor not found' 
        });
      }
      
      const doctorData = doctorResult.rows[0];
      console.log('Doctor data found:', doctorData);
      
      // Send approval email and get the temporary password
      const emailResult = await sendDoctorApprovalEmail(doctorData);
      
      if (emailResult.success) {
        // Hash the temporary password
        const hashedPassword = await bcrypt.hash(emailResult.tempPassword, 10);
        
        // Begin transaction
        await pool.query('BEGIN');
        
        try {
          // Update doctor status to confirmed
          const updateDoctorResult = await pool.query(
            'UPDATE doctor SET status = $1 WHERE doctor_id = $2 RETURNING *', 
            ['confirmed', id]
          );
          
          // Update user password with the temporary password
          const updateUserResult = await pool.query(
            'UPDATE "User" SET password = $1 WHERE user_id = $2 RETURNING *',
            [hashedPassword, doctorData.user_id]
          );
          
          // Commit transaction
          await pool.query('COMMIT');
          
          console.log('Doctor approved successfully:', updateDoctorResult.rows[0]);
          console.log('User password updated successfully');
          
          res.json({ 
            success: true, 
            message: 'Doctor approved successfully. Approval email sent with temporary password.',
            emailSent: true,
            messageId: emailResult.messageId
          });
          
        } catch (dbError) {
          // Rollback transaction
          await pool.query('ROLLBACK');
          throw dbError;
        }
        
      } else {
        throw new Error('Failed to send approval email');
      }
      
    } else if (type === 'healthprofessional') {
      // First, get the health professional's details including user information
      const healthProfessionalQuery = `
        SELECT 
          c.counselor_id,
          c.user_id,
          c.specialization,
          c.license_number,
          c.alternative_number,
          c.current_institution,
          c.years_of_experience,
          c.status,
          u.name,
          u.email,
          u.phone
        FROM counselor c
        JOIN "User" u ON c.user_id = u.user_id
        WHERE c.counselor_id = $1
      `;
      
      const healthProfessionalResult = await pool.query(healthProfessionalQuery, [id]);
      
      if (healthProfessionalResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Health professional not found' 
        });
      }
      
      const healthProfessionalData = healthProfessionalResult.rows[0];
      console.log('Health professional data found:', healthProfessionalData);
      
      // Send approval email and get the temporary password
      const emailResult = await sendHealthProfessionalApprovalEmail(healthProfessionalData);
      
      if (emailResult.success) {
        // Hash the temporary password
        const hashedPassword = await bcrypt.hash(emailResult.tempPassword, 10);
        
        // Begin transaction
        await pool.query('BEGIN');
        
        try {
          // Update health professional status to confirmed
          const updateHealthProfessionalResult = await pool.query(
            'UPDATE counselor SET status = $1 WHERE counselor_id = $2 RETURNING *', 
            ['confirmed', id]
          );
          
          // Update user password with the temporary password
          const updateUserResult = await pool.query(
            'UPDATE "User" SET password = $1 WHERE user_id = $2 RETURNING *',
            [hashedPassword, healthProfessionalData.user_id]
          );
          
          // Commit transaction
          await pool.query('COMMIT');
          
          console.log('Health professional approved successfully:', updateHealthProfessionalResult.rows[0]);
          console.log('User password updated successfully');
          
          res.json({ 
            success: true, 
            message: 'Health professional approved successfully. Approval email sent with temporary password.',
            emailSent: true,
            messageId: emailResult.messageId
          });
          
        } catch (dbError) {
          // Rollback transaction
          await pool.query('ROLLBACK');
          throw dbError;
        }
        
      } else {
        throw new Error('Failed to send approval email');
      }
      
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid professional type' 
      });
    }
    
  } catch (error) {
    console.error('Error approving professional:', error);
    
    // Rollback transaction if it was started
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
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
      
      // TODO: Optionally send rejection email to doctor
      // You can implement this similar to the approval email
      
    } else if (type === 'healthprofessional') {
      // Use 'rejected' as the rejected status
      const result = await pool.query(
        'UPDATE counselor SET status = $1 WHERE counselor_id = $2 RETURNING *', 
        ['rejected', id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Health professional not found' 
        });
      }
      
      console.log('Health professional rejected successfully:', result.rows[0]);
      
      // TODO: Optionally send rejection email to health professional
      // You can implement this similar to the approval email
      
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid professional type' 
      });
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