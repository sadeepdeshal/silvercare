process.env.TZ = 'Asia/Colombo';
require('dotenv').config(); // Ensure env vars are loaded
const pool = require('../db');
// Initialize Stripe safely (do not crash server if key missing)
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } else {
    console.warn('Stripe not configured: STRIPE_SECRET_KEY is missing. Refund features will be disabled.');
  }
} catch (e) {
  console.warn('Stripe initialization failed. Refund features will be disabled. Error:', e.message);
  stripe = null;
}

// Get all appointments for a family member (only confirmed status)
// Update the getAllAppointmentsByFamily function
const getAllAppointmentsByFamily = async (req, res) => {
  const { familyMemberId } = req.params;
  const { status, elder_id, history, type, limit, offset = 0, upcoming_only } = req.query;
  
  try {
    console.log('Fetching appointments for family member:', familyMemberId);
    console.log('Filters:', { status, elder_id, history, type, limit, offset, upcoming_only });

    // Get family_id from user_id
    const familyResult = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [familyMemberId]
    );

    if (familyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }

    const family_id = familyResult.rows[0].family_id;

    // Build the query based on filters
    let query = `
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.family_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        a.appointment_type,
        a.meeting_link,
        a.created_at,
        a.updated_at,
        e.name as elder_name,
        e.contact as elder_contact,
        e.gender as elder_gender,
        e.dob as elder_dob,
        e.district as elder_district,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        d.specialization,
        d.current_institution,
        d.district as doctor_district,
        d.years_experience,
        p.amount as payment_amount,
        p.payment_status,
        p.payment_method,
        p.transaction_id,
        p.payment_date,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / 3600 as hours_since_created,
        CASE 
          WHEN a.status = 'confirmed' AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / 3600 <= 2 
          THEN true 
          ELSE false 
        END as can_cancel,
        CASE 
          WHEN a.status = 'cancelled' AND p.payment_status = 'refunded' 
          THEN p.amount 
          ELSE 0 
        END as refund_amount,
        CASE 
          WHEN a.status = 'cancelled' AND p.payment_status = 'refunded' 
          THEN 'completed'
          WHEN a.status = 'cancelled' AND p.payment_status = 'paid' 
          THEN 'pending'
          WHEN a.status = 'cancelled' AND p.payment_status IS NULL 
          THEN 'no_payment'
          ELSE NULL 
        END as refund_status
      FROM appointment a
      JOIN elder e ON a.elder_id = e.elder_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN "User" u ON d.user_id = u.user_id
      LEFT JOIN payment p ON a.appointment_id = p.appointment_id
      WHERE a.family_id = $1
    `;

    const queryParams = [family_id];
    let paramCount = 1;

    // Add upcoming_only filter if specified
    if (upcoming_only === 'true') {
      query += ` AND a.date_time > CURRENT_TIMESTAMP`;
    }

    // Add status filter
    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Add elder filter
    if (elder_id) {
      paramCount++;
      query += ` AND a.elder_id = $${paramCount}`;
      queryParams.push(elder_id);
    }

    // Add history filter (completed or cancelled)
    if (history === 'true') {
      query += ` AND a.status IN ('completed', 'cancelled')`;
    } else if (!status && upcoming_only !== 'true') {
      // If no specific status and not upcoming only, show active appointments
      query += ` AND a.status NOT IN ('completed', 'cancelled')`;
    }

    // Add appointment type filter (if provided)
    if (type && type !== 'all') {
      paramCount++;
      query += ` AND a.appointment_type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` ORDER BY a.date_time ASC`; // Changed to ASC for upcoming appointments

    // Add limit if specified
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      
      if (offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        queryParams.push(parseInt(offset));
      }
    }

    console.log('Executing query:', query);
    console.log('Query params:', queryParams);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination (with same filters)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM appointment a
      WHERE a.family_id = $1
    `;

    const countParams = [family_id];
    let countParamCount = 1;

    // Apply same filters to count query
    if (upcoming_only === 'true') {
      countQuery += ` AND a.date_time > CURRENT_TIMESTAMP`;
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND a.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (elder_id) {
      countParamCount++;
      countQuery += ` AND a.elder_id = $${countParamCount}`;
      countParams.push(elder_id);
    }

    if (history === 'true') {
      countQuery += ` AND a.status IN ('completed', 'cancelled')`;
    } else if (!status && upcoming_only !== 'true') {
      countQuery += ` AND a.status NOT IN ('completed', 'cancelled')`;
    }

    if (type && type !== 'all') {
      countParamCount++;
      countQuery += ` AND a.appointment_type = $${countParamCount}`;
      countParams.push(type);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length,
      pagination: {
        total: totalCount,
        limit: limit ? parseInt(limit) : null,
        offset: parseInt(offset),
        hasMore: limit ? (parseInt(offset) + parseInt(limit)) < totalCount : false
      }
    });

  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching appointments'
    });
  }
};

const getAppointmentHistory = async (req, res) => {
  const { familyMemberId } = req.params;
  const { status } = req.query;
  
  try {
    console.log('Fetching appointment history for family member:', familyMemberId);
    console.log('History status filter:', status);

    // Get family_id from user_id
    const familyResult = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [familyMemberId]
    );

    if (familyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }

    const family_id = familyResult.rows[0].family_id;

    // Build query specifically for history (completed and cancelled appointments)
    let query = `
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.family_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        a.appointment_type,
        a.created_at,
        a.updated_at,
        e.name as elder_name,
        e.contact as elder_contact,
        e.gender as elder_gender,
        e.dob as elder_dob,
        e.district as elder_district,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        d.specialization,
        d.current_institution,
        d.district as doctor_district,
        d.years_experience,
        p.amount as payment_amount,
        p.payment_status,
        p.payment_method,
        p.transaction_id,
        p.payment_date,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - a.created_at)) as days_since_created,
        CASE 
          WHEN a.status = 'cancelled' AND p.payment_status = 'refunded' 
          THEN p.amount 
          ELSE 0 
        END as refund_amount,
        CASE 
          WHEN a.status = 'cancelled' AND p.payment_status = 'refunded' 
          THEN 'completed'
          WHEN a.status = 'cancelled' AND p.payment_status = 'paid' 
          THEN 'pending'
          WHEN a.status = 'cancelled' AND p.payment_status IS NULL 
          THEN 'no_payment'
          ELSE NULL 
        END as refund_status
      FROM appointment a
      JOIN elder e ON a.elder_id = e.elder_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN "User" u ON d.user_id = u.user_id
      LEFT JOIN payment p ON a.appointment_id = p.appointment_id
      WHERE a.family_id = $1
    `;

    const queryParams = [family_id];
    let paramCount = 1;

    // Filter for history appointments (completed and cancelled)
    if (status && (status === 'completed' || status === 'cancelled')) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    } else {
      // If no specific status, show both completed and cancelled
      query += ` AND a.status IN ('completed', 'cancelled')`;
    }

    query += ` ORDER BY a.date_time DESC`;

    console.log('Executing history query:', query);
    console.log('Query params:', queryParams);

    const result = await pool.query(query, queryParams);

    console.log('Found history appointments:', result.rows.length);
    console.log('Appointments by status:', result.rows.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {}));

    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching appointment history:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching appointment history'
    });
  }
};

// NEW: Get upcoming appointments for dashboard (only confirmed status)
const getUpcomingAppointmentsByFamily = async (req, res) => {
  const { familyMemberId } = req.params;
  const { limit = 5 } = req.query; // Default limit for dashboard
  
  try {
    console.log('Getting upcoming confirmed appointments for family member:', familyMemberId);
    
    // First, get the family_id from the familymember table using the user_id
    const familyMemberResult = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [familyMemberId]
    );
    
    if (familyMemberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyId = familyMemberResult.rows[0].family_id;
    console.log('Found family_id for upcoming appointments:', familyId);
    
    // Get upcoming appointments (pending/approved/confirmed) for dashboard
    const query = `
      SELECT 
        a.appointment_id,
        a.elder_id,
        a.family_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        a.appointment_type,
        a.created_at,
        a.updated_at,
        e.name as elder_name,
        e.contact as elder_contact,
        e.gender as elder_gender,
        e.dob as elder_dob,
        e.district as elder_district,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        d.specialization,
        d.current_institution,
        d.district as doctor_district,
        d.years_experience
      FROM appointment a
      INNER JOIN elder e ON a.elder_id = e.elder_id
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE a.family_id = $1 
        AND a.status IN ('pending','approved','confirmed')
        AND a.date_time > CURRENT_TIMESTAMP
      ORDER BY a.date_time ASC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [familyId, parseInt(limit)]);
    
    console.log('Found upcoming confirmed appointments:', result.rows.length);
    
    res.json({
      success: true,
      appointments: result.rows
    });
    
  } catch (err) {
    console.error('Error fetching upcoming confirmed appointments:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching upcoming appointments' 
    });
  }
};

// NEW: Get appointment count for dashboard (only confirmed status)
const getAppointmentCountByFamily = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    console.log('Getting confirmed appointment count for family member:', familyMemberId);
    
    // First, get the family_id from the familymember table using the user_id
    const familyMemberResult = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [familyMemberId]
    );
    
    if (familyMemberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyId = familyMemberResult.rows[0].family_id;
    
    // Get count of upcoming appointments (pending/approved/confirmed)
    const countResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM appointment a
       WHERE a.family_id = $1 
         AND a.status IN ('pending','approved','confirmed')
         AND a.date_time > CURRENT_TIMESTAMP`,
      [familyId]
    );
    
    const count = parseInt(countResult.rows[0].count);
    console.log('Found confirmed appointment count:', count);
    
    res.json({
      success: true,
      count: count
    });
    
  } catch (err) {
    console.error('Error fetching confirmed appointment count:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching appointment count' 
    });
  }
};

// Get appointment by ID (only if confirmed)
const getAppointmentById = async (req, res) => {
  const { appointmentId } = req.params;
  
  try {
    console.log('Getting confirmed appointment by ID:', appointmentId);
    
    const result = await pool.query(
      `SELECT 
        a.appointment_id,
        a.elder_id,
        a.family_id,
        a.doctor_id,
        a.date_time,
        a.status,
        a.notes,
        a.appointment_type,
        a.created_at,
        a.updated_at,
        e.name as elder_name,
        e.contact as elder_contact,
        e.gender as elder_gender,
        e.dob as elder_dob,
        e.district as elder_district,
        e.medical_conditions,
        e.profile_photo as elder_photo,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        d.specialization,
        d.current_institution,
        d.district as doctor_district,
        d.years_experience,
        d.license_number
      FROM appointment a
      INNER JOIN elder e ON a.elder_id = e.elder_id
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE a.appointment_id = $1 AND a.status = 'confirmed'`,
      [appointmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Confirmed appointment not found'
      });
    }
    
    res.json({
      success: true,
      appointment: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error fetching confirmed appointment:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching appointment details' 
    });
  }
};

// Update appointment status (can change from confirmed to other statuses)
const updateAppointmentStatus = async (req, res) => {
  const { appointmentId } = req.params;
  const { status, notes } = req.body;
  
  try {
    console.log('Updating appointment status:', appointmentId, status);
    
    const validStatuses = ['confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    // First, get the current appointment details
    const currentAppointment = await pool.query(
      'SELECT * FROM appointment WHERE appointment_id = $1',
      [appointmentId]
    );

    if (currentAppointment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    let meetingLink = currentAppointment.rows[0].meeting_link;

    // Generate meeting link if confirming an online appointment that doesn't have one
    if (status === 'confirmed' && 
        currentAppointment.rows[0].appointment_type === 'online' && 
        !meetingLink) {
      const MeetingService = require('../services/meetingService');
      const meetingData = MeetingService.generateMeetingLink(
        appointmentId,
        currentAppointment.rows[0].doctor_id,
        currentAppointment.rows[0].elder_id
      );
      meetingLink = meetingData.meetingLink;
      console.log(`📞 Generated meeting link for appointment ${appointmentId}: ${meetingLink}`);
    }
    
    const result = await pool.query(
      `UPDATE appointment 
       SET status = $1, notes = COALESCE($2, notes), meeting_link = COALESCE($4, meeting_link), updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $3
       RETURNING *`,
      [status, notes, appointmentId, meetingLink]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating appointment status' 
    });
  }
};

// Cancel appointment with refund (only if within 3 days and has payment)
// Update the cancelAppointment function
const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { reason } = req.body;
  
  try {
    console.log('Attempting to cancel appointment:', appointmentId);
    
    // Check if appointment exists, is confirmed, and within 2-hour cancellation window from creation time
    const appointmentCheck = await pool.query(`
      SELECT 
        a.*,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / 3600 as hours_since_created,
        p.payment_id,
        p.amount,
        p.transaction_id,
        p.payment_method,
        p.payment_status,
        e.name as elder_name,
        u.name as doctor_name
      FROM appointment a
      LEFT JOIN payment p ON a.appointment_id = p.appointment_id
      LEFT JOIN elder e ON a.elder_id = e.elder_id
      LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
      LEFT JOIN "User" u ON d.user_id = u.user_id
      WHERE a.appointment_id = $1 AND a.status = 'confirmed'
    `, [appointmentId]);
    
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Confirmed appointment not found or cannot be cancelled'
      });
    }
    
    const appointment = appointmentCheck.rows[0];
    const hoursSinceCreated = parseFloat(appointment.hours_since_created);
    
    console.log('Appointment details:', {
      id: appointment.appointment_id,
      status: appointment.status,
      hoursSinceCreated: hoursSinceCreated,
      createdAt: appointment.created_at,
      appointmentDateTime: appointment.date_time,
      hasPayment: !!appointment.payment_id,
      paymentAmount: appointment.amount,
      transactionId: appointment.transaction_id
    });
    
    // Check if within 2-hour cancellation window from creation time
    if (hoursSinceCreated > 2) {
      return res.status(400).json({
        success: false,
        error: `Cancellation not allowed. Appointments can only be cancelled within 2 hours of booking. This appointment was created ${hoursSinceCreated.toFixed(1)} hours ago.`,
        canCancel: false,
        hoursSinceCreated: hoursSinceCreated
      });
    }
    
    // Start transaction for atomic operation
    await pool.query('BEGIN');
    
    try {
      // Update appointment status to cancelled
      const cancelResult = await pool.query(
        `UPDATE appointment 
         SET status = 'cancelled', 
             notes = CASE 
               WHEN notes IS NULL OR notes = '' THEN $1
               ELSE notes || ' | Cancellation reason: ' || $1
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE appointment_id = $2
         RETURNING *`,
        [reason || 'Cancelled by family member (within 2-hour creation policy)', appointmentId]
      );
      
      let refundResult = null;
      
      // Process refund if payment exists
      if (appointment.payment_id && appointment.transaction_id && appointment.payment_status === 'completed') {
        console.log('Processing refund for payment:', appointment.transaction_id);
        
        if (!stripe) {
          console.warn('Stripe not configured. Skipping refund API call.');
          await pool.query(
            `UPDATE appointment 
             SET notes = COALESCE(notes, '') || ' | REFUND PENDING: Stripe not configured. Contact support.'
             WHERE appointment_id = $1`,
            [appointmentId]
          );
          refundResult = {
            error: 'Stripe not configured. Refund not processed.',
            details: 'Set STRIPE_SECRET_KEY to enable refunds.'
          };
        } else {
          try {
            // Create refund in Stripe
            const refund = await stripe.refunds.create({
              payment_intent: appointment.transaction_id,
              amount: Math.round(parseFloat(appointment.amount) * 100), // Convert to cents
              reason: 'requested_by_customer',
              metadata: {
                appointment_id: appointmentId.toString(),
                elder_name: appointment.elder_name || '',
                doctor_name: appointment.doctor_name || '',
                cancellation_reason: reason || 'Cancelled within 2-hour creation policy',
                cancelled_at: new Date().toISOString(),
                hours_since_created: hoursSinceCreated.toString(),
                platform: 'SilverCare'
              }
            });
            
            console.log('Stripe refund created:', refund.id);
            
            // Update payment status in database
            await pool.query(
              `UPDATE payment 
               SET payment_status = 'refunded'
               WHERE payment_id = $1`,
              [appointment.payment_id]
            );
            
            // Insert refund record
            await pool.query(
              `UPDATE appointment 
               SET notes = COALESCE(notes, '') || ' | REFUND: ' || $1 || ' (Amount: Rs.' || $2 || ')'
               WHERE appointment_id = $3`,
              [refund.id, appointment.amount, appointmentId]
            );
            
            refundResult = {
              refund_id: refund.id,
              amount: parseFloat(appointment.amount),
              status: refund.status,
              estimated_arrival: refund.created + (5 * 24 * 60 * 60) // Estimate 5-10 business days
            };
          } catch (stripeError) {
            console.error('Stripe refund failed:', stripeError);
            
            // Don't fail the entire cancellation if refund fails
            await pool.query(
              `UPDATE appointment 
               SET notes = COALESCE(notes, '') || ' | REFUND FAILED: ' || $1 || ' - Contact support'
               WHERE appointment_id = $2`,
              [stripeError.message, appointmentId]
            );
            
            refundResult = {
              error: 'Refund processing failed. Please contact support.',
              details: stripeError.message
            };
          }
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log('Appointment cancelled successfully:', {
        appointmentId,
        hoursSinceCreated,
        refundProcessed: !!refundResult,
        refundAmount: refundResult?.amount
      });
      
      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: cancelResult.rows[0],
        refund: refundResult,
        cancellationInfo: {
          hoursSinceCreated: hoursSinceCreated,
          refundProcessed: !!refundResult && !refundResult.error,
          refundAmount: refundResult?.amount || 0,
          estimatedRefundDays: refundResult?.error ? null : '5-10 business days'
        }
      });
      
    } catch (transactionError) {
      // Rollback transaction
      await pool.query('ROLLBACK');
      throw transactionError;
    }
    
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error cancelling appointment',
      details: err.message
    });
  }
}
// Get appointment statistics for family member (only confirmed appointments)
const getAppointmentStats = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    console.log('Getting confirmed appointment stats for family member:', familyMemberId);
    
    // Get family_id
    const familyMemberResult = await pool.query(
      'SELECT family_id FROM familymember WHERE user_id = $1',
      [familyMemberId]
    );
    
    if (familyMemberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Family member not found'
      });
    }
    
    const familyId = familyMemberResult.rows[0].family_id;
    
    // Get statistics (only for confirmed appointments)
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_confirmed_appointments,
        COUNT(CASE WHEN appointment_type = 'physical' THEN 1 END) as physical_appointments,
        COUNT(CASE WHEN appointment_type = 'online' THEN 1 END) as online_appointments,
        COUNT(CASE WHEN date_time > CURRENT_TIMESTAMP THEN 1 END) as upcoming_appointments,
        COUNT(CASE WHEN date_time < CURRENT_TIMESTAMP THEN 1 END) as past_appointments,
        COUNT(CASE WHEN DATE(date_time) = CURRENT_DATE THEN 1 END) as today_appointments
              FROM appointment 
      WHERE family_id = $1 AND status = 'confirmed'`,
      [familyId]
    );
    
    res.json({
      success: true,
      stats: {
        ...statsResult.rows[0],
        // Add some additional helpful stats
        status_filter: 'confirmed_only',
        message: 'Showing only confirmed appointments'
      }
    });
    
  } catch (err) {
    console.error('Error fetching confirmed appointment stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching appointment statistics' 
    });
  }
};

module.exports = {
  getAllAppointmentsByFamily,
  getUpcomingAppointmentsByFamily, // NEW: For dashboard upcoming appointments
  getAppointmentCountByFamily,     // NEW: For dashboard appointment count
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentStats,
  getAppointmentHistory  
};
