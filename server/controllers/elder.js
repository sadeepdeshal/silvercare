const pool = require("../db");

// Fetch elder details based on user email
const getElderDetails = async (req, res) => {
  const { email } = req.query; 
  console.log('Received email:', email);
  
  try {
    // Query to join User and elder tables based on email (changed "Elder" to "elder")
    const elderResult = await pool.query(`
      SELECT 
        e.elder_id,
        e.family_id,
        e.name as elder_name,
        e.dob,
        e.gender,
        e.contact,
        e.address,
        e.nic as ni,
        e.medical_conditions,
        e.profile_photo,
        e.email as elder_email,
        e.created_at as elder_created_at,
        u.user_id,
        u.name as user_name,
        u.phone as user_phone,
        u.role,
        u.created_at as user_created_at
      FROM elder e
      INNER JOIN "User" u ON LOWER(e.email) = LOWER(u.email)
      WHERE LOWER(u.email) = LOWER($1)
    `, [email]);

    if (elderResult.rows.length === 0) {
      return res.status(404).json({ error: "Elder details not found for this user" });
    }

    // Send the elder details in the response
    const elderData = elderResult.rows[0];
    
    // Format the response
    const response = {
      elder_id: elderData.elder_id,
      family_id: elderData.family_id,
      name: elderData.elder_name,
      dob: elderData.dob,
      gender: elderData.gender,
      contact: elderData.contact,
      address: elderData.address,
      ni: elderData.ni,
      medical_conditions: elderData.medical_conditions,
      profile_photo: elderData.profile_photo,
      email: elderData.elder_email,
      user_details: {
        user_id: elderData.user_id,
        user_name: elderData.user_name,
        user_phone: elderData.user_phone,
        role: elderData.role,
        user_created_at: elderData.user_created_at
      },
      created_at: elderData.elder_created_at
    };

    res.json(response);
  } catch (err) {
    console.error("Error in getElderDetails:", err);
    res.status(500).json({ error: "Server error while fetching elder details" });
  }
};

module.exports = { getElderDetails };
