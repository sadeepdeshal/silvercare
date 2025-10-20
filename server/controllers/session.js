const pool = require("../db");

// Get upcoming sessions for an elder (limited to 2 for dashboard)
const getUpcomingSessions = async (req, res) => {
  const { elderId } = req.params;
  const { limit } = req.query; // Add limit parameter for dashboard
  console.log("Fetching upcoming sessions for elder ID:", elderId);

  try {
    // Check if elder exists
    const elderCheck = await pool.query(
      "SELECT * FROM elder WHERE elder_id = $1",
      [elderId]
    );
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Elder not found"
      });
    }

    // Query to get upcoming counselor appointments with counselor details
    const limitClause = limit ? `LIMIT ${parseInt(limit)}` : '';
    const upcomingSessionsResult = await pool.query(
      `
      SELECT 
        ca.appointment_id as session_id,
        ca.elder_id,
        ca.family_id,
        ca.counselor_id,
        ca.date_time,
        ca.notes as session_notes,
        ca.status,
        ca.appointment_type as session_type,
        ca.meeting_link,
        c.specialization,
        c.years_of_experience,
        c.current_institution,
        c.district as counselor_district,
        u.name as counselor_name,
        u.email as counselor_email,
        u.phone as counselor_phone
      FROM counselor_appointment ca
      INNER JOIN counselor c ON ca.counselor_id = c.counselor_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE ca.elder_id = $1 
      AND ca.date_time > NOW()
      AND ca.status IN ('confirmed')
      AND ca.status != 'cancelled'
      ORDER BY ca.date_time ASC
      ${limitClause}
    `,
      [elderId]
    );

    console.log("Upcoming sessions found:", upcomingSessionsResult.rows.length);

    res.json({
      success: true,
      sessions: upcomingSessionsResult.rows,
      count: upcomingSessionsResult.rows.length
    });

  } catch (err) {
    console.error("Error fetching upcoming sessions:", err);
    res.status(500).json({
      success: false,
      error: "Server error while fetching upcoming sessions"
    });
  }
};

// Get past sessions for an elder (limited to 2 for dashboard)
const getPastSessions = async (req, res) => {
  const { elderId } = req.params;
  const { limit } = req.query; // Add limit parameter for dashboard
  console.log("Fetching past sessions for elder ID:", elderId);

  try {
    // Check if elder exists
    const elderCheck = await pool.query(
      "SELECT * FROM elder WHERE elder_id = $1",
      [elderId]
    );
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Elder not found"
      });
    }

    // Query to get past counselor appointments with counselor details
    const limitClause = limit ? `LIMIT ${parseInt(limit)}` : '';
    const pastSessionsResult = await pool.query(
      `
      SELECT 
        ca.appointment_id as session_id,
        ca.elder_id,
        ca.family_id,
        ca.counselor_id,
        ca.date_time,
        ca.notes as session_notes,
        ca.status,
        ca.appointment_type as session_type,
        ca.meeting_link,
        c.specialization,
        c.years_of_experience,
        c.current_institution,
        c.district as counselor_district,
        u.name as counselor_name,
        u.email as counselor_email,
        u.phone as counselor_phone
      FROM counselor_appointment ca
      INNER JOIN counselor c ON ca.counselor_id = c.counselor_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE ca.elder_id = $1 
      AND (ca.date_time <= NOW() OR ca.status IN ('completed', 'cancelled'))
      ORDER BY ca.date_time DESC
      ${limitClause}
    `,
      [elderId]
    );

    console.log("Past sessions found:", pastSessionsResult.rows.length);

    res.json({
      success: true,
      sessions: pastSessionsResult.rows,
      count: pastSessionsResult.rows.length
    });

  } catch (err) {
    console.error("Error fetching past sessions:", err);
    res.status(500).json({
      success: false,
      error: "Server error while fetching past sessions"
    });
  }
};

// Get all sessions for an elder
const getAllSessions = async (req, res) => {
  const { elderId } = req.params;
  console.log("Fetching all sessions for elder ID:", elderId);

  try {
    // Check if elder exists
    const elderCheck = await pool.query(
      "SELECT * FROM elder WHERE elder_id = $1",
      [elderId]
    );
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Elder not found"
      });
    }

    // Query to get all counselor appointments with counselor details
    const allSessionsResult = await pool.query(
      `
      SELECT 
        ca.appointment_id as session_id,
        ca.elder_id,
        ca.family_id,
        ca.counselor_id,
        ca.date_time,
        ca.notes as session_notes,
        ca.status,
        ca.appointment_type as session_type,
        ca.meeting_link,
        c.specialization,
        c.years_of_experience,
        c.current_institution,
        c.district as counselor_district,
        u.name as counselor_name,
        u.email as counselor_email,
        u.phone as counselor_phone
      FROM counselor_appointment ca
      INNER JOIN counselor c ON ca.counselor_id = c.counselor_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE ca.elder_id = $1 
      ORDER BY ca.date_time DESC
    `,
      [elderId]
    );

    console.log("All sessions found:", allSessionsResult.rows.length);

    res.json({
      success: true,
      sessions: allSessionsResult.rows,
      count: allSessionsResult.rows.length
    });

  } catch (err) {
    console.error("Error fetching all sessions:", err);
    res.status(500).json({
      success: false,
      error: "Server error while fetching sessions"
    });
  }
};

// Get specific session by ID
const getSessionById = async (req, res) => {
  const { elderId, sessionId } = req.params;
  console.log("Fetching session details for elder ID:", elderId, "session ID:", sessionId);

  try {
    const sessionResult = await pool.query(
      `
      SELECT 
        ca.appointment_id as session_id,
        ca.elder_id,
        ca.family_id,
        ca.counselor_id,
        ca.date_time,
        ca.notes as session_notes,
        ca.status,
        ca.appointment_type as session_type,
        ca.meeting_link,
        c.specialization,
        c.years_of_experience,
        c.current_institution,
        c.district as counselor_district,
        u.name as counselor_name,
        u.email as counselor_email,
        u.phone as counselor_phone
      FROM counselor_appointment ca
      INNER JOIN counselor c ON ca.counselor_id = c.counselor_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE ca.elder_id = $1 AND ca.appointment_id = $2
    `,
      [elderId, sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found"
      });
    }

    console.log("Session found:", sessionResult.rows[0]);

    res.json({
      success: true,
      session: sessionResult.rows[0]
    });

  } catch (err) {
    console.error("Error fetching session by ID:", err);
    res.status(500).json({
      success: false,
      error: "Server error while fetching session details"
    });
  }
};

// Join session (for online sessions)
const joinSession = async (req, res) => {
  const { elderId, sessionId } = req.params;

  console.log("Joining session for elder ID:", elderId, "session ID:", sessionId);

  try {
    // Check if counselor appointment exists and belongs to the elder
    const sessionCheck = await pool.query(
      `
      SELECT 
        ca.*,
        u.name as counselor_name
      FROM counselor_appointment ca
      INNER JOIN counselor c ON ca.counselor_id = c.counselor_id
      INNER JOIN "User" u ON c.user_id = u.user_id
      WHERE ca.appointment_id = $1 AND ca.elder_id = $2
    `,
      [sessionId, elderId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found"
      });
    }

    const session = sessionCheck.rows[0];

    // Check if appointment is online
    if (session.appointment_type !== 'online') {
      return res.status(400).json({
        success: false,
        error: "Only online sessions can be joined"
      });
    }

    // Check if session is scheduled for today or is starting soon
    const sessionTime = new Date(session.date_time);
    const now = new Date();
    const timeDiff = sessionTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    console.log('Session timing check:', {
      sessionTime: sessionTime.toISOString(),
      now: now.toISOString(),
      minutesDiff,
      timeDiff
    });

    // Allow joining 30 minutes before the session starts
    if (minutesDiff > 30) {
      return res.status(400).json({
        success: false,
        error: "Session can only be joined 30 minutes before the scheduled time"
      });
    }

    // Use existing meeting_link or generate one if not exists
    let meetingUrl = session.meeting_link;
    if (!meetingUrl) {
      meetingUrl = `https://meet.silvercare.com/session/${sessionId}?elder=${elderId}&counselor=${session.counselor_id}`;
    }

    console.log("Session join successful, meeting URL generated");

    res.json({
      success: true,
      message: "Session joined successfully",
      meetingUrl: meetingUrl,
      session: {
        session_id: session.appointment_id,
        counselor_name: session.counselor_name,
        date_time: session.date_time,
        session_type: session.appointment_type
      }
    });

  } catch (err) {
    console.error("Error joining session:", err);
    res.status(500).json({
      success: false,
      error: "Server error while joining session"
    });
  }
};

module.exports = {
  getUpcomingSessions,
  getPastSessions,
  getAllSessions,
  getSessionById,
  joinSession
};
