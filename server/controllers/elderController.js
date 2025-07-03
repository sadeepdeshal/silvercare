const pool = require('../db');

const getEldersByFamilyMember = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT 
        id,
        full_name,
        date_of_birth,
        gender,
        nic_passport,
        contact_number,
        medical_conditions,
        address,
        profile_photo,
        email,
        created_at,
        updated_at
      FROM elderreg 
      WHERE family_member_id = $1 
      ORDER BY created_at DESC`,
      [familyMemberId]
    );
    
    res.json({
      success: true,
      elders: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching elders:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching elders data' 
    });
  }
};

const getElderCount = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM elderreg WHERE family_member_id = $1',
      [familyMemberId]
    );
    
    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
    
  } catch (err) {
    console.error('Error fetching elder count:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching elder count' 
    });
  }
};

module.exports = {
  getEldersByFamilyMember,
  getElderCount
};
