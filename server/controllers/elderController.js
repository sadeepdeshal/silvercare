const pool = require('../db');

const getEldersByFamilyMember = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
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
    
    // Now get elders using the family_id
    const result = await pool.query(
      `SELECT 
        elder_id,
        family_id,
        name,
        dob,
        gender,
        contact,
        address,
        nic,
        medical_conditions,
        profile_photo
      FROM elder 
      WHERE family_id = $1 
      ORDER BY elder_id DESC`,
      [familyId]
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
    
    // Now count elders using the family_id
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM elder WHERE family_id = $1',
      [familyId]
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
        e.elder_id,
        e.family_id,
        e.name,
        e.dob,
        e.gender,
        e.contact,
        e.address,
        e.nic,
        e.medical_conditions,
        e.profile_photo,
        u.name as family_member_name,
        u.email as family_member_email,
        u.phone as family_member_phone
      FROM elder e
      LEFT JOIN familymember fm ON e.family_id = fm.family_id
      LEFT JOIN "User" u ON fm.user_id = u.user_id
      WHERE e.elder_id = $1`,
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
    name,
    dob,
    gender,
    nic,
    contact,
    medical_conditions,
    address
  } = req.body;
  
  try {
    // Validate required fields
    if (!name || !dob || !gender || !nic || !contact) {
      return res.status(400).json({ 
        success: false,
        error: 'All required fields must be filled' 
      });
    }

    // Validate contact number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact)) {
      return res.status(400).json({ 
        success: false,
        error: 'Contact number must be exactly 10 digits' 
      });
    }

    // Check if elder exists
    const elderCheck = await pool.query('SELECT * FROM elder WHERE elder_id = $1', [elderId]);
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    // Check if contact is already used by another elder (excluding current elder)
    const contactCheck = await pool.query(
      'SELECT * FROM elder WHERE contact = $1 AND elder_id != $2',
      [contact, elderId]
    );
    if (contactCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Contact number is already registered with another elder'
      });
    }

    // Check if NIC is already used by another elder (excluding current elder)
    const nicCheck = await pool.query(
      'SELECT * FROM elder WHERE nic = $1 AND elder_id != $2',
      [nic, elderId]
    );
    if (nicCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'NIC is already registered with another elder'
      });
    }

    const updateQuery = `
      UPDATE elder 
      SET name = $1, 
          dob = $2, 
          gender = $3, 
          nic = $4, 
          contact = $5, 
          medical_conditions = $6, 
          address = $7
      WHERE elder_id = $8
      RETURNING elder_id, name, dob, gender, nic, contact, medical_conditions, address
    `;
    
    const queryParams = [
      name,
      dob,
      gender,
      nic,
      contact,
      medical_conditions || null,
      address || null,
      elderId
    ];

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

// Create new elder
const createElder = async (req, res) => {
  const {
    family_id,
    name,
    dob,
    gender,
    contact,
    address,
    nic,
    medical_conditions,
    profile_photo
  } = req.body;
  
  try {
    // Validate required fields
    if (!family_id || !name || !dob || !gender || !contact || !nic) {
      return res.status(400).json({ 
        success: false,
        error: 'All required fields must be filled' 
      });
    }

    // Validate contact number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact)) {
      return res.status(400).json({ 
        success: false,
        error: 'Contact number must be exactly 10 digits' 
      });
    }

    // Check if contact already exists
    const existingContact = await pool.query(
      'SELECT * FROM elder WHERE contact = $1',
      [contact]
    );
    
    if (existingContact.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Contact number already registered' 
      });
    }

    // Check if NIC already exists
    const existingNIC = await pool.query(
      'SELECT * FROM elder WHERE nic = $1',
      [nic]
    );
    
    if (existingNIC.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'NIC already registered' 
      });
    }

    // Insert new elder
    const result = await pool.query(
      `INSERT INTO elder (
        family_id, name, dob, gender, contact, address, nic, medical_conditions, profile_photo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING elder_id, family_id, name, dob, gender, contact, address, nic, medical_conditions, profile_photo`,
      [
        family_id,
        name,
        dob,
        gender,
        contact,
        address || null,
        nic,
        medical_conditions || null,
        profile_photo || null
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Elder registered successfully',
      elder: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error creating elder:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error creating elder registration' 
    });
  }
};

module.exports = {
  getEldersByFamilyMember,
  getElderCount,
  getElderById,
  updateElder,
  createElder
};
