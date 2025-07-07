const pool = require("../db");

// Fetch elder details based on user email
const getElderDetails = async (req, res) => {
  const { email } = req.query; 
  console.log('Received email:', email);
  
  try {
    // Query to join User, elder, familymember tables based on email
    const elderResult = await pool.query(`
      SELECT 
        e.elder_id,
        e.family_id,
        e.name as elder_name,
        e.dob,
        e.gender,
        e.contact,
        e.address,
        e.nic,
        e.medical_conditions,
        e.profile_photo,
        e.email as elder_email,
        e.created_at as elder_created_at,
        u.user_id,
        u.name as user_name,
        u.phone as user_phone,
        u.role,
        u.created_at as user_created_at,
        fm.family_id as fm_family_id,
        fm.user_id as fm_user_id,
        fm.address as fm_address,
        fm.phone_fixed as fm_phone_fixed,
        fu.user_id as family_user_id,
        fu.name as family_member_name,
        fu.email as family_member_email,
        fu.phone as family_member_phone,
        fu.created_at as family_member_created_at
      FROM elder e
      INNER JOIN "User" u ON LOWER(e.email) = LOWER(u.email)
      LEFT JOIN familymember fm ON e.family_id = fm.family_id
      LEFT JOIN "User" fu ON fm.user_id = fu.user_id
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
      nic: elderData.nic,
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
      family_member: elderData.family_member_name ? {
        name: elderData.family_member_name,
        email: elderData.family_member_email,
        phone: elderData.family_member_phone,
        phone_fixed: elderData.fm_phone_fixed,
        address: elderData.fm_address,
        created_at: elderData.family_member_created_at
      } : null,
      created_at: elderData.elder_created_at
    };

    res.json(response);
  } catch (err) {
    console.error("Error in getElderDetails:", err);
    res.status(500).json({ error: "Server error while fetching elder details" });
  }
};

module.exports = { getElderDetails };
