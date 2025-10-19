const pool = require('../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

// Get active caregiver count
const getActiveCaregiverCount = async (req, res) => {
  try {
    console.log('Fetching active caregiver count');
    
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM caregiver c
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE u.role = 'caregiver' AND c.availability = 'available'
    `);
    
    const count = parseInt(result.rows[0].count);
    console.log('Active caregiver count:', count);
    
    res.json({
      success: true,
      count: count
    });
    
  } catch (err) {
    console.error('Error fetching active caregiver count:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching active caregiver count' 
    });
  }
};

// Get caregiver statistics
const getCaregiverStats = async (req, res) => {
  try {
    console.log('Fetching caregiver statistics');
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_caregivers,
        COUNT(CASE WHEN c.availability = 'available' THEN 1 END) as active_caregivers,
        COUNT(CASE WHEN c.availability = 'busy' THEN 1 END) as busy_caregivers,
        COUNT(CASE WHEN c.availability = 'unavailable' THEN 1 END) as unavailable_caregivers,
        COUNT(DISTINCT c.district) as districts_covered
      FROM caregiver c
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE u.role = 'caregiver'
    `);
    
    const stats = result.rows[0];
    console.log('Caregiver statistics:', stats);
    
    res.json({
      success: true,
      stats: {
        total_caregivers: parseInt(stats.total_caregivers),
        active_caregivers: parseInt(stats.active_caregivers),
        busy_caregivers: parseInt(stats.busy_caregivers),
        unavailable_caregivers: parseInt(stats.unavailable_caregivers),
        districts_covered: parseInt(stats.districts_covered)
      }
    });
    
  } catch (err) {
    console.error('Error fetching caregiver statistics:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching caregiver statistics' 
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
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caregiver not found'
      });
    }
    
    console.log('Caregiver found:', result.rows[0].caregiver_name);
    console.log('Day rate from DB:', result.rows[0].day_rate);
    console.log('Full caregiver data:', result.rows[0]);
    
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
  let { status } = req.body;
  
  try {
    // Convert 'approved' to 'confirmed' for database storage
    if (status === 'approved') {
      status = 'confirmed';
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    // If cancelling, handle refund
    if (status === 'cancelled') {
      // Get care request details with payment info
      const requestCheck = await pool.query(`
        SELECT 
          cr.*,
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cr.request_date)) / 3600 as hours_since_created,
          cp.payment_id,
          cp.amount,
          cp.transaction_id,
          cp.payment_method,
          cp.payment_status,
          e.name as elder_name,
          u.name as caregiver_name
        FROM carerequest cr
        LEFT JOIN caregiver_payment cp ON cr.request_id = cp.care_request_id
        LEFT JOIN elder e ON cr.elder_id = e.elder_id
        LEFT JOIN caregiver c ON cr.caregiver_id = c.caregiver_id
        LEFT JOIN "User" u ON c.user_id = u.user_id
        WHERE cr.request_id = $1
      `, [requestId]);

      if (requestCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Care request not found'
        });
      }

      const request = requestCheck.rows[0];
      
      // Start transaction for atomic operation
      await pool.query('BEGIN');

      try {
        // Update care request status to cancelled
        const cancelResult = await pool.query(
          `UPDATE carerequest 
           SET status = 'cancelled'
           WHERE request_id = $1
           RETURNING *`,
          [requestId]
        );

        let refundResult = null;

        // Process refund if payment exists
        if (request.payment_id && request.transaction_id && request.payment_status === 'completed') {
          console.log('Processing refund for caregiver cancellation:', request.transaction_id);

          try {
            // Create refund in Stripe
            const refund = await stripe.refunds.create({
              payment_intent: request.transaction_id,
              amount: Math.round(parseFloat(request.amount) * 100), // Convert to cents
              reason: 'requested_by_customer',
              metadata: {
                care_request_id: requestId.toString(),
                elder_name: request.elder_name || '',
                caregiver_name: request.caregiver_name || '',
                cancellation_reason: 'Cancelled by caregiver',
                cancelled_at: new Date().toISOString(),
                platform: 'SilverCare'
              }
            });

            console.log('Stripe refund created:', refund.id);

            // Update payment status in database
            await pool.query(
              `UPDATE caregiver_payment 
               SET payment_status = 'refunded'
               WHERE payment_id = $1`,
              [request.payment_id]
            );

            refundResult = {
              refund_id: refund.id,
              amount: parseFloat(request.amount),
              status: refund.status,
              estimated_arrival: refund.created + (5 * 24 * 60 * 60) // Estimate 5-10 business days
            };

          } catch (stripeError) {
            console.error('Stripe refund failed:', stripeError);

            // Don't fail the entire cancellation if refund fails
            refundResult = {
              error: 'Refund processing failed. Please contact support.',
              details: stripeError.message
            };
          }
        }

        // Commit transaction
        await pool.query('COMMIT');

        console.log('Care request cancelled successfully with refund:', {
          requestId,
          refundProcessed: !!refundResult,
          refundAmount: refundResult?.amount
        });

        return res.json({
          success: true,
          message: 'Care request cancelled successfully. Refund has been processed.',
          careRequest: cancelResult.rows[0],
          refund: refundResult
        });

      } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        throw error;
      }

    } else {
      // For non-cancellation status updates, just update the status
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
    }
    
  } catch (err) {
    console.error('Error updating care request status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating care request status' 
    });
  }
};

// Get care request details by ID(role caregiver)
{/*
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

     const query = `SELECT 
        e.name,
        e.age,
        cr.duration,
        cr.status,
        cr.caregiver_id,
        u.user_id
      FROM carerequest cr
      JOIN elder e ON cr.elder_id = e.elder_id
      JOIN caregiver cg ON cr.caregiver_id = cg.caregiver_id
      JOIN "User" u ON cg.user_id = u.user_id
      WHERE cg.caregiver_id = $1`;

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

  try {
    // First, auto-update any approved requests that have passed their end date
    const updateQuery = `
      UPDATE carerequest 
      SET status = 'completed'
      WHERE caregiver_id = $1 
      AND status = 'approved' 
      AND end_date < CURRENT_DATE;
    `;
    await pool.query(updateQuery, [caregiverId]);

    const query = `
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
        fm.user_id as family_member_user_id,
        u.name as family_member_name,
        u.phone as family_member_phone,
        u.email as family_member_email
      FROM carerequest cr
      JOIN elder e ON cr.elder_id = e.elder_id
      JOIN familymember fm ON cr.family_id = fm.family_id
      JOIN "User" u ON fm.user_id = u.user_id
      WHERE cr.caregiver_id = $1
      ORDER BY cr.request_date DESC, cr.start_date ASC;
    `;

    const result = await pool.query(query, [caregiverId]);

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
    console.log('=== UPDATE CAREGIVER PROFILE ===');
    console.log('Updating caregiver profile:', caregiverId);
    console.log('Request body:', req.body);
    console.log('Day rate received:', day_rate);
    console.log('Day rate type:', typeof day_rate);
    
    // Convert day_rate to integer or null
    const dayRateValue = day_rate === '' || day_rate === null || day_rate === undefined || day_rate === 'null'
      ? null 
      : parseInt(day_rate, 10);
    
    console.log('Day rate after conversion:', dayRateValue);
    console.log('Day rate after conversion type:', typeof dayRateValue);
    
    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and phone are required'
      });
    }
    
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
      
      // Update caregiver table
      console.log('Updating caregiver table with day_rate:', dayRateValue);
      const updateResult = await client.query(
        'UPDATE caregiver SET availability = $1, certifications = $2, fixed_line = $3, district = $4, day_rate = $5 WHERE caregiver_id = $6',
        [availability, certifications, fixed_line, district, dayRateValue, caregiverId]
      );
      console.log('UPDATE query executed, rows affected:', updateResult.rowCount);
      
      await client.query('COMMIT');
      console.log('Transaction COMMITTED successfully');
      
      // Verify the update in DB
      const verifyResult = await client.query(
        'SELECT day_rate FROM caregiver WHERE caregiver_id = $1',
        [caregiverId]
      );
      console.log('VERIFICATION - day_rate in DB after commit:', verifyResult.rows[0]?.day_rate);
      
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
      console.log('Updated day_rate:', updatedResult.rows[0]?.day_rate);
      console.log('Caregiver profile updated successfully');
      
      const responseData = {
        success: true,
        message: 'Profile updated successfully',
        caregiver: updatedResult.rows[0]
      };
      
      console.log('=== SENDING RESPONSE TO CLIENT ===');
      console.log('Response day_rate:', responseData.caregiver.day_rate);
      console.log('Full response:', JSON.stringify(responseData, null, 2));
      
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

// Get upcoming shifts for caregiver (approved and future)
const getUpcomingShifts = async (req, res) => {
  const caregiverId = req.params.id;
  try {
    // Only fetch shifts with status 'approved' and start_date >= today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const query = `
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
        AND cr.status = 'approved'
        AND cr.start_date >= $2
      ORDER BY cr.start_date ASC;
    `;
    
    const result = await pool.query(query, [caregiverId, today]);
    console.log('Raw upcoming shifts from DB:', result.rows);
    
    // Format for frontend: return all fields needed for dashboard
    const shifts = result.rows.map(row => {
      // Format duration properly
      
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
};*/}

// NEW: Get blocked dates for a caregiver in a specific month
const getBlockedDates = async (req, res) => {
  const { caregiverId } = req.params;
  const { year, month } = req.query;
  
  try {
    console.log('Fetching blocked dates for caregiver:', caregiverId, 'year:', year, 'month:', month);
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required'
      });
    }
    
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    console.log('Date range:', startDate, 'to', endDate);
    
    // Get all care requests for this caregiver that overlap with the requested month
    const result = await pool.query(`
      SELECT 
        request_id,
        start_date,
        end_date,
        status
      FROM carerequest
      WHERE caregiver_id = $1
        AND status IN ('pending', 'confirmed', 'approved', 'in-progress')
        AND (
          (start_date <= $3 AND end_date >= $2) OR
          (start_date >= $2 AND start_date <= $3) OR
          (end_date >= $2 AND end_date <= $3)
        )
      ORDER BY start_date
    `, [caregiverId, startDate, endDate]);
    
    console.log('Found care requests:', result.rows.length);
    
    // Generate array of blocked dates from the care requests
    const blockedDates = [];
    result.rows.forEach(request => {
      // PostgreSQL returns dates as Date objects in local timezone
      // We need to extract just the date part without timezone conversion
      let startDateStr, endDateStr;
      
      if (request.start_date instanceof Date) {
        // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion
        const startYear = request.start_date.getFullYear();
        const startMonth = String(request.start_date.getMonth() + 1).padStart(2, '0');
        const startDay = String(request.start_date.getDate()).padStart(2, '0');
        startDateStr = `${startYear}-${startMonth}-${startDay}`;
        
        const endYear = request.end_date.getFullYear();
        const endMonth = String(request.end_date.getMonth() + 1).padStart(2, '0');
        const endDay = String(request.end_date.getDate()).padStart(2, '0');
        endDateStr = `${endYear}-${endMonth}-${endDay}`;
      } else {
        // If already strings, use them directly
        startDateStr = request.start_date;
        endDateStr = request.end_date;
      }
      
      console.log(`Processing booking: ${startDateStr} to ${endDateStr} (status: ${request.status})`);
      
      // Generate all dates in the range
      const start = new Date(startDateStr + 'T00:00:00');
      const end = new Date(endDateStr + 'T23:59:59');
      
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        if (!blockedDates.includes(dateStr)) {
          blockedDates.push(dateStr);
          console.log(`  Blocked: ${dateStr}`);
        }
        current.setDate(current.getDate() + 1);
      }
    });
    
    console.log('Total blocked dates:', blockedDates.length);
    
    res.json({
      success: true,
      blockedDates: blockedDates,
      careRequests: result.rows
    });
    
  } catch (err) {
    console.error('Error fetching blocked dates:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching blocked dates' 
    });
  }
};

// NEW: Create temporary caregiver booking (expires in 10 minutes)
const createTemporaryCaregiverBooking = async (req, res) => {
  try {
    const {
      elderId,
      caregiverId,
      familyId,
      selectedDates,
      totalAmount,
      elderName,
      caregiverName
    } = req.body;

    console.log('Creating temporary caregiver booking:', {
      elderId,
      caregiverId,
      familyId,
      selectedDates,
      totalAmount
    });

    // Validate required fields
    if (!elderId || !caregiverId || !familyId || !selectedDates || selectedDates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Elder, caregiver, family, and selected dates are required'
      });
    }

    // Verify elder exists and belongs to family
    const elderResult = await pool.query(
      'SELECT elder_id, name, family_id FROM elder WHERE elder_id = $1 AND family_id = $2',
      [elderId, familyId]
    );

    if (elderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found or does not belong to this family'
      });
    }

    // Verify caregiver exists and is available
    const caregiverResult = await pool.query(
      `SELECT c.caregiver_id, u.name as caregiver_name 
       FROM caregiver c 
       INNER JOIN "User" u ON c.user_id = u.user_id 
       WHERE c.caregiver_id = $1 AND c.availability = 'available'`,
      [caregiverId]
    );

    if (caregiverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caregiver not found or not available'
      });
    }

    // Sort dates and get start and end date
    const sortedDates = selectedDates.sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    // Get all existing bookings for this caregiver that might overlap
    const existingBookings = await pool.query(
      `SELECT start_date, end_date, status
       FROM carerequest 
       WHERE caregiver_id = $1 
       AND status IN ('pending', 'confirmed', 'approved', 'in-progress')
       ORDER BY start_date`,
      [caregiverId]
    );

    // Generate a set of all blocked dates from existing bookings
    const blockedDatesSet = new Set();
    existingBookings.rows.forEach(booking => {
      let startDateStr, endDateStr;
      
      if (booking.start_date instanceof Date) {
        const startYear = booking.start_date.getFullYear();
        const startMonth = String(booking.start_date.getMonth() + 1).padStart(2, '0');
        const startDay = String(booking.start_date.getDate()).padStart(2, '0');
        startDateStr = `${startYear}-${startMonth}-${startDay}`;
        
        const endYear = booking.end_date.getFullYear();
        const endMonth = String(booking.end_date.getMonth() + 1).padStart(2, '0');
        const endDay = String(booking.end_date.getDate()).padStart(2, '0');
        endDateStr = `${endYear}-${endMonth}-${endDay}`;
      } else {
        startDateStr = booking.start_date;
        endDateStr = booking.end_date;
      }
      
      // Add all dates in the booking range to the blocked set
      const start = new Date(startDateStr + 'T00:00:00');
      const end = new Date(endDateStr + 'T23:59:59');
      const current = new Date(start);
      
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        blockedDatesSet.add(dateStr);
        current.setDate(current.getDate() + 1);
      }
    });

    // Check if any of the selected dates are in the blocked dates
    const conflictingDates = selectedDates.filter(date => blockedDatesSet.has(date));
    
    if (conflictingDates.length > 0) {
      console.log('Conflicting dates found:', conflictingDates);
      return res.status(400).json({
        success: false,
        error: 'Some of the selected dates are already booked. Please select different dates.',
        conflictingDates
      });
    }

    // Check for existing temporary bookings that haven't expired
    const tempBookings = await pool.query(
      `SELECT start_date, end_date, selected_dates
       FROM temporary_caregiver_booking 
       WHERE caregiver_id = $1 
       AND expires_at > CURRENT_TIMESTAMP`,
      [caregiverId]
    );

    // Generate a set of temporarily blocked dates
    const tempBlockedDatesSet = new Set();
    tempBookings.rows.forEach(booking => {
      // If selected_dates is stored as JSON, parse it
      let tempDates = [];
      if (booking.selected_dates) {
        if (typeof booking.selected_dates === 'string') {
          tempDates = JSON.parse(booking.selected_dates);
        } else if (Array.isArray(booking.selected_dates)) {
          tempDates = booking.selected_dates;
        }
      }
      
      // Add all temporarily booked dates to the set
      tempDates.forEach(date => tempBlockedDatesSet.add(date));
    });

    // Check if any of the selected dates are temporarily blocked
    const tempConflictingDates = selectedDates.filter(date => tempBlockedDatesSet.has(date));
    
    if (tempConflictingDates.length > 0) {
      console.log('Temporarily blocked dates found:', tempConflictingDates);
      return res.status(400).json({
        success: false,
        error: 'Some dates are temporarily reserved. Please wait or select different dates.',
        conflictingDates: tempConflictingDates
      });
    }

    // Create temporary booking (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const duration = selectedDates.length;
    
    const tempBookingResult = await pool.query(
      `INSERT INTO temporary_caregiver_booking (
        elder_id, 
        family_id, 
        caregiver_id, 
        start_date,
        end_date,
        selected_dates,
        duration,
        total_amount,
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING 
        temp_booking_id,
        elder_id,
        family_id,
        caregiver_id,
        start_date,
        end_date,
        selected_dates,
        duration,
        total_amount,
        expires_at,
        created_at`,
      [
        parseInt(elderId),
        parseInt(familyId),
        parseInt(caregiverId),
        startDate,
        endDate,
        JSON.stringify(selectedDates),
        duration,
        parseFloat(totalAmount),
        expiresAt
      ]
    );

    const tempBooking = tempBookingResult.rows[0];
    console.log('Temporary caregiver booking created:', tempBooking);

    res.status(201).json({
      success: true,
      message: 'Temporary booking created successfully',
      tempBooking: {
        temp_booking_id: tempBooking.temp_booking_id,
        elder_id: tempBooking.elder_id,
        family_id: tempBooking.family_id,
        caregiver_id: tempBooking.caregiver_id,
        start_date: tempBooking.start_date,
        end_date: tempBooking.end_date,
        selected_dates: tempBooking.selected_dates,
        duration: tempBooking.duration,
        total_amount: tempBooking.total_amount,
        expires_at: tempBooking.expires_at,
        created_at: tempBooking.created_at,
        elder_name: elderResult.rows[0].name,
        caregiver_name: caregiverResult.rows[0].caregiver_name
      }
    });

  } catch (err) {
    console.error('Error creating temporary caregiver booking:', err);
    res.status(500).json({
      success: false,
      error: 'Error creating temporary booking',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// NEW: Get temporary booking by ID (for timer initialization)
const getTemporaryCaregiverBooking = async (req, res) => {
  try {
    const { tempBookingId } = req.params;

    console.log('Fetching temporary caregiver booking:', tempBookingId);

    if (!tempBookingId) {
      return res.status(400).json({
        success: false,
        error: 'Temporary booking ID is required'
      });
    }

    const result = await pool.query(
      `SELECT 
        temp_booking_id,
        elder_id,
        family_id,
        caregiver_id,
        start_date,
        end_date,
        selected_dates,
        duration,
        total_amount,
        expires_at,
        created_at
      FROM temporary_caregiver_booking
      WHERE temp_booking_id = $1`,
      [tempBookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Temporary booking not found'
      });
    }

    const booking = result.rows[0];
    
    // Check if booking has expired
    if (new Date(booking.expires_at) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Temporary booking has expired',
        expired: true
      });
    }

    console.log('Temporary booking found:', booking);

    res.status(200).json({
      success: true,
      ...booking
    });

  } catch (err) {
    console.error('Error fetching temporary caregiver booking:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching temporary booking',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// NEW: Confirm payment and create actual care request
const confirmPaymentAndCreateCareRequest = async (req, res) => {
  try {
    const {
      tempBookingId,
      paymentMethod,
      paymentAmount,
      transactionId,
      paymentStatus
    } = req.body;

    console.log('Confirming payment and creating care request:', {
      tempBookingId,
      paymentMethod,
      paymentAmount,
      transactionId,
      paymentStatus
    });

    // Validate required fields
    if (!tempBookingId || !paymentMethod || !paymentAmount || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'All payment details are required'
      });
    }

    // Get temporary booking details
    const tempBookingResult = await pool.query(
      `SELECT * FROM temporary_caregiver_booking 
       WHERE temp_booking_id = $1 
       AND expires_at > CURRENT_TIMESTAMP`,
      [tempBookingId]
    );

    if (tempBookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Temporary booking not found or expired'
      });
    }

    const tempBooking = tempBookingResult.rows[0];

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create the care request
      const careRequestResult = await client.query(
        `INSERT INTO carerequest (
          family_id,
          caregiver_id,
          elder_id,
          start_date,
          end_date,
          status,
          duration,
          request_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING request_id, family_id, caregiver_id, elder_id, start_date, end_date, status, duration`,
        [
          tempBooking.family_id,
          tempBooking.caregiver_id,
          tempBooking.elder_id,
          tempBooking.start_date,
          tempBooking.end_date,
          'pending',
          tempBooking.duration
        ]
      );

      const careRequest = careRequestResult.rows[0];
      console.log('Care request created:', careRequest);

      // Create payment record
      const paymentResult = await client.query(
        `INSERT INTO caregiver_payment (
          care_request_id,
          elder_id,
          amount,
          payment_method,
          transaction_id,
          payment_status,
          payment_date,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING payment_id, care_request_id, elder_id, amount, payment_method, transaction_id, payment_status`,
        [
          careRequest.request_id,
          tempBooking.elder_id,
          parseFloat(paymentAmount),
          paymentMethod,
          transactionId,
          paymentStatus || 'completed'
        ]
      );

      const payment = paymentResult.rows[0];
      console.log('Payment record created:', payment);

      // Delete the temporary booking
      await client.query(
        'DELETE FROM temporary_caregiver_booking WHERE temp_booking_id = $1',
        [tempBookingId]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Payment confirmed and care request created successfully',
        careRequest: {
          request_id: careRequest.request_id,
          family_id: careRequest.family_id,
          caregiver_id: careRequest.caregiver_id,
          elder_id: careRequest.elder_id,
          start_date: careRequest.start_date,
          end_date: careRequest.end_date,
          status: careRequest.status,
          duration: careRequest.duration
        },
        payment: {
          payment_id: payment.payment_id,
          care_request_id: payment.care_request_id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          transaction_id: payment.transaction_id,
          payment_status: payment.payment_status
        }
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Error confirming payment and creating care request:', err);
    res.status(500).json({
      success: false,
      error: 'Error processing payment confirmation',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// NEW: Cancel temporary caregiver booking
const cancelTemporaryCaregiverBooking = async (req, res) => {
  try {
    const { tempBookingId } = req.params;

    console.log('Canceling temporary caregiver booking:', tempBookingId);

    const result = await pool.query(
      'DELETE FROM temporary_caregiver_booking WHERE temp_booking_id = $1 RETURNING temp_booking_id',
      [tempBookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Temporary booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Temporary booking cancelled successfully'
    });

  } catch (err) {
    console.error('Error canceling temporary booking:', err);
    res.status(500).json({
      success: false,
      error: 'Error canceling temporary booking'
    });
  }
};

// NEW: Cleanup expired temporary caregiver bookings
const cleanupExpiredCaregiverBookings = async (req, res) => {
  try {
    console.log('Cleaning up expired temporary caregiver bookings...');

    const result = await pool.query(
      `DELETE FROM temporary_caregiver_booking 
       WHERE expires_at <= CURRENT_TIMESTAMP 
       RETURNING temp_booking_id`
    );

    console.log(`Cleaned up ${result.rows.length} expired temporary bookings`);

    res.json({
      success: true,
      message: `Cleaned up ${result.rows.length} expired bookings`,
      count: result.rows.length
    });

  } catch (err) {
    console.error('Error cleaning up expired bookings:', err);
    res.status(500).json({
      success: false,
      error: 'Error cleaning up expired bookings'
    });
  }
};

// NEW: Get all caregiver bookings for a family member
const getCaregiverBookingsByFamily = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    console.log('Fetching caregiver bookings for family member:', familyMemberId);
    
    // Get all care requests with payment information
    const bookingsResult = await pool.query(`
      SELECT 
        cr.request_id,
        cr.elder_id,
        cr.family_id,
        cr.caregiver_id,
        cr.start_date,
        cr.end_date,
        cr.duration,
        cr.status,
        cr.request_date as created_at,
        cr.request_date as updated_at,
        e.name as elder_name,
        u_caregiver.name as caregiver_name,
        cp.amount as total_amount,
        cp.payment_method,
        cp.transaction_id,
        cp.payment_status,
        cp.payment_date
      FROM carerequest cr
      INNER JOIN elder e ON cr.elder_id = e.elder_id
      INNER JOIN caregiver c ON cr.caregiver_id = c.caregiver_id
      INNER JOIN "User" u_caregiver ON c.user_id = u_caregiver.user_id
      LEFT JOIN caregiver_payment cp ON cr.request_id = cp.care_request_id
      WHERE cr.family_id = $1
      ORDER BY cr.request_date DESC
    `, [familyMemberId]);
    
    const bookings = bookingsResult.rows;
    
    // Calculate stats
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const stats = {
      total: bookings.length,
      upcoming: bookings.filter(b => {
        const startDate = new Date(b.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate > currentDate && b.status === 'confirmed';
      }).length,
      ongoing: bookings.filter(b => {
        const startDate = new Date(b.start_date);
        const endDate = new Date(b.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return startDate <= currentDate && endDate >= currentDate && b.status === 'confirmed';
      }).length,
      completed: bookings.filter(b => {
        const endDate = new Date(b.end_date);
        endDate.setHours(0, 0, 0, 0);
        return endDate < currentDate && b.status === 'confirmed';
      }).length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };
    
    console.log('Found caregiver bookings:', bookings.length, 'Stats:', stats);
    
    res.json({
      success: true,
      bookings: bookings,
      stats: stats
    });
    
  } catch (err) {
    console.error('Error fetching caregiver bookings:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching caregiver bookings',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// NEW: Cancel caregiver booking with refund (similar to appointment cancellation)
const cancelCaregiverBooking = async (req, res) => {
  const { requestId } = req.params;
  const { reason } = req.body;
  
  try {
    console.log('Attempting to cancel caregiver booking:', requestId);
    
    // Check if booking exists, is pending or confirmed, and within 2-hour cancellation window from creation time
    const bookingCheck = await pool.query(`
      SELECT 
        cr.*,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cr.request_date)) / 3600 as hours_since_created,
        cp.payment_id,
        cp.amount,
        cp.transaction_id,
        cp.payment_method,
        cp.payment_status,
        e.name as elder_name,
        u.name as caregiver_name
      FROM carerequest cr
      LEFT JOIN caregiver_payment cp ON cr.request_id = cp.care_request_id
      LEFT JOIN elder e ON cr.elder_id = e.elder_id
      LEFT JOIN caregiver c ON cr.caregiver_id = c.caregiver_id
      LEFT JOIN "User" u ON c.user_id = u.user_id
      WHERE cr.request_id = $1 AND cr.status IN ('pending', 'confirmed')
    `, [requestId]);
    
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caregiver booking not found or cannot be cancelled'
      });
    }
    
    const booking = bookingCheck.rows[0];
    const hoursSinceCreated = parseFloat(booking.hours_since_created);
    
    console.log('Caregiver booking details:', {
      id: booking.request_id,
      status: booking.status,
      hoursSinceCreated: hoursSinceCreated,
      createdAt: booking.request_date,
      startDate: booking.start_date,
      endDate: booking.end_date,
      hasPayment: !!booking.payment_id,
      paymentAmount: booking.amount,
      transactionId: booking.transaction_id
    });
    
    // Check if within 2-hour cancellation window from creation time
    if (hoursSinceCreated > 2) {
      return res.status(400).json({
        success: false,
        error: `Cancellation not allowed. Caregiver bookings can only be cancelled within 2 hours of booking. This booking was created ${hoursSinceCreated.toFixed(1)} hours ago.`,
        canCancel: false,
        hoursSinceCreated: hoursSinceCreated
      });
    }
    
    // Start transaction for atomic operation
    await pool.query('BEGIN');
    
    try {
      // Update booking status to cancelled
      const cancelResult = await pool.query(
        `UPDATE carerequest 
         SET status = 'cancelled'
         WHERE request_id = $1
         RETURNING *`,
        [requestId]
      );
      
      let refundResult = null;
      
      // Process refund if payment exists
      if (booking.payment_id && booking.transaction_id && booking.payment_status === 'completed') {
        console.log('Processing refund for caregiver payment:', booking.transaction_id);
        
        try {
          // Create refund in Stripe
          const refund = await stripe.refunds.create({
            payment_intent: booking.transaction_id,
            amount: Math.round(parseFloat(booking.amount) * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              care_request_id: requestId.toString(),
              elder_name: booking.elder_name || '',
              caregiver_name: booking.caregiver_name || '',
              cancellation_reason: reason || 'Cancelled within 2-hour creation policy',
              cancelled_at: new Date().toISOString(),
              hours_since_created: hoursSinceCreated.toString(),
              platform: 'SilverCare'
            }
          });
          
          console.log('Stripe refund created:', refund.id);
          
          // Update payment status in database
          await pool.query(
            `UPDATE caregiver_payment 
             SET payment_status = 'refunded'
             WHERE payment_id = $1`,
            [booking.payment_id]
          );
          
          refundResult = {
            refund_id: refund.id,
            amount: parseFloat(booking.amount),
            status: refund.status,
            estimated_arrival: refund.created + (5 * 24 * 60 * 60) // Estimate 5-10 business days
          };
          
        } catch (stripeError) {
          console.error('Stripe refund failed:', stripeError);
          
          // Don't fail the entire cancellation if refund fails
          refundResult = {
            error: 'Refund processing failed. Please contact support.',
            details: stripeError.message
          };
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log('Caregiver booking cancelled successfully:', {
        requestId,
        hoursSinceCreated,
        refundProcessed: !!refundResult,
        refundAmount: refundResult?.amount
      });
      
      res.json({
        success: true,
        message: 'Caregiver booking cancelled successfully',
        booking: cancelResult.rows[0],
        refund: refundResult,
        cancellationInfo: {
          cancelledAt: new Date().toISOString(),
          hoursSinceCreated: hoursSinceCreated.toFixed(2),
          reason: reason || 'Cancelled within 2-hour creation policy',
          estimatedRefundDays: '5-10 business days'
        }
      });
      
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (err) {
    console.error('Error cancelling caregiver booking:', err);
    res.status(500).json({
      success: false,
      error: 'Error cancelling caregiver booking',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
const getFeedbackByCaregiverId = async (req, res) => {
  const { caregiverId } = req.params;
  try {
    console.log('Fetching feedback for caregiver ID:', caregiverId);
    const result = await pool.query(`
      SELECT rating,feedback from feedback_caregiver where caregiver_id = $1
    `, [caregiverId]);
    res.status(200).json({
      success: true,
      feedbacks: result.rows
    });
    console.log('Feedback fetched:', result.rows);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addFeedbackForCaregiver = async (req, res) => {
  const { caregiverId } = req.params;
  const { rating, feedback } = req.body;
  try {
    console.log('Adding feedback for caregiver ID:', caregiverId);
    const result = await pool.query(`
      INSERT INTO feedback_caregiver (caregiver_id, rating, feedback)
      VALUES ($1, $2, $3)
      RETURNING caregiver_id, rating, feedback
    `, [caregiverId, rating, feedback]);
    res.status(201).json({
      success: true,
      feedback: result.rows[0]
    });
    console.log('Feedback added:', result.rows[0]);
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Auto-cancel pending care requests after 10 hours with refund
const autoCancelExpiredCareRequests = async () => {
  try {
    console.log('Running auto-cancel for expired care requests...');

    // Find pending requests older than 10 hours
    const expiredRequests = await pool.query(`
      SELECT 
        cr.request_id,
        cr.status,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cr.request_date)) / 3600 as hours_since_created,
        cp.payment_id,
        cp.amount,
        cp.transaction_id,
        cp.payment_method,
        cp.payment_status,
        e.name as elder_name,
        u.name as caregiver_name
      FROM carerequest cr
      LEFT JOIN caregiver_payment cp ON cr.request_id = cp.care_request_id
      LEFT JOIN elder e ON cr.elder_id = e.elder_id
      LEFT JOIN caregiver c ON cr.caregiver_id = c.caregiver_id
      LEFT JOIN "User" u ON c.user_id = u.user_id
      WHERE cr.status = 'pending'
      AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cr.request_date)) / 3600 > 10
    `);

    console.log(`Found ${expiredRequests.rows.length} expired pending care requests`);

    for (const request of expiredRequests.rows) {
      try {
        console.log(`Auto-cancelling expired care request ${request.request_id}`);

        // Start transaction
        await pool.query('BEGIN');

        // Update status to cancelled
        await pool.query(
          `UPDATE carerequest 
           SET status = 'cancelled'
           WHERE request_id = $1`,
          [request.request_id]
        );

        // Process refund if payment exists
        if (request.payment_id && request.transaction_id && request.payment_status === 'completed') {
          console.log(`Processing auto-refund for expired request ${request.request_id}`);

          try {
            // Create refund in Stripe
            const refund = await stripe.refunds.create({
              payment_intent: request.transaction_id,
              amount: Math.round(parseFloat(request.amount) * 100),
              reason: 'requested_by_customer',
              metadata: {
                care_request_id: request.request_id.toString(),
                elder_name: request.elder_name || '',
                caregiver_name: request.caregiver_name || '',
                cancellation_reason: 'Auto-cancelled: Caregiver did not accept within 10 hours',
                cancelled_at: new Date().toISOString(),
                platform: 'SilverCare',
                auto_cancelled: 'true'
              }
            });

            console.log(`Auto-refund created: ${refund.id}`);

            // Update payment status
            await pool.query(
              `UPDATE caregiver_payment 
               SET payment_status = 'refunded'
               WHERE payment_id = $1`,
              [request.payment_id]
            );
          } catch (stripeError) {
            console.error(`Stripe auto-refund failed for request ${request.request_id}:`, stripeError);
            // Continue with cancellation even if refund fails
          }
        }

        // Commit transaction
        await pool.query('COMMIT');

        console.log(`Successfully auto-cancelled care request ${request.request_id}`);
      } catch (error) {
        // Rollback on error
        await pool.query('ROLLBACK');
        console.error(`Error auto-cancelling request ${request.request_id}:`, error);
      }
    }

    return {
      success: true,
      cancelledCount: expiredRequests.rows.length
    };

  } catch (err) {
    console.error('Error in auto-cancel expired care requests:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

module.exports = {
  getAllCaregivers,
  getActiveCaregiverCount,
  getCaregiverStats,
  getCaregiverById,
  createCareRequest,
  getCareRequestsByFamily,
  searchCaregivers,
  updateCareRequestStatus,

  //caregiver feedback
  getFeedbackByCaregiverId,
  addFeedbackForCaregiver,
  
  // NEW: Caregiver booking functions
  getBlockedDates,
  createTemporaryCaregiverBooking,
  getTemporaryCaregiverBooking,
  confirmPaymentAndCreateCareRequest,
  cancelTemporaryCaregiverBooking,
  cleanupExpiredCaregiverBookings,
  getCaregiverBookingsByFamily,
  cancelCaregiverBooking,
  autoCancelExpiredCareRequests
  //getCareRequestById,
  //getAssignedElders,
  //getAssignedFamiliesCount,
  //getcarelogsCount,
  //fetchSchedules,
  //fetchCareRequests,
  //updateCaregiverProfile,
  //updateCaregiverPassword,
  //getUpcomingShifts
};

