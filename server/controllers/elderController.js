const pool = require('../db');

const getEldersByFamilyMember = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    console.log('Getting elders for family member:', familyMemberId);
    
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
    console.log('Found family_id:', familyId);
    
    // Now get elders using the family_id - include email and created_at
    const result = await pool.query(
      `SELECT 
        elder_id,
        family_id,
        name,
        email,                    -- ADD EMAIL HERE
        dob,
        gender,
        contact,
        address,
        nic,
        medical_conditions,
        profile_photo,
        created_at               -- ADD CREATED_AT HERE
        
      FROM elder 
      WHERE family_id = $1 
      ORDER BY created_at DESC`,
      [familyId]
    );
    
    console.log('Found elders:', result.rows.length);
    
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
    console.log('Fetching elder with ID:', elderId);
    
    const result = await pool.query(
      `SELECT 
        elder_id,
        family_id,
        name as full_name,
        email,                    -- ADD EMAIL HERE
        dob as date_of_birth,
        gender,
        contact as contact_number,
        address,
        nic as nic_passport,
        medical_conditions,
        profile_photo,
        created_at              -- ADD CREATED_AT HERE
        
      FROM elder
      WHERE elder_id = $1`,
      [elderId]
    );
    
    console.log('Elder query result:', result.rows);
    
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
    email,
    date_of_birth,
    gender,
    nic_passport,
    contact_number,
    medical_conditions,
    address
  } = req.body;
  
  try {
    // Validate required fields
    if (!full_name || !date_of_birth || !gender || !nic_passport || !contact_number) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address'
        });
      }
    }

    // Validate contact number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact_number)) {
      return res.status(400).json({
        success: false,
        error: 'Contact number must be exactly 10 digits'
      });
    }

    // Validate date of birth (should be in the past and reasonable age)
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (birthDate >= today) {
      return res.status(400).json({
        success: false,
        error: 'Date of birth must be in the past'
      });
    }
    
    if (age < 50) {
      return res.status(400).json({
        success: false,
        error: 'Elder must be at least 50 years old'
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

    // Check if email is already used by another elder (excluding current elder)
    if (email) {
      const emailCheck = await pool.query(
        'SELECT * FROM elder WHERE email = $1 AND elder_id != $2',
        [email, elderId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email address is already registered with another elder'
        });
      }
    }

    // Check if contact is already used by another elder (excluding current elder)
    const contactCheck = await pool.query(
      'SELECT * FROM elder WHERE contact = $1 AND elder_id != $2',
      [contact_number, elderId]
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
      [nic_passport, elderId]
    );
    if (nicCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'NIC is already registered with another elder'
      });
    }

    // Validate and normalize gender for enum
    const validGenders = {
      'Male': 'male',
      'Female': 'female',
      'Other': 'other',
      'male': 'male',
      'female': 'female',
      'other': 'other'
    };
    
    const normalizedGender = validGenders[gender];
    if (!normalizedGender) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gender selection. Must be Male, Female, or Other'
      });
    }

    const updateQuery = `
      UPDATE elder 
      SET name = $1, 
          email = $2,
          dob = $3, 
          gender = $4::gender_type, 
          nic = $5, 
          contact = $6, 
          medical_conditions = $7, 
          address = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE elder_id = $9
      RETURNING elder_id, name as full_name, email, dob as date_of_birth, gender, nic as nic_passport, contact as contact_number, medical_conditions, address, created_at, updated_at
    `;
    
    const result = await pool.query(updateQuery, [
      full_name,
      email || null,
      date_of_birth,
      normalizedGender,
      nic_passport,
      contact_number,
      medical_conditions || null,
      address || null,
      elderId
    ]);
    
    res.json({
      success: true,
      message: 'Elder details updated successfully',
      elder: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating elder:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint && err.constraint.includes('email')) {
        return res.status(400).json({
          success: false,
          error: 'Email address is already registered with another elder'
        });
      }
      if (err.constraint && err.constraint.includes('contact')) {
        return res.status(400).json({
          success: false,
          error: 'Contact number is already registered with another elder'
        });
      }
      if (err.constraint && err.constraint.includes('nic')) {
        return res.status(400).json({
          success: false,
          error: 'NIC is already registered with another elder'
        });
      }
    }
    
    // Handle enum constraint violation
    if (err.code === '22P02' || err.message.includes('invalid input value for enum')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gender value. Please select Male, Female, or Other.'
      });
    }
    
    // Handle foreign key constraint violation
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Invalid elder reference'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error updating elder data' 
    });
  }
};



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

    // Validate date of birth (should be in the past and reasonable age)
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (birthDate >= today) {
      return res.status(400).json({ 
        success: false,
        error: 'Date of birth must be in the past' 
      });
    }
    
    if (age < 50) {
      return res.status(400).json({ 
        success: false,
        error: 'Elder must be at least 50 years old' 
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

    // Normalize gender for enum
    let normalizedGender = gender;
    if (gender === 'Male') normalizedGender = 'male';
    if (gender === 'Female') normalizedGender = 'female';
    if (gender === 'Other') normalizedGender = 'other';

    // Insert new elder
    const result = await pool.query(
      `INSERT INTO elder (
        family_id, name, dob, gender, contact, address, nic, medical_conditions, profile_photo
      ) VALUES ($1, $2, $3, $4::gender_type, $5, $6, $7, $8, $9) 
      RETURNING elder_id, family_id, name, dob, gender, contact, address, nic, medical_conditions, profile_photo`,
      [
        family_id,
        name,
        dob,
        normalizedGender,
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
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint && err.constraint.includes('contact')) {
        return res.status(400).json({ 
          success: false,
          error: 'Contact number already registered' 
        });
      }
      if (err.constraint && err.constraint.includes('nic')) {
        return res.status(400).json({ 
          success: false,
          error: 'NIC already registered' 
        });
      }
    }
    
    if (err.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({ 
        success: false,
        error: 'Invalid family member reference' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error creating elder registration' 
    });
  }
};

// Delete elder
const deleteElder = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    // Check if elder exists
    const elderCheck = await pool.query('SELECT * FROM elder WHERE elder_id = $1', [elderId]);
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    // Delete the elder
    await pool.query('DELETE FROM elder WHERE elder_id = $1', [elderId]);
    
    res.json({
      success: true,
      message: 'Elder deleted successfully'
    });
    
  } catch (err) {
    console.error('Error deleting elder:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting elder' 
    });
  }
};

// Get elder statistics for a family member
const getElderStats = async (req, res) => {
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
    
    // Get various statistics
    const totalEldersResult = await pool.query(
      'SELECT COUNT(*) as total FROM elder WHERE family_id = $1',
      [familyId]
    );
    
    const genderStatsResult = await pool.query(
      'SELECT gender, COUNT(*) as count FROM elder WHERE family_id = $1 GROUP BY gender',
      [familyId]
    );
    
    const ageStatsResult = await pool.query(
      `SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(dob)) BETWEEN 50 AND 60 THEN '50-60'
          WHEN EXTRACT(YEAR FROM AGE(dob)) BETWEEN 61 AND 70 THEN '61-70'
          WHEN EXTRACT(YEAR FROM AGE(dob)) BETWEEN 71 AND 80 THEN '71-80'
          WHEN EXTRACT(YEAR FROM AGE(dob)) > 80 THEN '80+'
          ELSE 'Unknown'
        END as age_group,
                COUNT(*) as count
      FROM elder 
      WHERE family_id = $1 
      GROUP BY age_group`,
      [familyId]
    );
    
    const recentEldersResult = await pool.query(
      `SELECT 
        elder_id,
        name,
        dob,
        gender,
        contact,
        created_at
      FROM elder 
      WHERE family_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5`,
      [familyId]
    );
    
    res.json({
      success: true,
      stats: {
        total: parseInt(totalEldersResult.rows[0].total),
        genderDistribution: genderStatsResult.rows,
        ageDistribution: ageStatsResult.rows,
        recentElders: recentEldersResult.rows
      }
    });
    
  } catch (err) {
    console.error('Error fetching elder stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching elder statistics' 
    });
  }
};

// Search elders by name or contact
const searchElders = async (req, res) => {
  const { familyMemberId } = req.params;
  const { query } = req.query;
  
  try {
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }
    
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
    
    // Search elders by name or contact
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
      AND (
        LOWER(name) LIKE LOWER($2) 
        OR contact LIKE $3
        OR LOWER(nic) LIKE LOWER($2)
      )
      ORDER BY name ASC`,
      [familyId, `%${query}%`, `%${query}%`]
    );
    
    res.json({
      success: true,
      elders: result.rows,
      count: result.rows.length,
      query: query
    });
    
  } catch (err) {
    console.error('Error searching elders:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error searching elders' 
    });
  }
};

// Get elders with medical conditions
const getEldersWithMedicalConditions = async (req, res) => {
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
    
    // Get elders with medical conditions
    const result = await pool.query(
      `SELECT 
        elder_id,
        name,
        dob,
        gender,
        contact,
        medical_conditions,
        profile_photo
      FROM elder 
      WHERE family_id = $1 
      AND medical_conditions IS NOT NULL 
      AND medical_conditions != ''
      ORDER BY name ASC`,
      [familyId]
    );
    
    res.json({
      success: true,
      elders: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching elders with medical conditions:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching elders with medical conditions' 
    });
  }
};

// Update elder profile photo
const updateElderPhoto = async (req, res) => {
  const { elderId } = req.params;
  const { profile_photo } = req.body;
  
  try {
    // Check if elder exists
    const elderCheck = await pool.query('SELECT * FROM elder WHERE elder_id = $1', [elderId]);
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    // Update profile photo
    const result = await pool.query(
      'UPDATE elder SET profile_photo = $1 WHERE elder_id = $2 RETURNING elder_id, name, profile_photo',
      [profile_photo, elderId]
    );
    
    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      elder: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating elder photo:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error updating profile photo' 
    });
  }
};

// Get elder's emergency contacts (if you have a separate table for this)
const getElderEmergencyContacts = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    // Check if elder exists
    const elderCheck = await pool.query('SELECT * FROM elder WHERE elder_id = $1', [elderId]);
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    // For now, return the family member as emergency contact
    // You can extend this to have a separate emergency_contacts table
    const result = await pool.query(
      `SELECT 
        u.name as contact_name,
        u.email as contact_email,
        u.phone as contact_phone,
        'Family Member' as relationship
      FROM elder e
      JOIN familymember fm ON e.family_id = fm.family_id
      JOIN "User" u ON fm.user_id = u.user_id
      WHERE e.elder_id = $1`,
      [elderId]
    );
    
    res.json({
      success: true,
      emergencyContacts: result.rows
    });
    
  } catch (err) {
    console.error('Error fetching emergency contacts:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching emergency contacts' 
    });
  }
};

// Bulk update elders (for batch operations)
const bulkUpdateElders = async (req, res) => {
  const { updates } = req.body; // Array of {elder_id, field, value}
  
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required'
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      
      for (const update of updates) {
        const { elder_id, field, value } = update;
        
        // Validate allowed fields
        const allowedFields = ['name', 'dob', 'gender', 'contact', 'address', 'nic', 'medical_conditions'];
        if (!allowedFields.includes(field)) {
          throw new Error(`Field '${field}' is not allowed for bulk update`);
        }
        
        // Build dynamic query
        const query = `UPDATE elder SET ${field} = $1 WHERE elder_id = $2 RETURNING elder_id, ${field}`;
        const result = await client.query(query, [value, elder_id]);
        
        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `${results.length} elders updated successfully`,
        updatedElders: results
      });
      
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Error in bulk update:', err);
    res.status(500).json({ 
      success: false,
      error: err.message || 'Error updating elders' 
    });
  }
};

module.exports = {
  getEldersByFamilyMember,
  getElderCount,
  getElderById,
  updateElder,
  createElder,
  deleteElder,
  getElderStats,
  searchElders,
  getEldersWithMedicalConditions,
  updateElderPhoto,
  getElderEmergencyContacts,
  bulkUpdateElders
};

