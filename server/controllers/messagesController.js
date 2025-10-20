const db = require('../db');

const messagesController = {
  // Send a new message
  sendMessage: async (req, res) => {
    try {
      const { sender_id, receiver_id, sender_type, receiver_type, message_text } = req.body;

      if (!sender_id || !receiver_id || !sender_type || !receiver_type || !message_text) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      const query = `
        INSERT INTO messages (sender_id, receiver_id, sender_type, receiver_type, message_text)
        VALUES ($1, $2, $3, $4, $5) RETURNING message_id
      `;

      const result = await db.query(query, [
        sender_id, receiver_id, sender_type, receiver_type, message_text
      ]);

      res.json({
        success: true,
        message: 'Message sent successfully',
        message_id: result.rows[0].message_id
      });

    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  },

  // Get conversation between two users
  getConversation: async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;

      const query = `
        SELECT 
          m.*,
          sender.name as sender_name,
          receiver.name as receiver_name
        FROM messages m
        JOIN "User" sender ON m.sender_id = sender.user_id
        JOIN "User" receiver ON m.receiver_id = receiver.user_id
        WHERE 
          (m.sender_id = $1 AND m.receiver_id = $2) OR 
          (m.sender_id = $2 AND m.receiver_id = $1)
        ORDER BY m.sent_at ASC
      `;

      const result = await db.query(query, [userId1, userId2]);

      res.json({
        success: true,
        messages: result.rows
      });

    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation'
      });
    }
  },

  // Mark messages as read
  markAsRead: async (req, res) => {
    try {
      const { sender_id, receiver_id } = req.body;

      const query = `
        UPDATE messages 
        SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE
      `;

      await db.query(query, [sender_id, receiver_id]);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read'
      });
    }
  },

  // Get unread message count
  getUnreadCount: async (req, res) => {
    try {
      const { userId } = req.params;

      const query = `
        SELECT COUNT(*) as unread_count
        FROM messages
        WHERE receiver_id = $1 AND is_read = FALSE
      `;

      const result = await db.query(query, [userId]);

      res.json({
        success: true,
        unread_count: result.rows[0].unread_count
      });

    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count'
      });
    }
  },

  // Get healthcare professionals who have appointments with family member's elders
  getHealthcareProfessionalsWithAppointments: async (req, res) => {
    try {
      const { familyUserId } = req.params;

      const query = `
        SELECT DISTINCT 
          u.user_id,
          u.name as counselor_name,
          u.email as counselor_email,
          u.phone as counselor_phone,
          c.counselor_id,
          c.specialization,
          c.years_of_experience,
          c.current_institution,
          c.district as counselor_district,
          COUNT(DISTINCT ca.appointment_id) as total_appointments,
          COUNT(DISTINCT CASE WHEN ca.status = 'confirmed' THEN ca.appointment_id END) as confirmed_appointments,
          COUNT(DISTINCT CASE WHEN ca.status = 'completed' THEN ca.appointment_id END) as completed_appointments,
          STRING_AGG(DISTINCT e.name, ', ') as elders_treated,
          MAX(ca.date_time) as latest_appointment_date
        FROM "User" u
        JOIN counselor c ON u.user_id = c.user_id
        JOIN counselor_appointment ca ON c.counselor_id = ca.counselor_id
        JOIN elder e ON ca.elder_id = e.elder_id
        JOIN familymember fm ON e.family_id = fm.family_id
        WHERE fm.user_id = $1 
          AND ca.status IN ('confirmed', 'completed')
          AND c.status = 'confirmed'
        GROUP BY 
          u.user_id, u.name, u.email, u.phone, 
          c.counselor_id, c.specialization, c.years_of_experience, 
          c.current_institution, c.district
        ORDER BY latest_appointment_date DESC
      `;

      const result = await db.query(query, [familyUserId]);

      res.json({
        success: true,
        healthcareProfessionals: result.rows
      });

    } catch (error) {
      console.error('Error fetching healthcare professionals with appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch healthcare professionals'
      });
    }
  },

  // Get family members who have elders that have appointments with this healthcare professional
  getFamilyMembersWithAppointments: async (req, res) => {
    try {
      const { healthcareProfessionalUserId } = req.params;

      const query = `
        SELECT DISTINCT 
          u.user_id,
          u.name as family_member_name,
          u.email as family_member_email,
          u.phone as family_member_phone,
          fm.family_id,
          fm.address,
          fm.phone_fixed,
          COUNT(DISTINCT ca.appointment_id) as total_appointments,
          COUNT(DISTINCT CASE WHEN ca.status = 'confirmed' THEN ca.appointment_id END) as confirmed_appointments,
          COUNT(DISTINCT CASE WHEN ca.status = 'completed' THEN ca.appointment_id END) as completed_appointments,
          STRING_AGG(DISTINCT e.name, ', ') as elders_under_care,
          MAX(ca.date_time) as latest_appointment_date
        FROM "User" u
        JOIN familymember fm ON u.user_id = fm.user_id
        JOIN elder e ON fm.family_id = e.family_id
        JOIN counselor_appointment ca ON e.elder_id = ca.elder_id
        JOIN counselor c ON ca.counselor_id = c.counselor_id
        WHERE c.user_id = $1 
          AND ca.status IN ('confirmed', 'completed')
        GROUP BY 
          u.user_id, u.name, u.email, u.phone, 
          fm.family_id, fm.address, fm.phone_fixed
        ORDER BY latest_appointment_date DESC
      `;

      const result = await db.query(query, [healthcareProfessionalUserId]);

      res.json({
        success: true,
        familyMembers: result.rows
      });

    } catch (error) {
      console.error('Error fetching family members with appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch family members'
      });
    }
  }
};

module.exports = messagesController;
