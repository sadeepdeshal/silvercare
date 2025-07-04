const pool = require('../db');
const bcrypt = require('bcrypt');

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

const getElderById = async (req, res) => {
  const { elderId } = req.params;
  
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
        role,
        family_member_id,
        created_at,
        updated_at
      FROM elderreg 
      WHERE id = $1`,
      [elderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }
    
    res.json({
      success: true,
      elder: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error fetching elder:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching elder data' 
    });
  }
};

const updateElder = async (req, res) => {
  const { elderId } = req.params;
  const {
    full_name,
    date_of_birth,
    gender,
    nic_passport,
    contact_number,
    medical_conditions,
    address,
    email,
    password,
    confirm_password
  } = req.body;
  
  try {
    // Validate required fields
    if (!full_name || !date_of_birth || !gender || !nic_passport || !contact_number || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'All required fields must be filled' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please enter a valid email address' 
      });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact_number)) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number must be exactly 10 digits' 
      });
    }

    // Check if elder exists
    const elderCheck = await pool.query('SELECT * FROM elderreg WHERE id = $1', [elderId]);
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    // Check if email is already used by another elder (excluding current elder)
    const emailCheck = await pool.query(
      'SELECT * FROM elderreg WHERE email = $1 AND id != $2',
      [email, elderId]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered with another elder'
      });
    }

    let updateQuery = `
      UPDATE elderreg 
      SET full_name = $1, 
          date_of_birth = $2, 
          gender = $3, 
          nic_passport = $4, 
          contact_number = $5, 
          medical_conditions = $6, 
          address = $7, 
          email = $8, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, full_name, date_of_birth, gender, nic_passport, contact_number, medical_conditions, address, email, updated_at
    `;
    
    let queryParams = [
      full_name,
      date_of_birth,
      gender,
      nic_passport,
      contact_number,
      medical_conditions || null,
      address || null,
      email,
      elderId
    ];

    // If password is provided, update it as well
    if (password && password.trim() !== '') {
      if (password !== confirm_password) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match'
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      updateQuery = `
        UPDATE elderreg 
        SET full_name = $1, 
            date_of_birth = $2, 
            gender = $3, 
            nic_passport = $4, 
            contact_number = $5, 
            medical_conditions = $6, 
            address = $7, 
            email = $8, 
            password = $9,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING id, full_name, date_of_birth, gender, nic_passport, contact_number, medical_conditions, address, email, updated_at
      `;
      
      queryParams = [
        full_name,
        date_of_birth,
        gender,
        nic_passport,
        contact_number,
        medical_conditions || null,
        address || null,
        email,
        hashedPassword,
        elderId
      ];
    }

    const result = await pool.query(updateQuery, queryParams);
    
    res.json({
      success: true,
      message: 'Elder details updated successfully',
      elder: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating elder:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating elder data' 
    });
  }
};

module.exports = {
  getEldersByFamilyMember,
  getElderCount,
  getElderById,
  updateElder
};
