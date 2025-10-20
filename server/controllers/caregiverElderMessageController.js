const db = require('../db');

const caregiverElderMessageController = {
  // Get elders assigned to a caregiver for messaging
  getEldersForCaregiver: async (req, res) => {
    try {
      const { caregiverId } = req.params;

      console.log('Fetching elders for caregiver:', caregiverId);

      const query = `
        WITH latest_assignments AS (
          SELECT DISTINCT ON (e.elder_id)
            e.elder_id,
            e.name as elder_name,
            e.email as elder_email,
            e.contact as elder_phone,
            e.age,
            e.medical_conditions,
            e.address,
            e.district,
            ca.status as assignment_status,
            ca.start_date,
            ca.end_date,
            ca.duration,
            fm.family_id,
            u_fm.name as family_member_name
          FROM Elder e
          JOIN carerequest ca ON e.elder_id = ca.elder_id
          JOIN FamilyMember fm ON e.family_id = fm.family_id
          JOIN "User" u_fm ON fm.user_id = u_fm.user_id
          WHERE ca.caregiver_id = $1
            AND ca.status IN ('approved', 'completed', 'confirmed')
          ORDER BY e.elder_id, ca.start_date DESC
        ),
        assignment_counts AS (
          SELECT 
            elder_id,
            COUNT(*) as total_assignments,
            MAX(start_date) as latest_assignment_date
          FROM carerequest
          WHERE caregiver_id = $1
            AND status IN ('approved', 'completed', 'confirmed')
          GROUP BY elder_id
        )
        SELECT 
          la.*,
          ac.total_assignments,
          ac.latest_assignment_date
        FROM latest_assignments la
        JOIN assignment_counts ac ON la.elder_id = ac.elder_id
        ORDER BY ac.latest_assignment_date DESC
      `;

      const result = await db.query(query, [caregiverId]);

      console.log(`Found ${result.rows.length} elders for caregiver ${caregiverId}`);

      res.json({
        success: true,
        elders: result.rows
      });

    } catch (error) {
      console.error('Error fetching elders for caregiver:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch elders'
      });
    }
  },

  // Get caregivers assigned to an elder for messaging
  getCaregiversForElder: async (req, res) => {
    try {
      const { elderUserId } = req.params;

      console.log('Fetching caregivers for elder:', elderUserId);

      const query = `
        WITH latest_assignments AS (
          SELECT DISTINCT ON (c.caregiver_id)
            c.caregiver_id,
            c.user_id,
            u.name as caregiver_name,
            u.email as caregiver_email,
            u.phone as caregiver_phone,
            c.district as caregiver_district,
            c.availability,
            c.fixed_line,
            ca.status as assignment_status,
            ca.start_date,
            ca.end_date,
            ca.duration
          FROM caregiver c
          JOIN "User" u ON c.user_id = u.user_id
          JOIN carerequest ca ON c.caregiver_id = ca.caregiver_id
          JOIN Elder e ON ca.elder_id = e.elder_id
          WHERE e.elder_id = $1
            AND ca.status IN ('approved', 'completed', 'confirmed')
          ORDER BY c.caregiver_id, ca.start_date DESC
        ),
        assignment_counts AS (
          SELECT 
            caregiver_id,
            COUNT(*) as total_assignments,
            MAX(start_date) as latest_assignment_date
          FROM carerequest ca
          JOIN Elder e ON ca.elder_id = e.elder_id
          WHERE e.elder_id = $1
            AND ca.status IN ('approved', 'completed', 'confirmed')
          GROUP BY caregiver_id
        )
        SELECT 
          la.*,
          ac.total_assignments,
          ac.latest_assignment_date
        FROM latest_assignments la
        JOIN assignment_counts ac ON la.caregiver_id = ac.caregiver_id
        ORDER BY ac.latest_assignment_date DESC
      `;

      const result = await db.query(query, [elderUserId]);

      console.log(`Found ${result.rows.length} caregivers for elder ${elderUserId}`);

      res.json({
        success: true,
        caregivers: result.rows
      });

    } catch (error) {
      console.error('Error fetching caregivers for elder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch caregivers'
      });
    }
  },

  // Get care assignment details between caregiver and elder
  getCareAssignmentDetails: async (req, res) => {
    try {
      const { caregiverId, elderUserId } = req.params;

      console.log('Fetching assignment details for caregiver:', caregiverId, 'and elder:', elderUserId);

      const query = `
        SELECT 
          ca.*,
          e.name as elder_name,
          e.age as elder_age,
          e.medical_conditions,
          e.address as elder_address,
          e.district as elder_district,
          e.email as elder_email,
          e.contact as elder_phone,
          c.availability as caregiver_availability,
          c.fixed_line,
          c.district as caregiver_district,
          u_c.name as caregiver_name,
          u_c.email as caregiver_email,
          u_c.phone as caregiver_phone,
          fm.family_id,
          u_fm.name as family_member_name
        FROM carerequest ca
        JOIN Elder e ON ca.elder_id = e.elder_id
        JOIN caregiver c ON ca.caregiver_id = c.caregiver_id
        JOIN "User" u_c ON c.user_id = u_c.user_id
        JOIN FamilyMember fm ON e.family_id = fm.family_id
        JOIN "User" u_fm ON fm.user_id = u_fm.user_id
        WHERE ca.caregiver_id = $1 
          AND e.elder_id = $2
          AND ca.status IN ('approved', 'completed', 'confirmed')
        ORDER BY ca.start_date DESC
      `;

      const result = await db.query(query, [caregiverId, elderUserId]);

      res.json({
        success: true,
        assignments: result.rows
      });

    } catch (error) {
      console.error('Error fetching care assignment details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment details'
      });
    }
  },

  // Send message from caregiver to elder
  sendMessage: async (req, res) => {
    try {
      const { caregiverId, elderUserId } = req.params; // elderUserId is actually elder_id
      const { message, senderType } = req.body;

      console.log('Sending message from caregiver to elder:', { caregiverId, elderUserId, senderType });

      // Verify the caregiver-elder relationship exists
      const relationshipQuery = `
        SELECT ca.request_id 
        FROM carerequest ca
        JOIN Elder e ON ca.elder_id = e.elder_id
        WHERE ca.caregiver_id = $1 
          AND e.elder_id = $2
          AND ca.status IN ('approved', 'completed', 'confirmed')
        LIMIT 1
      `;

      const relationshipResult = await db.query(relationshipQuery, [caregiverId, elderUserId]);

      if (relationshipResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No active care assignment found between caregiver and elder'
        });
      }

      // Get sender and receiver IDs
      let senderId, receiverId, senderDbType, receiverDbType;
      
      if (senderType === 'caregiver') {
        const caregiverQuery = 'SELECT user_id FROM caregiver WHERE caregiver_id = $1';
        const caregiverResult = await db.query(caregiverQuery, [caregiverId]);
        senderId = caregiverResult.rows[0]?.user_id;
        receiverId = elderUserId; // This is elder_id, not user_id
        senderDbType = 'caregiver';
        receiverDbType = 'elder';
      } else {
        const caregiverQuery = 'SELECT user_id FROM caregiver WHERE caregiver_id = $1';
        const caregiverResult = await db.query(caregiverQuery, [caregiverId]);
        senderId = elderUserId; // This is elder_id, not user_id
        receiverId = caregiverResult.rows[0]?.user_id;
        senderDbType = 'elder';
        receiverDbType = 'caregiver';
      }

      if (!senderId || !receiverId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sender or receiver'
        });
      }

      // For this implementation, I'll store elder messages with their elder_id
      // This requires modifying how we think about the Messages table for elders
      // For now, let's use a custom approach for elder-caregiver messages
      
      const insertQuery = `
        INSERT INTO caregiver_elder_messages (caregiver_id, elder_id, sender_type, message, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;

      // Check if the table exists, if not create it
      try {
        const result = await db.query(insertQuery, [
          caregiverId,
          elderUserId,
          senderType,
          message
        ]);

        res.json({
          success: true,
          message: result.rows[0]
        });
      } catch (tableError) {
        if (tableError.code === '42P01') { // Table doesn't exist
          // Create the table and try again
          await db.query(`
            CREATE TABLE IF NOT EXISTS caregiver_elder_messages (
              message_id SERIAL PRIMARY KEY,
              caregiver_id INTEGER REFERENCES caregiver(caregiver_id),
              elder_id INTEGER REFERENCES Elder(elder_id),
              sender_type VARCHAR(20) CHECK (sender_type IN ('caregiver', 'elder')),
              message TEXT NOT NULL,
              timestamp TIMESTAMP DEFAULT NOW()
            )
          `);
          
          const result = await db.query(insertQuery, [
            caregiverId,
            elderUserId,
            senderType,
            message
          ]);

          res.json({
            success: true,
            message: result.rows[0]
          });
        } else {
          throw tableError;
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  },

  // Get messages between caregiver and elder
  getMessages: async (req, res) => {
    try {
      const { caregiverId, elderUserId } = req.params; // elderUserId is actually elder_id

      console.log('Fetching messages between caregiver:', caregiverId, 'and elder:', elderUserId);

      const query = `
        SELECT 
          cem.*,
          c_user.name as caregiver_name,
          e.name as elder_name
        FROM caregiver_elder_messages cem
        LEFT JOIN caregiver c ON cem.caregiver_id = c.caregiver_id
        LEFT JOIN "User" c_user ON c.user_id = c_user.user_id
        LEFT JOIN Elder e ON cem.elder_id = e.elder_id
        WHERE cem.caregiver_id = $1 AND cem.elder_id = $2
        ORDER BY cem.timestamp ASC
      `;

      try {
        const result = await db.query(query, [caregiverId, elderUserId]);

        res.json({
          success: true,
          messages: result.rows
        });
      } catch (tableError) {
        if (tableError.code === '42P01') { // Table doesn't exist
          // Return empty messages if table doesn't exist yet
          res.json({
            success: true,
            messages: []
          });
        } else {
          throw tableError;
        }
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages'
      });
    }
  }
};

module.exports = caregiverElderMessageController;