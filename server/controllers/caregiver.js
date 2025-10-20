const pool = require('../db');
const StatusUpdateService = require('../services/StatusUpdateService');

// Get care request details by ID(role caregiver)
const getCareRequestById = async (req, res) => {
  const { requestId } = req.params;
  
  try {
    console.log('Fetching care request details for ID:', requestId);
    
    const result = await pool.query(`
      SELECT 
        cr.request_id,
        cr.family_id,
        cr.caregiver_id,
        cr.elder_id,
        cr.start_date,
        cr.end_date,
        cr.status,
        cr.duration,
        cr.request_date,
        e.name as elder_name,
        e.age as elder_age,
        e.gender as elder_gender,
        e.contact as elder_contact,
        e.address as elder_address,
        e.medical_conditions,
        e.profile_photo as elder_photo,
        e.email as elder_email,
        e.district as elder_district,
        fm.name as family_member_name,
        fm.email as family_member_email,
        fm.phone as family_member_phone,
        c.certifications as caregiver_certifications,
        c.availability as caregiver_availability,
        cu.name as caregiver_name
      FROM carerequest cr
      INNER JOIN elder e ON cr.elder_id = e.elder_id
      INNER JOIN "User" fm ON cr.family_id = fm.user_id
      INNER JOIN caregiver c ON cr.caregiver_id = c.caregiver_id
      INNER JOIN "User" cu ON c.user_id = cu.user_id
      WHERE cr.request_id = $1
    `, [requestId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Care request not found'
      });
    }
    
    const careRequest = result.rows[0];
    console.log('Care request details fetched successfully');
    
    res.json({
      success: true,
      careRequest: careRequest
    });
    
  } catch (err) {
    console.error('Error fetching care request details:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching care request details' 
    });
  }
};

//get assigned elders(role caregiver)
const getAssignedElders = async (req, res) => {
  const caregiverId = req.params.id;

  try {
    // Auto-update expired requests using the service
    await StatusUpdateService.updateExpiredRequestsForCaregiver(caregiverId);

     const query = `SELECT 
        e.elder_id,
        e.name,
        e.age,
        cr.duration,
        cr.status,
        cr.start_date,
        cr.end_date,
        cr.caregiver_id,
        cr.family_id,
        u.user_id
      FROM carerequest cr
      JOIN elder e ON cr.elder_id = e.elder_id
      JOIN caregiver cg ON cr.caregiver_id = cg.caregiver_id
      JOIN "User" u ON cg.user_id = u.user_id
      WHERE cg.caregiver_id = $1
      ORDER BY cr.end_date DESC`;

    const result = await pool.query(query, [caregiverId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching assigned elders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//get assigner families count (role caregiver)
const getAssignedFamiliesCount = async (req, res) => {
    const caregiverId = req.params.id;

  try {
    const query = `
      SELECT COUNT(DISTINCT cr.family_id) AS count
      FROM carerequest cr
      JOIN caregiver cg ON cr.caregiver_id = cg.caregiver_id
      JOIN "User" u ON cg.user_id = u.user_id
      WHERE cr.caregiver_id = $1;
    `;
    const result = await pool.query(query, [caregiverId]);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching assigned families count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//Get carelog count(role caregiver)
const getcarelogsCount = async (req, res) => {
    const caregiverId = req.params.id;

  try {
    const query = `
      SELECT COUNT (cl.log_id) AS count
      FROM carelog cl
      JOIN caregiver cg ON cl.caregiver_id = cg.caregiver_id
      JOIN "User" u ON cg.user_id = u.user_id
      WHERE cl.caregiver_id = $1;
    `;
    const result = await pool.query(query, [caregiverId]);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching carelogs count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//fetch caregiver schedules (role caregiver)
const fetchSchedules = async (req, res) => {
  const caregiverId = req.params.id;

  try {

     const query = `
      SELECT 
        e.name,
        e.address ,
        cr.start_date,
        cr.end_date
      FROM carerequest cr
      JOIN elder e ON cr.elder_id = e.elder_id
      WHERE cr.caregiver_id = $1
      AND LOWER(cr.status) IN ('upcoming', 'ongoing');
    `;

    const result = await pool.query(query, [caregiverId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching assigned elders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//fetch care requests for caregiver (role caregiver)
const fetchCareRequests = async (req, res) => {
  const caregiverId = req.params.id;
  const { search } = req.query; // Get search parameter from query string

  try {
    // Auto-update expired requests using the service
    await StatusUpdateService.updateExpiredRequestsForCaregiver(caregiverId);
    
    // Update caregiver availability
    await StatusUpdateService.updateCaregiverAvailability(caregiverId);

    let query = `
      SELECT 
        cr.request_id,
        cr.family_id,
        cr.elder_id,
        cr.start_date,
        cr.end_date,
        cr.status,
        cr.duration,
        cr.request_date,
        e.name as elder_name,
        e.age as elder_age,
        e.address as elder_address,
        e.medical_conditions,
        e.contact as elder_contact,
        e.district as elder_district,
        fm.user_id as family_member_user_id,
        u.name as family_member_name,
        u.phone as family_member_phone,
        u.email as family_member_email
      FROM carerequest cr
      JOIN elder e ON cr.elder_id = e.elder_id
      JOIN familymember fm ON cr.family_id = fm.family_id
      JOIN "User" u ON fm.user_id = u.user_id
      WHERE cr.caregiver_id = $1
    `;

    const queryParams = [caregiverId];

    // Add search conditions if search parameter exists
    if (search) {
      query += ` AND (
        LOWER(e.name) LIKE LOWER($2) OR 
        CAST(e.age AS TEXT) LIKE $2 OR 
        LOWER(e.district) LIKE LOWER($2)
      )`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY cr.request_date DESC, cr.start_date ASC;`;

    const result = await pool.query(query, queryParams);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching care requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update caregiver profile(role caregiver)
const updateCaregiverProfile = async (req, res) => {
  const { caregiverId } = req.params;
  const {
    name,
    email,
    phone,
    availability,
    certifications,
    fixed_line,
    district,
    day_rate
  } = req.body;
  
  try {
    console.log('Updating caregiver profile:', caregiverId, req.body);
    
    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and phone are required'
      });
    }
    
    // Convert day_rate to integer, handle empty string
    const dayRateValue = day_rate === '' || day_rate === null || day_rate === undefined 
      ? null 
      : parseInt(day_rate, 10);
    
    console.log('Day rate from request:', day_rate);
    console.log('Converted day_rate value:', dayRateValue);
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current caregiver data
      const caregiverResult = await client.query(
        'SELECT user_id FROM caregiver WHERE caregiver_id = $1',
        [caregiverId]
      );
      
      if (caregiverResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Caregiver not found'
        });
      }
      
      const userId = caregiverResult.rows[0].user_id;
      
      // Update User table
      await client.query(
        'UPDATE "User" SET name = $1, email = $2, phone = $3 WHERE user_id = $4',
        [name, email, phone, userId]
      );
      
      // Update caregiver table with day_rate
      console.log('Updating caregiver table with day_rate:', dayRateValue);
      const updateResult = await client.query(
        'UPDATE caregiver SET availability = $1, certifications = $2, fixed_line = $3, district = $4, day_rate = $5 WHERE caregiver_id = $6',
        [availability, certifications, fixed_line, district, dayRateValue, caregiverId]
      );
      console.log('UPDATE query executed, rows affected:', updateResult.rowCount);
      
      await client.query('COMMIT');
      console.log('Transaction COMMITTED successfully');
      
      // Verify the update in DB immediately after commit
      const verifyResult = await client.query(
        'SELECT availability, day_rate FROM caregiver WHERE caregiver_id = $1',
        [caregiverId]
      );
      console.log('VERIFICATION - After COMMIT:');
      console.log('  availability in DB:', verifyResult.rows[0]?.availability);
      console.log('  day_rate in DB:', verifyResult.rows[0]?.day_rate);
      
      // Fetch updated profile
      const updatedResult = await client.query(`
        SELECT 
          c.caregiver_id,
          c.user_id,
          c.availability,
          c.certifications,
          c.fixed_line,
          c.district,
          c.day_rate,
          u.name as caregiver_name,
          u.email as caregiver_email,
          u.phone as caregiver_phone,
          u.role,
          u.created_at
        FROM caregiver c
        INNER JOIN "User" u ON c.user_id = u.user_id
        WHERE c.caregiver_id = $1
      `, [caregiverId]);
      
      console.log('Updated profile fetched:', updatedResult.rows[0]);
      console.log('Updated availability:', updatedResult.rows[0]?.availability);
      console.log('Updated day_rate:', updatedResult.rows[0]?.day_rate);
      console.log('Caregiver profile updated successfully');
      
      const responseData = {
        success: true,
        message: 'Profile updated successfully',
        caregiver: updatedResult.rows[0]
      };
      
      console.log('=== SENDING RESPONSE TO CLIENT ===');
      console.log('Response availability:', responseData.caregiver.availability);
      console.log('Response day_rate:', responseData.caregiver.day_rate);
      
      // REMOVED: Automatic availability update that was overriding manual changes
      // The StatusUpdateService was automatically setting availability based on assignments,
      // which prevented users from manually setting their own availability status.
      // This service is still called in other endpoints where automatic updates are appropriate.
      
      // await StatusUpdateService.updateCaregiverAvailability(caregiverId);
      
      res.json(responseData);
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Error updating caregiver profile:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating profile' 
    });
  }
};

// Update caregiver password
const updateCaregiverPassword = async (req, res) => {
  const { caregiverId } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  try {
    console.log('Updating caregiver password for ID:', caregiverId);
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }
    
    // Get caregiver's user data
    const caregiverResult = await pool.query(`
      SELECT u.user_id, u.password
      FROM caregiver c
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE c.caregiver_id = $1
    `, [caregiverId]);
    
    if (caregiverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caregiver not found'
      });
    }
    
    const user = caregiverResult.rows[0];
    
    // Verify current password
    const bcrypt = require('bcrypt');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.query(
      'UPDATE "User" SET password = $1 WHERE user_id = $2',
      [hashedNewPassword, user.user_id]
    );
    
    console.log('Password updated successfully');
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating password' 
    });
  }
};

// Get upcoming shifts for caregiver with optional week filtering (confirmed status only)
const getUpcomingShifts = async (req, res) => {
  const caregiverId = req.params.id;
  const { startDate, endDate } = req.query; // Optional week range parameters
  
  try {
    // Auto-update expired requests using the service
    await StatusUpdateService.updateExpiredRequestsForCaregiver(caregiverId);
    
    // Update caregiver availability
    await StatusUpdateService.updateCaregiverAvailability(caregiverId);
    
    let query;
    let queryParams;
    
    if (startDate && endDate) {
      // Week-based filtering for confirmed shifts
      query = `
        SELECT 
          cr.request_id,
          cr.elder_id,
          cr.start_date,
          cr.end_date,
          cr.status,
          cr.duration,
          e.name as elder_name,
          e.address as location
        FROM carerequest cr
        JOIN elder e ON cr.elder_id = e.elder_id
        WHERE cr.caregiver_id = $1
          AND LOWER(cr.status) = 'confirmed'
          AND cr.start_date >= $2
          AND cr.start_date <= $3
        ORDER BY cr.start_date ASC;
      `;
      queryParams = [caregiverId, startDate, endDate];
    } else {
      // Default: fetch all future confirmed shifts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = `
        SELECT 
          cr.request_id,
          cr.elder_id,
          cr.start_date,
          cr.end_date,
          cr.status,
          cr.duration,
          e.name as elder_name,
          e.address as location
        FROM carerequest cr
        JOIN elder e ON cr.elder_id = e.elder_id
        WHERE cr.caregiver_id = $1
          AND LOWER(cr.status) = 'confirmed'
          AND cr.start_date >= $2
        ORDER BY cr.start_date ASC;
      `;
      queryParams = [caregiverId, today];
    }
    
    const result = await pool.query(query, queryParams);
    console.log('Raw upcoming shifts from DB:', result.rows);
    
    // Format for frontend: return all fields needed for dashboard
    const shifts = result.rows.map(row => {
      // Include request_id for frontend navigation
      return {
        request_id: row.request_id,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        duration: row.duration,
        location: row.location,
        elderName: row.elder_name
      };
    });
    
    console.log('Formatted upcoming shifts for frontend:', shifts);
    res.status(200).json(shifts);
  } catch (error) {
    console.error('Error fetching upcoming shifts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all carelogs for a caregiver
const getCarelogs = async (req, res) => {
  const caregiverId = req.params.id;
  try {
    const query = `
      SELECT cl.log_id as carelog_id, cl.elder_id, cl.caregiver_id, cl.notes, cl.mood, cl.date, e.name as elder_name
      FROM carelog cl
      JOIN elder e ON cl.elder_id = e.elder_id
      WHERE cl.caregiver_id = $1
      ORDER BY cl.date DESC;
    `;
    const result = await pool.query(query, [caregiverId]);
    res.status(200).json({ carelogs: result.rows });
  } catch (error) {
    console.error('Error fetching carelogs:', error);
    res.status(500).json({ carelogs: [] });
  }
};

// Add a new carelog for a caregiver
const addCarelog = async (req, res) => {
  const caregiverId = req.params.id;
  const { elder_id, notes, mood } = req.body;
  try {
    const query = `
      INSERT INTO carelog (elder_id, caregiver_id, notes, mood, date)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING log_id as carelog_id, elder_id, caregiver_id, notes, mood, date;
    `;
    const result = await pool.query(query, [elder_id, caregiverId, notes, mood]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding carelog:', error);
    res.status(500).json({ error: 'Failed to add carelog' });
  }
};

// Get elder details with family information
const getElderDetails = async (req, res) => {
  const { elderId } = req.params;
  console.log('Backend: getElderDetails called with elderId:', elderId);
  
  try {
    const query = `
      SELECT 
        e.elder_id,
        e.name,
        e.dob,
        e.age,
        e.gender,
        e.contact,
        e.address,
        e.nic,
        e.medical_conditions,
        e.profile_photo,
        e.email,
        e.district,
        e.created_at,
        fm.family_id,
        u.user_id as family_user_id,
        u.name as family_name,
        u.email as family_email,
        u.phone as family_phone,
        fm.address as family_address,
        fm.phone_fixed as family_phone_fixed
      FROM elder e
      JOIN familymember fm ON e.family_id = fm.family_id
      JOIN "User" u ON fm.user_id = u.user_id
      WHERE e.elder_id = $1;
    `;
    
    console.log('Backend: Executing query:', query);
    console.log('Backend: Query parameters:', [elderId]);
    
    const result = await pool.query(query, [elderId]);
    console.log('Backend: Query result rows count:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('Backend: No elder found with id:', elderId);
      return res.status(404).json({ error: 'Elder not found' });
    }
    
    const data = result.rows[0];
    console.log('Backend: Raw data from DB:', data);
    
    const elder = {
      elder_id: data.elder_id,
      name: data.name,
      dob: data.dob,
      age: data.age,
      gender: data.gender,
      contact: data.contact,
      address: data.address,
      nic: data.nic,
      medical_conditions: data.medical_conditions,
      profile_photo: data.profile_photo,
      email: data.email,
      district: data.district,
      created_at: data.created_at
    };
    
    const familyMember = {
      family_id: data.family_id,
      user_id: data.family_user_id,
      name: data.family_name,
      email: data.family_email,
      phone: data.family_phone,
      address: data.family_address,
      phone_fixed: data.family_phone_fixed
    };
    
    console.log('Backend: Formatted elder:', elder);
    console.log('Backend: Formatted familyMember:', familyMember);
    
    res.status(200).json({ elder, familyMember });
  } catch (error) {
    console.error('Backend: Error fetching elder details:', error);
    console.error('Backend: Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch elder details', details: error.message });
  }
};

// Get carelogs for specific elder
const getElderCarelogs = async (req, res) => {
  const { caregiverId, elderId } = req.params;
  try {
    const query = `
      SELECT 
        cl.log_id as carelog_id,
        cl.elder_id,
        cl.caregiver_id,
        cl.notes,
        cl.mood,
        cl.date,
        cl.health_status,
        cl.medications_given,
        cl.activities,
        cl.concerns,
        e.name as elder_name
      FROM carelog cl
      JOIN elder e ON cl.elder_id = e.elder_id
      WHERE cl.caregiver_id = $1 AND cl.elder_id = $2
      ORDER BY cl.date DESC;
    `;
    const result = await pool.query(query, [caregiverId, elderId]);
    res.status(200).json({ carelogs: result.rows });
  } catch (error) {
    console.error('Error fetching elder carelogs:', error);
    res.status(500).json({ carelogs: [] });
  }
};

// Add detailed elder report
const addElderReport = async (req, res) => {
  const { caregiverId, elderId } = req.params;
  const { notes, mood, health_status, medications_given, activities, concerns } = req.body;
  
  try {
    const query = `
      INSERT INTO carelog 
      (elder_id, caregiver_id, notes, mood, date, health_status, medications_given, activities, concerns)
      VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
      RETURNING 
        log_id as carelog_id, 
        elder_id, 
        caregiver_id, 
        notes, 
        mood, 
        date,
        health_status,
        medications_given,
        activities,
        concerns;
    `;
    const result = await pool.query(query, [
      elderId, 
      caregiverId, 
      notes, 
      mood, 
      health_status, 
      medications_given, 
      activities, 
      concerns
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding elder report:', error);
    res.status(500).json({ error: 'Failed to add elder report' });
  }
};

// Get weekly reports for daily care section
const getWeeklyReports = async (req, res) => {
  const { caregiverId } = req.params;
  const { startDate, endDate } = req.query;
  
  // Helper function to format date without timezone issues  
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  try {
    console.log('Fetching weekly reports for caregiver:', caregiverId, 'from', startDate, 'to', endDate);
    
    // Update caregiver availability before fetching reports
    await StatusUpdateService.updateCaregiverAvailability(caregiverId);
    
    // First, get all care assignments for the caregiver in the date range (confirmed and completed status)
    const assignmentQuery = `
      SELECT DISTINCT
        cr.elder_id,
        e.name as elder_name,
        cr.start_date,
        cr.end_date,
        cr.status
      FROM carerequest cr
      JOIN elder e ON cr.elder_id = e.elder_id
      WHERE cr.caregiver_id = $1
        AND cr.status IN ('confirmed', 'completed')
        AND cr.start_date <= $3::date 
        AND cr.end_date >= $2::date
      ORDER BY e.name;
    `;
    
    const assignmentResult = await pool.query(assignmentQuery, [caregiverId, startDate, endDate]);
    console.log('Found confirmed and completed assignments:', assignmentResult.rows);
    
    // Get existing reports for the date range
    const reportsQuery = `
      SELECT 
        cl.elder_id,
        cl.date,
        cl.log_id IS NOT NULL as has_report,
        cl.notes,
        cl.mood,
        cl.health_status,
        cl.medications_given,
        cl.activities,
        cl.concerns
      FROM carelog cl
      WHERE cl.caregiver_id = $1
        AND cl.date >= $2::date 
        AND cl.date <= $3::date;
    `;
    
    const reportsResult = await pool.query(reportsQuery, [caregiverId, startDate, endDate]);
    console.log('Found existing reports:', reportsResult.rows);
    
    // Create reports by date map
    const reportsByDate = {};
    
    reportsResult.rows.forEach(report => {
      const dateKey = formatDateLocal(report.date); // Use timezone-safe formatting
      if (!reportsByDate[dateKey]) {
        reportsByDate[dateKey] = {};
      }
      reportsByDate[dateKey][report.elder_id] = {
        hasReport: report.has_report,
        existingReport: {
          notes: report.notes,
          mood: report.mood,
          health_status: report.health_status,
          medications_given: report.medications_given,
          activities: report.activities,
          concerns: report.concerns
        }
      };
    });
    
    // Create 7 days array - always return 7 days regardless of assignments
    const weeklyReports = [];
    const startDateObj = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + i);
      const dateKey = formatDateLocal(currentDate); // Use timezone-safe formatting
      
      // Find assignment for this date
      let dayAssignment = null;
      for (const assignment of assignmentResult.rows) {
        const assignStart = new Date(assignment.start_date);
        const assignEnd = new Date(assignment.end_date);
        assignStart.setHours(0, 0, 0, 0);
        assignEnd.setHours(23, 59, 59, 999);
        
        if (currentDate >= assignStart && currentDate <= assignEnd) {
          dayAssignment = assignment;
          break;
        }
      }
      
      if (dayAssignment) {
        // There's a confirmed or completed assignment for this day
        const elderId = dayAssignment.elder_id;
        const reportData = reportsByDate[dateKey] && reportsByDate[dateKey][elderId];
        
        weeklyReports.push({
          date: dateKey,
          elder_id: elderId,
          elder_name: dayAssignment.elder_name,
          status: dayAssignment.status,
          hasReport: reportData ? reportData.hasReport : false,
          existingReport: reportData ? reportData.existingReport : null
        });
      } else {
        // No confirmed or completed assignment for this day
        weeklyReports.push({
          date: dateKey,
          elder_id: null,
          elder_name: 'No care today',
          hasReport: false,
          existingReport: null
        });
      }
    }
    
    console.log('Final weekly reports:', weeklyReports);
    res.json(weeklyReports);
  } catch (error) {
    console.error('Error fetching weekly reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit daily report
const submitDailyReport = async (req, res) => {
  const { caregiverId } = req.params;
  const { elder_id, notes, mood, health_status, medications_given, activities, concerns, date } = req.body;
  
  console.log('=== SUBMIT DAILY REPORT DEBUG ===');
  console.log('Received date from frontend:', date);
  console.log('Type of date:', typeof date);
  console.log('Date as Date object:', new Date(date));
  console.log('Date as ISO string:', new Date(date).toISOString());
  console.log('Date split by T[0]:', new Date(date).toISOString().split('T')[0]);
  
  try {
    // Check if report already exists for this date
    const existingQuery = `
      SELECT log_id FROM carelog 
      WHERE elder_id = $1 AND caregiver_id = $2 AND date = $3
    `;
    const existingResult = await pool.query(existingQuery, [elder_id, caregiverId, date]);
    
    let query, result;
    
    if (existingResult.rows.length > 0) {
      // Update existing report
      query = `
        UPDATE carelog 
        SET notes = $4, mood = $5, health_status = $6, medications_given = $7, activities = $8, concerns = $9
        WHERE elder_id = $1 AND caregiver_id = $2 AND date = $3
        RETURNING *;
      `;
      result = await pool.query(query, [elder_id, caregiverId, date, notes, mood, health_status, medications_given, activities, concerns]);
    } else {
      // Insert new report
      query = `
        INSERT INTO carelog (elder_id, caregiver_id, notes, mood, health_status, medications_given, activities, concerns, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      result = await pool.query(query, [elder_id, caregiverId, notes, mood, health_status, medications_given, activities, concerns, date]);
    }
    
    res.json({ success: true, carelog: result.rows[0] });
  } catch (error) {
    console.error('Error submitting daily report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCareRequestById,
  getAssignedElders,
  getAssignedFamiliesCount,
  getcarelogsCount,
  fetchSchedules,
  fetchCareRequests,
  updateCaregiverProfile,
  updateCaregiverPassword,
  getUpcomingShifts,
  getCarelogs,
  addCarelog,
  getElderDetails,
  getElderCarelogs,
  addElderReport,
  getWeeklyReports,
  submitDailyReport
};
