const pool = require('../db');

// Get all approved caregivers
const getAllCaregivers = async (req, res) => {
  try {
    console.log('Fetching all approved caregivers');
    
    const result = await pool.query(`
      SELECT 
        c.caregiver_id,
        c.user_id,
        c.availability,
        c.certifications,
        c.fixed_line,
        c.district,
        u.name as caregiver_name,
        u.email as caregiver_email,
        u.phone as caregiver_phone,
        u.role,
        u.created_at
      FROM caregiver c
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE u.role = 'caregiver' AND c.availability = 'available'
      ORDER BY u.created_at DESC
    `);
    
    console.log('Found caregivers:', result.rows.length);
    
    res.json({
      success: true,
      caregivers: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching caregivers:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching caregivers data' 
    });
  }
};

// Get caregiver by ID
const getCaregiverById = async (req, res) => {
  const { caregiverId } = req.params;
  
  try {
    console.log('Fetching caregiver with ID:', caregiverId);
    
    const result = await pool.query(`
      SELECT 
        c.caregiver_id,
        c.user_id,
        c.availability,
        c.certifications,
        c.fixed_line,
        c.district,
        u.name as caregiver_name,
        u.email as caregiver_email,
        u.phone as caregiver_phone,
        u.role,
        u.created_at
      FROM caregiver c
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE c.caregiver_id = $1
    `, [caregiverId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caregiver not found'
      });
    }
    
    console.log('Caregiver found:', result.rows[0].caregiver_name);
    
    res.json({
      success: true,
      caregiver: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error fetching caregiver:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching caregiver data' 
    });
  }
};

// Create care request (book caregiver)
const createCareRequest = async (req, res) => {
  const { caregiverId } = req.params;
  const {
    elder_id,
    family_member_id,
    start_date,
    end_date
  } = req.body;
  
  try {
    console.log('Creating care request:', {
      caregiverId,
      elder_id,
      family_member_id,
      start_date,
      end_date
    });

    // Validate required fields
    if (!elder_id || !family_member_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled'
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be in the past'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }

    // Check if caregiver exists and is available
    const caregiverCheck = await pool.query(
      'SELECT * FROM caregiver WHERE caregiver_id = $1 AND availability = $2',
      [caregiverId, 'available']
    );
    
    if (caregiverCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caregiver not found or not available'
      });
    }

    // Get family_id from family member
    const familyMemberCheck = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [family_member_id]
    );
    
    if (familyMemberCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }

    const family_id = familyMemberCheck.rows[0].family_id;

    // Check if elder exists and belongs to the family
    const elderCheck = await pool.query(`
      SELECT e.elder_id, e.family_id, e.name as elder_name
      FROM elder e
      WHERE e.elder_id = $1 AND e.family_id = $2
    `, [elder_id, family_id]);
    
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found or does not belong to this family'
      });
    }

    // Check for overlapping care requests for the same caregiver
    const conflictCheck = await pool.query(`
      SELECT * FROM carerequest 
      WHERE caregiver_id = $1 
      AND status IN ('pending', 'approved')
      AND (
        (start_date <= $2 AND end_date >= $2) OR
        (start_date <= $3 AND end_date >= $3) OR
        (start_date >= $2 AND end_date <= $3)
      )
    `, [caregiverId, start_date, end_date]);
    
    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Caregiver is not available for the selected dates'
      });
    }

    // Insert care request
    const result = await pool.query(`
      INSERT INTO carerequest (
        family_id,
        caregiver_id,
        elder_id,
        start_date,
        end_date,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      family_id,
      caregiverId,
      elder_id,
      start_date,
      end_date,
      'pending'
    ]);
    
    console.log('Care request created successfully');
    
    res.status(201).json({
      success: true,
      message: 'Care request submitted successfully',
      careRequest: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error creating care request:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error creating care request' 
    });
  }
};

// Get care requests for a family member
const getCareRequestsByFamily = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    console.log('Fetching care requests for family member:', familyMemberId);
    
    // Get family_id from family member
    const familyMemberCheck = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [familyMemberId]
    );
    
    if (familyMemberCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }

    const family_id = familyMemberCheck.rows[0].family_id;
    
    const result = await pool.query(`
      SELECT 
        cr.request_id,
        cr.family_id,
        cr.caregiver_id,
        cr.elder_id,
        cr.start_date,
        cr.end_date,
        cr.status,
        u.name as caregiver_name,
        u.email as caregiver_email,
        u.phone as caregiver_phone,
        c.certifications,
        c.fixed_line as caregiver_fixed_line,
        c.district as caregiver_district,
        c.availability,
        e.name as elder_name,
        e.contact as elder_contact
      FROM carerequest cr
      INNER JOIN caregiver c ON cr.caregiver_id = c.caregiver_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      INNER JOIN elder e ON cr.elder_id = e.elder_id
      WHERE cr.family_id = $1
      ORDER BY cr.start_date DESC
    `, [family_id]);
    
    console.log('Found care requests:', result.rows.length);
    
    res.json({
      success: true,
      careRequests: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching care requests:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching care requests' 
    });
  }
};

// Search caregivers by district or certifications
const searchCaregivers = async (req, res) => {
  const { query, district, certifications } = req.query;
  
  try {
    let searchQuery = `
      SELECT 
        c.caregiver_id,
        c.user_id,
        c.availability,
        c.certifications,
        c.fixed_line,
        c.district,
        u.name as caregiver_name,
        u.email as caregiver_email,
        u.phone as caregiver_phone,
        u.role,
        u.created_at
      FROM caregiver c
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE u.role = 'caregiver' AND c.availability = 'available'
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (query && query.trim().length > 0) {
      searchQuery += ` AND (LOWER(u.name) LIKE LOWER($${paramIndex}) OR LOWER(c.certifications) LIKE LOWER($${paramIndex}))`;
      queryParams.push(`%${query}%`);
      paramIndex++;
    }
    
    if (district) {
      searchQuery += ` AND LOWER(c.district) = LOWER($${paramIndex})`;
      queryParams.push(district);
      paramIndex++;
    }
    
    if (certifications) {
      searchQuery += ` AND LOWER(c.certifications) LIKE LOWER($${paramIndex})`;
      queryParams.push(`%${certifications}%`);
      paramIndex++;
    }
    
    searchQuery += ` ORDER BY u.created_at DESC`;
    
    console.log('Searching caregivers with query:', searchQuery);
    console.log('Parameters:', queryParams);
    
    const result = await pool.query(searchQuery, queryParams);
    
    res.json({
      success: true,
      caregivers: result.rows,
      count: result.rows.length,
      searchParams: { query, district, certifications }
    });
    
  } catch (err) {
    console.error('Error searching caregivers:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error searching caregivers' 
    });
  }
};

// Update care request status
const updateCareRequestStatus = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  
  try {
    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const result = await pool.query(
      'UPDATE carerequest SET status = $1 WHERE request_id = $2 RETURNING *',
      [status, requestId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Care request not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Care request status updated successfully',
      careRequest: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating care request status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating care request status' 
    });
  }
};

module.exports = {
  getAllCaregivers,
  getCaregiverById,
  createCareRequest,
  getCareRequestsByFamily,
  searchCaregivers,
  updateCareRequestStatus
};
