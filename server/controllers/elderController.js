const pool = require('../db');
const bcrypt = require('bcrypt');

// Update the getEldersByFamilyMember function to include district
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
    
    // Now get elders using the family_id - include district field
    const result = await pool.query(
      `SELECT 
        elder_id,
        family_id,
        name,
        email,
        dob,
        gender,
        contact,
        address,
        nic,
        medical_conditions,
        profile_photo,
        district,
        created_at
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
        email,
        dob as date_of_birth,
        gender,
        contact as contact_number,
        address,
        nic as nic_passport,
        medical_conditions,
        profile_photo,
        created_at
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
    address,
    password,
    confirm_password
  } = req.body;
  
  try {
    console.log('Update elder request received:', {
      elderId,
      full_name,
      email,
      date_of_birth,
      gender,
      nic_passport,
      contact_number,
      address: address ? 'provided' : 'not provided',
      medical_conditions: medical_conditions ? 'provided' : 'not provided',
      password: password ? 'provided' : 'not provided'
    });

    // Validate required fields
    if (!full_name || !date_of_birth || !gender || !nic_passport || !contact_number) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'All required fields must be filled'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Validation failed: Invalid email format');
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address'
        });
      }
    }

    // Validate contact number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact_number)) {
      console.log('Validation failed: Invalid contact number format');
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
      console.log('Validation failed: Invalid birth date');
      return res.status(400).json({
        success: false,
        error: 'Date of birth must be in the past'
      });
    }
    
    if (age < 50) {
      console.log('Validation failed: Age too young');
      return res.status(400).json({
        success: false,
        error: 'Elder must be at least 50 years old'
      });
    }

    // Check if elder exists
    console.log('Checking if elder exists with ID:', elderId);
    const elderCheck = await pool.query('SELECT * FROM elder WHERE elder_id = $1', [elderId]);
    if (elderCheck.rows.length === 0) {
      console.log('Elder not found with ID:', elderId);
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    const currentElder = elderCheck.rows[0];
    console.log('Current elder data:', {
      elder_id: currentElder.elder_id,
      name: currentElder.name,
      email: currentElder.email,
      contact: currentElder.contact
    });

    // Check if email is already used by another elder (excluding current elder)
    if (email && email !== currentElder.email) {
      const emailCheck = await pool.query(
        'SELECT * FROM elder WHERE email = $1 AND elder_id != $2',
        [email, elderId]
      );
      if (emailCheck.rows.length > 0) {
        console.log('Email already in use by another elder');
        return res.status(400).json({
          success: false,
          error: 'Email address is already registered with another elder'
        });
      }

      // Also check User table if email is provided
      if (email) {
        const userEmailCheck = await pool.query(
          'SELECT * FROM "User" WHERE email = $1 AND email != $2',
          [email, currentElder.email || '']
        );
        if (userEmailCheck.rows.length > 0) {
          console.log('Email already in use in User table');
          return res.status(400).json({
            success: false,
            error: 'Email address is already registered in the system'
          });
        }
      }
    }

    // Check if contact is already used by another elder (excluding current elder)
    if (contact_number !== currentElder.contact) {
      const contactCheck = await pool.query(
        'SELECT * FROM elder WHERE contact = $1 AND elder_id != $2',
        [contact_number, elderId]
      );
      if (contactCheck.rows.length > 0) {
        console.log('Contact already in use by another elder');
        return res.status(400).json({
          success: false,
          error: 'Contact number is already registered with another elder'
        });
      }
    }

    // Check if NIC is already used by another elder (excluding current elder)
    if (nic_passport !== currentElder.nic) {
      const nicCheck = await pool.query(
        'SELECT * FROM elder WHERE nic = $1 AND elder_id != $2',
        [nic_passport, elderId]
      );
      if (nicCheck.rows.length > 0) {
        console.log('NIC already in use by another elder');
        return res.status(400).json({
          success: false,
          error: 'NIC is already registered with another elder'
        });
      }
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
      console.log('Invalid gender value:', gender);
      return res.status(400).json({
        success: false,
        error: 'Invalid gender selection. Must be Male, Female, or Other'
      });
    }

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('Transaction started');

      // Update elder table - REMOVED updated_at reference
      const elderUpdateQuery = `
        UPDATE elder 
        SET name = $1, 
            email = $2,
            dob = $3, 
            gender = $4::gender_type, 
            nic = $5, 
            contact = $6, 
            medical_conditions = $7, 
            address = $8
        WHERE elder_id = $9
        RETURNING elder_id, name as full_name, email, dob as date_of_birth, gender, nic as nic_passport, contact as contact_number, medical_conditions, address, created_at
      `;
      
      console.log('Updating elder table with query:', elderUpdateQuery);
      console.log('Parameters:', [
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

      const elderResult = await client.query(elderUpdateQuery, [
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

      console.log('Elder table updated successfully');

      // Update User table if elder has an account
      if (currentElder.email) {
        console.log('Updating User table for elder with email:', currentElder.email);
        
        let userUpdateQuery = `
          UPDATE "User" 
          SET name = $1, 
              phone = $2
        `;
        let userParams = [full_name, contact_number];
        let paramIndex = 3;

        // Only update email if it's provided and different
        if (email && email !== currentElder.email) {
          userUpdateQuery += `, email = $${paramIndex}`;
          userParams.push(email);
          paramIndex++;
        }

        // Only update password if provided
        if (password && password.trim() !== '') {
          console.log('Password update requested');
          
          // Validate password confirmation
          if (password !== confirm_password) {
            throw new Error('Passwords do not match');
          }

          // Hash the new password
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          
          userUpdateQuery += `, password = $${paramIndex}`;
          userParams.push(hashedPassword);
          paramIndex++;
        }

        userUpdateQuery += ` WHERE email = $${paramIndex} AND role = 'elder' RETURNING user_id, name, email, phone`;
        userParams.push(currentElder.email);

        console.log('User update query:', userUpdateQuery);
        console.log('User update params:', userParams.map((p, i) => i === userParams.length - 2 && password ? '[HASHED_PASSWORD]' : p));

        const userResult = await client.query(userUpdateQuery, userParams);
        console.log('User table updated, affected rows:', userResult.rowCount);
      }

      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      
      res.json({
        success: true,
        message: 'Elder details updated successfully',
        elder: elderResult.rows[0]
      });
      
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', transactionErr);
      throw transactionErr;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Error updating elder:', err);
    console.error('Error stack:', err.stack);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      console.log('Unique constraint violation:', err.constraint);
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
      console.log('Enum constraint violation');
      return res.status(400).json({
        success: false,
        error: 'Invalid gender value. Please select Male, Female, or Other.'
      });
    }
    
    // Handle foreign key constraint violation
    if (err.code === '23503') {
      console.log('Foreign key constraint violation');
      return res.status(400).json({
        success: false,
        error: 'Invalid elder reference'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error updating elder data',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


const createElder = async (req, res) => {
  const {
    family_id,
    name,
    email,
    dob,
    gender,
    contact,
    address,
    nic,
    medical_conditions,
    profile_photo,
    password
  } = req.body;
  
  try {
    // Validate required fields
    if (!family_id || !name || !email || !dob || !gender || !contact || !nic || !password) {
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

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 6 characters long' 
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

    // Check if email already exists in User table
    const existingEmail = await pool.query(
      'SELECT * FROM "User" WHERE email = $1',
      [email]
    );
    
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Email address already registered' 
      });
    }

    // Normalize gender for enum
    let normalizedGender = gender;
    if (gender === 'Male') normalizedGender = 'male';
    if (gender === 'Female') normalizedGender = 'female';
    if (gender === 'Other') normalizedGender = 'other';

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Start transaction to create in both tables
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert into User table first
      const userResult = await client.query(
        'INSERT INTO "User" (name, email, password, phone, role, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING user_id, name, email, phone, role, created_at',
        [name, email, hashedPassword, contact, 'elder']
      );
      
      // Insert into elder table
      const elderResult = await client.query(
        `INSERT INTO elder (
          family_id, name, email, dob, gender, contact, address, nic, medical_conditions, profile_photo, created_at
        ) VALUES ($1, $2, $3, $4, $5::gender_type, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP) 
        RETURNING elder_id, family_id, name, email, dob, gender, contact, address, nic, medical_conditions, profile_photo, created_at`,
        [
          family_id,
          name,
          email,
          dob,
          normalizedGender,
          contact,
          address || null,
          nic,
          medical_conditions || null,
          profile_photo || null
        ]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Elder registered successfully',
        elder: elderResult.rows[0],
        user: userResult.rows[0]
      });
      
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }
    
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
      if (err.constraint && err.constraint.includes('email')) {
        return res.status(400).json({ 
          success: false,
          error: 'Email address already registered' 
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
    // Check if elder exists and get email
    const elderCheck = await pool.query('SELECT email FROM elder WHERE elder_id = $1', [elderId]);
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    const elderEmail = elderCheck.rows[0].email;

    // Start transaction to delete from both tables
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete from elder table
      await client.query('DELETE FROM elder WHERE elder_id = $1', [elderId]);
      
      // Delete from User table if exists
      await client.query('DELETE FROM "User" WHERE email = $1 AND role = $2', [elderEmail, 'elder']);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Elder deleted successfully'
      });
      
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }
    
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
        email,
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
        email,
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

const getDoctorsByElderDistrict = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    console.log('Getting doctors for elder ID:', elderId);
    
    // First, get the elder's district
    const elderResult = await pool.query(
      'SELECT district, name FROM elder WHERE elder_id = $1',
      [elderId]
    );
    
    if (elderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }
    
    const elderDistrict = elderResult.rows[0].district;
    const elderName = elderResult.rows[0].name;
    
    console.log('Elder district:', elderDistrict);
    
    if (!elderDistrict) {
      return res.status(400).json({
        success: false,
        error: 'Elder district not specified'
      });
    }
    
    // Get doctors in the same district with approved status
    const doctorsResult = await pool.query(
      `SELECT 
        d.doctor_id,
        d.user_id,
        d.specialization,
        d.license_number,
        d.alternative_number,
        d.current_institution,
        d.years_experience,
        d.district,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        u.created_at
      FROM doctor d
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE LOWER(d.district) = LOWER($1) 
      AND d.status = 'confirmed'
      AND u.role = 'doctor'
      ORDER BY d.years_experience DESC, u.name ASC`,
      [elderDistrict]
    );
    
    console.log('Found doctors:', doctorsResult.rows.length);
    
    res.json({
      success: true,
      doctors: doctorsResult.rows,
      count: doctorsResult.rows.length,
      elderInfo: {
        elder_id: elderId,
        name: elderName,
        district: elderDistrict
      }
    });
    
  } catch (err) {
    console.error('Error fetching doctors by elder district:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching doctors data' 
    });
  }
};

// NEW FUNCTION: Get all doctors for online meetings
const getAllDoctorsForOnlineMeeting = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    console.log('Getting all doctors for online meeting, elder ID:', elderId);
    
    // First, get the elder's info
    const elderResult = await pool.query(
      'SELECT name FROM elder WHERE elder_id = $1',
      [elderId]
    );
    
    if (elderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }
    
    const elderName = elderResult.rows[0].name;
    
    // Get all approved doctors (no district restriction for online meetings)
    const doctorsResult = await pool.query(
      `SELECT 
        d.doctor_id,
        d.user_id,
        d.specialization,
        d.license_number,
        d.alternative_number,
        d.current_institution,
        d.years_experience,
        d.district,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        u.created_at
      FROM doctor d
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE d.status = 'confirmed'
      AND u.role = 'doctor'
      ORDER BY d.years_experience DESC, u.name ASC`
    );
    
    console.log('Found all doctors for online meeting:', doctorsResult.rows.length);
    
    res.json({
      success: true,
      doctors: doctorsResult.rows,
      count: doctorsResult.rows.length,
      elderInfo: {
        elder_id: elderId,
        name: elderName,
        district: 'All Districts (Online Meeting)'
      },
      meetingType: 'online'
    });
    
  } catch (err) {
    console.error('Error fetching all doctors for online meeting:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching doctors data' 
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
// Get doctor by ID
const getDoctorById = async (req, res) => {
  const { doctorId } = req.params;
  
  try {
    console.log('Getting doctor by ID:', doctorId);
    
    const result = await pool.query(
      `SELECT 
        d.doctor_id,
        d.user_id,
        d.specialization,
        d.license_number,
        d.alternative_number,
        d.current_institution,
        d.years_experience,
        d.district,
        d.status,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        u.created_at
      FROM doctor d
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE d.doctor_id = $1 AND d.status = 'confirmed'`,
      [doctorId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found or not approved'
      });
    }
    
    const doctor = result.rows[0];
    
    res.json({
      success: true,
      doctor: {
        doctor_id: doctor.doctor_id,
        user_id: doctor.user_id,
        name: doctor.doctor_name,
        email: doctor.doctor_email,
        phone: doctor.doctor_phone,
        specialization: doctor.specialization,
        license_number: doctor.license_number,
        alternative_number: doctor.alternative_number,
        institution: doctor.current_institution,
        years_experience: doctor.years_experience,
        district: doctor.district,
        status: doctor.status,
        created_at: doctor.created_at
      }
    });
    
  } catch (err) {
    console.error('Error fetching doctor by ID:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching doctor data'
    });
  }
};

// Get appointment booking info (both doctor and elder info)
const getAppointmentBookingInfo = async (req, res) => {
  const { elderId, doctorId } = req.params;
  
  try {
    console.log('Getting appointment booking info for elder:', elderId, 'doctor:', doctorId);
    
    // Get elder information
    const elderResult = await pool.query(
      `SELECT 
        elder_id,
        name,
        dob,
        gender,
        contact,
        district,
        medical_conditions,
        EXTRACT(YEAR FROM AGE(dob)) as age
      FROM elder 
      WHERE elder_id = $1`,
      [elderId]
    );
    
    if (elderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }
    
    // Get doctor information
    const doctorResult = await pool.query(
      `SELECT 
        d.doctor_id,
        d.user_id,
        d.specialization,
        d.license_number,
        d.alternative_number,
        d.current_institution,
        d.years_experience,
        d.district,
        d.status,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone
      FROM doctor d
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE d.doctor_id = $1 AND d.status = 'confirmed'`,
      [doctorId]
    );
    
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found or not approved'
      });
    }
    
    const elder = elderResult.rows[0];
    const doctor = doctorResult.rows[0];
    
    // Mock fees - you can add these to your doctor table later
    const physicalFee = 2500;
    const onlineFee = 1800;
    
    res.json({
      success: true,
      elder: {
        elder_id: elder.elder_id,
        name: elder.name,
        age: elder.age,
        gender: elder.gender,
        contact: elder.contact,
        district: elder.district,
        medical_conditions: elder.medical_conditions
      },
      doctor: {
        doctor_id: doctor.doctor_id,
        user_id: doctor.user_id,
        name: doctor.doctor_name,
        email: doctor.doctor_email,
        phone: doctor.doctor_phone,
        specialization: doctor.specialization,
        license_number: doctor.license_number,
        alternative_number: doctor.alternative_number,
        institution: doctor.current_institution,
        years_experience: doctor.years_experience,
        district: doctor.district,
        status: doctor.status,
        physical_fee: physicalFee,
        online_fee: onlineFee
      }
    });
    
  } catch (err) {
    console.error('Error fetching appointment booking info:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching appointment booking information'
    });
  }
};

// Add this new function to get upcoming appointments for a family member
const getUpcomingAppointmentsByFamily = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    console.log('Getting upcoming appointments for family member:', familyMemberId);
    
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
    
    // Get upcoming appointments for this family
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
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        d.specialization,
        d.current_institution,
        d.district as doctor_district
      FROM appointment a
      INNER JOIN elder e ON a.elder_id = e.elder_id
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      INNER JOIN "User" u ON d.user_id = u.user_id
      WHERE a.family_id = $1 
      AND a.date_time > CURRENT_TIMESTAMP
      AND a.status IN ( 'confirmed')
      ORDER BY a.date_time ASC
      LIMIT 10`,
      [familyId]
    );
    
    console.log('Found upcoming appointments:', result.rows.length);
    
    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching upcoming appointments' 
    });
  }
};

// Add this function to get appointment count for a family member
const getAppointmentCountByFamily = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    console.log('Getting appointment count for family member:', familyMemberId);
    
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
    
    // Count upcoming appointments
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM appointment 
       WHERE family_id = $1 
       AND date_time > CURRENT_TIMESTAMP
       AND status IN ( 'confirmed')`,
      [familyId]
    );
    
    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
    
  } catch (err) {
    console.error('Error fetching appointment count:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching appointment count' 
    });
  }
};
// Create new appointment
// Simplified appointment creation
const createAppointment = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      patientName,
      contactNumber,
      symptoms,
      notes,
      emergencyContact,
      preferredPlatform
    } = req.body;

    console.log('Creating appointment with data:', {
      elderId,
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      patientName,
      contactNumber
    });

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !appointmentType) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Doctor, date, time, and appointment type are required'
      });
    }

    // Validate appointment type
    if (!['physical', 'online'].includes(appointmentType)) {
      console.log('Validation failed: Invalid appointment type');
      return res.status(400).json({
        success: false,
        error: 'Invalid appointment type. Must be "physical" or "online"'
      });
    }

    // Get elder information to get family_id
    console.log('Fetching elder information for ID:', elderId);
    const elderResult = await pool.query(
      'SELECT family_id, name FROM elder WHERE elder_id = $1',
      [elderId]
    );

    if (elderResult.rows.length === 0) {
      console.log('Elder not found with ID:', elderId);
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    const familyId = elderResult.rows[0].family_id;
    console.log('Found family_id:', familyId);

    // Verify doctor exists and is approved
    console.log('Verifying doctor with ID:', doctorId);
    const doctorResult = await pool.query(
      `SELECT d.doctor_id, u.name as doctor_name 
       FROM doctor d 
       INNER JOIN "User" u ON d.user_id = u.user_id 
       WHERE d.doctor_id = $1 AND d.status = 'confirmed'`,
      [doctorId]
    );

    if (doctorResult.rows.length === 0) {
      console.log('Doctor not found or not approved with ID:', doctorId);
      return res.status(404).json({
        success: false,
        error: 'Doctor not found or not approved'
      });
    }

    console.log('Doctor verified:', doctorResult.rows[0]);

    // Combine date and time into a timestamp
    const dateTimeString = `${appointmentDate} ${appointmentTime}:00`;
    const appointmentDateTime = new Date(dateTimeString);
    
    console.log('Appointment date/time:', {
      dateTimeString,
      appointmentDateTime: appointmentDateTime.toISOString()
    });

    // Check if the appointment time is in the future
    const now = new Date();
    if (appointmentDateTime <= now) {
      console.log('Appointment time validation failed: time is in the past');
      return res.status(400).json({
        success: false,
        error: 'Appointment date and time must be in the future'
      });
    }

    // Check for conflicting appointments (same doctor, same time)
    console.log('Checking for appointment conflicts...');
    const conflictCheck = await pool.query(
      `SELECT appointment_id FROM appointment 
       WHERE doctor_id = $1 
       AND date_time = $2 
       AND status IN ('pending', 'approved')`,
      [doctorId, appointmentDateTime]
    );

    if (conflictCheck.rows.length > 0) {
      console.log('Appointment conflict found:', conflictCheck.rows[0]);
      return res.status(400).json({
        success: false,
        error: 'This time slot is already booked. Please select a different time.'
      });
    }

    console.log('Inserting appointment into database...');

    // Insert appointment into database with NULL notes
    const insertResult = await pool.query(
      `INSERT INTO appointment (
        elder_id, 
        family_id, 
        doctor_id, 
        date_time, 
        status, 
        notes, 
        appointment_type,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING 
        appointment_id,
        elder_id,
        family_id,
        doctor_id,
        date_time,
        status,
        notes,
        appointment_type,
        created_at`,
      [
        parseInt(elderId),
        parseInt(familyId),
        parseInt(doctorId),
        appointmentDateTime,
        'pending',
        null, // Set notes to null instead of the constructed string
        appointmentType
      ]
    );

    const newAppointment = insertResult.rows[0];
    console.log('Appointment created successfully:', newAppointment);

    // Return success response with appointment details
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        appointment_id: newAppointment.appointment_id,
        elder_id: newAppointment.elder_id,
        family_id: newAppointment.family_id,
        doctor_id: newAppointment.doctor_id,
        date_time: newAppointment.date_time,
        status: newAppointment.status,
        appointment_type: newAppointment.appointment_type,
        created_at: newAppointment.created_at,
        elder_name: elderResult.rows[0].name,
        doctor_name: doctorResult.rows[0].doctor_name,
        patient_name: patientName || elderResult.rows[0].name,
        contact_number: contactNumber,
        emergency_contact: emergencyContact,
        symptoms: symptoms,
        notes: null, // Return null for notes
        preferred_platform: preferredPlatform
      }
    });

  } catch (err) {
    console.error('Error creating appointment:', err);
    console.error('Error stack:', err.stack);
    
    // Handle specific database errors
    if (err.code === '23503') {
      console.log('Foreign key constraint violation');
      return res.status(400).json({
        success: false,
        error: 'Invalid elder, family, or doctor reference'
      });
    }
    
    if (err.code === '23505') {
      console.log('Unique constraint violation');
      return res.status(400).json({
        success: false,
        error: 'An appointment already exists for this time slot'
      });
    }

    if (err.code === '22P02') {
      console.log('Invalid data type error');
      return res.status(400).json({
        success: false,
        error: 'Invalid data format provided'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error creating appointment',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};




// Get appointments for an elder
const getElderAppointments = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    console.log('Getting appointments for elder ID:', elderId);
    
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
        u.name as doctor_name,
        d.specialization,
        d.current_institution,
        e.name as elder_name
      FROM appointment a       INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      INNER JOIN "User" u ON d.user_id = u.user_id
      INNER JOIN elder e ON a.elder_id = e.elder_id
      WHERE a.elder_id = $1
      ORDER BY a.date_time DESC`,
      [elderId]
    );
    
    console.log('Found appointments:', result.rows.length);
    
    res.json({
      success: true,
      appointments: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching elder appointments:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching appointments'
    });
  }
};

const getBlockedTimeSlots = async (req, res) => {
  const { doctorId, date } = req.params;
  const { appointmentType: requestedType } = req.query; // Get the requested appointment type
  
  try {
    console.log('Getting blocked time slots for doctor:', doctorId, 'date:', date, 'requested type:', requestedType);
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    // Verify doctor exists
    const doctorCheck = await pool.query(
      'SELECT doctor_id FROM doctor WHERE doctor_id = $1 AND status = $2',
      [doctorId, 'confirmed']
    );
    
    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found or not approved'
      });
    }
    
    // Get all appointments for this doctor on the specified date
    const appointmentsResult = await pool.query(
      `SELECT 
        appointment_id,
        DATE_PART('hour', date_time) as hour,
        DATE_PART('minute', date_time) as minute,
        appointment_type,
        status,
        date_time
      FROM appointment 
      WHERE doctor_id = $1 
      AND DATE(date_time) = $2 
      AND status IN ('confirmed')
      ORDER BY date_time`,
      [doctorId, date]
    );
    
    console.log('Existing appointments:', appointmentsResult.rows);
    
    const blockedSlots = [];
    const appointmentDetails = [];
    
    // Generate all possible time slots for the day
    const allTimeSlots = [];
    for (let hour = 8; hour < 20; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    appointmentsResult.rows.forEach(appointment => {
      const hour = parseInt(appointment.hour);
      const minute = parseInt(appointment.minute);
      const existingType = appointment.appointment_type;
      
      console.log(`Processing existing appointment: ${hour}:${minute}, type: ${existingType}`);
      
      const appointmentStartTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Calculate the end time of the existing appointment
      let endHour = hour;
      let endMinute = minute;
      
      if (existingType === 'online') {
        // Online appointment: 1 hour duration
        endMinute += 60;
        if (endMinute >= 60) {
          endHour += Math.floor(endMinute / 60);
          endMinute = endMinute % 60;
        }
      } else if (existingType === 'physical') {
        // Physical appointment: 2 hours duration
        endMinute += 120;
        if (endMinute >= 60) {
          endHour += Math.floor(endMinute / 60);
          endMinute = endMinute % 60;
        }
      }
      
      const appointmentEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      console.log(`Existing appointment: ${appointmentStartTime} - ${appointmentEndTime} (${existingType})`);
      
      appointmentDetails.push({
        id: appointment.appointment_id,
        startTime: appointmentStartTime,
        endTime: appointmentEndTime,
        type: existingType,
        status: appointment.status
      });
      
      // Now check each possible time slot for conflicts
      allTimeSlots.forEach(timeSlot => {
        const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
        
        // Calculate what the end time would be if someone books this slot
        let newEndHour = slotHour;
        let newEndMinute = slotMinute;
        
        if (requestedType === 'online') {
          // Requested online appointment: 1 hour duration
          newEndMinute += 60;
          if (newEndMinute >= 60) {
            newEndHour += Math.floor(newEndMinute / 60);
            newEndMinute = newEndMinute % 60;
          }
        } else if (requestedType === 'physical') {
          // Requested physical appointment: 2 hours duration
          newEndMinute += 120;
          if (newEndMinute >= 60) {
            newEndHour += Math.floor(newEndMinute / 60);
            newEndMinute = newEndMinute % 60;
          }
        }
        
        const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`;
        
        // Check for time conflicts
        const slotStartMinutes = slotHour * 60 + slotMinute;
        const slotEndMinutes = newEndHour * 60 + newEndMinute;
        const existingStartMinutes = hour * 60 + minute;
        const existingEndMinutes = endHour * 60 + endMinute;
        
        // Check if there's any overlap
        const hasConflict = (
          (slotStartMinutes < existingEndMinutes && slotEndMinutes > existingStartMinutes)
        );
        
        if (hasConflict) {
          console.log(`Blocking ${timeSlot} because it conflicts with existing ${existingType} appointment ${appointmentStartTime}-${appointmentEndTime}`);
          blockedSlots.push(timeSlot);
        }
      });
    });
    
    // Remove duplicates and sort
    const uniqueBlockedSlots = [...new Set(blockedSlots)].sort();
    
    console.log('Final blocked time slots:', uniqueBlockedSlots);
    console.log('Appointment details:', appointmentDetails);
    
    res.json({
      success: true,
      blockedSlots: uniqueBlockedSlots,
      date: date,
      doctorId: parseInt(doctorId),
      requestedType: requestedType,
      appointmentCount: appointmentsResult.rows.length,
      appointmentDetails: appointmentDetails
    });
    
  } catch (err) {
    console.error('Error fetching blocked time slots:', err);
    res.status(500).json({
      success: false,
      error: 'Error fetching blocked time slots'
    });
  }
};


// Add these new functions to the elderController:

// Create temporary booking (blocks slot for 10 minutes)
const createTemporaryBooking = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      patientName,
      contactNumber,
      symptoms,
      notes,
      emergencyContact,
      preferredPlatform
    } = req.body;

    console.log('Creating temporary booking with data:', {
      elderId,
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType
    });

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !appointmentType) {
      return res.status(400).json({
        success: false,
        error: 'Doctor, date, time, and appointment type are required'
      });
    }

    // Get elder information to get family_id
    const elderResult = await pool.query(
      'SELECT family_id, name FROM elder WHERE elder_id = $1',
      [elderId]
    );

    if (elderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Elder not found'
      });
    }

    const familyId = elderResult.rows[0].family_id;

    // Verify doctor exists and is approved
    const doctorResult = await pool.query(
      `SELECT d.doctor_id, u.name as doctor_name 
       FROM doctor d 
       INNER JOIN "User" u ON d.user_id = u.user_id 
       WHERE d.doctor_id = $1 AND d.status = 'confirmed'`,
      [doctorId]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found or not approved'
      });
    }

    // Combine date and time into a timestamp
    const dateTimeString = `${appointmentDate} ${appointmentTime}:00`;
    const appointmentDateTime = new Date(dateTimeString);

    // Check if the appointment time is in the future
    const now = new Date();
    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        error: 'Appointment date and time must be in the future'
      });
          }

    // Check for conflicting appointments (same doctor, same time)
    const conflictCheck = await pool.query(
      `SELECT appointment_id FROM appointment 
       WHERE doctor_id = $1 
       AND date_time = $2 
       AND status IN ('pending', 'confirmed')`,
      [doctorId, appointmentDateTime]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This time slot is already booked. Please select a different time.'
      });
    }

    // Check for existing temporary bookings that haven't expired
    const tempBookingCheck = await pool.query(
      `SELECT temp_booking_id FROM temporary_booking 
       WHERE doctor_id = $1 
       AND date_time = $2 
       AND expires_at > CURRENT_TIMESTAMP`,
      [doctorId, appointmentDateTime]
    );

    if (tempBookingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This time slot is temporarily reserved. Please select a different time.'
      });
    }

    // Create temporary booking (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const tempBookingResult = await pool.query(
      `INSERT INTO temporary_booking (
        elder_id, 
        family_id, 
        doctor_id, 
        date_time, 
        appointment_type,
        patient_name,
        contact_number,
        symptoms,
        notes,
        emergency_contact,
        preferred_platform,
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING 
        temp_booking_id,
        elder_id,
        family_id,
        doctor_id,
        date_time,
        appointment_type,
        expires_at,
        created_at`,
      [
        parseInt(elderId),
        parseInt(familyId),
        parseInt(doctorId),
        appointmentDateTime,
        appointmentType,
        patientName || elderResult.rows[0].name,
        contactNumber,
        symptoms || 'Consultation requested',
        notes,
        emergencyContact,
        preferredPlatform,
        expiresAt
      ]
    );

    const tempBooking = tempBookingResult.rows[0];
    console.log('Temporary booking created:', tempBooking);

    res.status(201).json({
      success: true,
      message: 'Temporary booking created successfully',
      tempBooking: {
        temp_booking_id: tempBooking.temp_booking_id,
        elder_id: tempBooking.elder_id,
        family_id: tempBooking.family_id,
        doctor_id: tempBooking.doctor_id,
        date_time: tempBooking.date_time,
        appointment_type: tempBooking.appointment_type,
        expires_at: tempBooking.expires_at,
        created_at: tempBooking.created_at,
        elder_name: elderResult.rows[0].name,
        doctor_name: doctorResult.rows[0].doctor_name
      }
    });

  } catch (err) {
    console.error('Error creating temporary booking:', err);
    res.status(500).json({
      success: false,
      error: 'Error creating temporary booking',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Confirm payment and create actual appointment
const confirmPaymentAndCreateAppointment = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    const {
      tempBookingId,
      paymentMethod,
      paymentAmount,
      transactionId,
      paymentStatus
    } = req.body;

    console.log('Confirming payment and creating appointment:', {
      elderId,
      tempBookingId,
      paymentMethod,
      paymentAmount,
      transactionId,
      paymentStatus
    });

    // Validate required fields
    if (!tempBookingId || !paymentMethod || !paymentAmount || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'All payment details are required'
      });
    }

    // Get temporary booking details
    const tempBookingResult = await pool.query(
      `SELECT * FROM temporary_booking 
       WHERE temp_booking_id = $1 
       AND elder_id = $2 
       AND expires_at > CURRENT_TIMESTAMP`,
      [tempBookingId, elderId]
    );

    if (tempBookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Temporary booking not found or expired'
      });
    }

    const tempBooking = tempBookingResult.rows[0];

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create the actual appointment
      const appointmentResult = await client.query(
        `INSERT INTO appointment (
          elder_id, 
          family_id, 
          doctor_id, 
          date_time, 
          status, 
          notes, 
          appointment_type,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING 
          appointment_id,
          elder_id,
          family_id,
          doctor_id,
          date_time,
          status,
          notes,
          appointment_type,
          created_at`,
        [
          tempBooking.elder_id,
          tempBooking.family_id,
          tempBooking.doctor_id,
          tempBooking.date_time,
          'confirmed', // Doctor needs to confirm
          tempBooking.notes,
          tempBooking.appointment_type
        ]
      );

      const newAppointment = appointmentResult.rows[0];

      // Create payment record
      const paymentResult = await client.query(
        `INSERT INTO payment (
          appointment_id,
          elder_id,
          amount,
          payment_method,
          transaction_id,
          payment_status,
          payment_date,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING payment_id, amount, payment_method, transaction_id, payment_status, payment_date`,
        [
          newAppointment.appointment_id,
          elderId,
          parseFloat(paymentAmount),
          paymentMethod,
          transactionId,
          paymentStatus || 'completed'
        ]
      );

      const payment = paymentResult.rows[0];

      // Delete the temporary booking
      await client.query(
        'DELETE FROM temporary_booking WHERE temp_booking_id = $1',
        [tempBookingId]
      );

      await client.query('COMMIT');

      console.log('Appointment and payment created successfully:', {
        appointment: newAppointment,
        payment: payment
      });

      res.status(201).json({
        success: true,
        message: 'Payment confirmed and appointment created successfully',
        appointment: newAppointment,
        payment: payment
      });

    } catch (transactionErr) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Error confirming payment and creating appointment:', err);
    res.status(500).json({
      success: false,
      error: 'Error processing payment confirmation',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Cancel temporary booking
const cancelTemporaryBooking = async (req, res) => {
  const { tempBookingId } = req.params;
  
  try {
    console.log('Canceling temporary booking:', tempBookingId);

    const result = await pool.query(
      'DELETE FROM temporary_booking WHERE temp_booking_id = $1 RETURNING temp_booking_id',
      [tempBookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Temporary booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Temporary booking canceled successfully'
    });

  } catch (err) {
    console.error('Error canceling temporary booking:', err);
    res.status(500).json({
      success: false,
      error: 'Error canceling temporary booking'
    });
  }
};

// Clean up expired temporary bookings (can be run as a cron job)
const cleanupExpiredBookings = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM temporary_booking WHERE expires_at < CURRENT_TIMESTAMP RETURNING temp_booking_id'
    );

    console.log(`Cleaned up ${result.rows.length} expired temporary bookings`);

    res.json({
      success: true,
      message: `Cleaned up ${result.rows.length} expired temporary bookings`,
      cleanedCount: result.rows.length
    });

  } catch (err) {
    console.error('Error cleaning up expired bookings:', err);
    res.status(500).json({
      success: false,
      error: 'Error cleaning up expired bookings'
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
        const allowedFields = ['name', 'email', 'dob', 'gender', 'contact', 'address', 'nic', 'medical_conditions'];
        if (!allowedFields.includes(field)) {
          throw new Error(`Field '${field}' is not allowed for bulk update`);
        }
        
        // Build dynamic query for elder table
        const elderQuery = `UPDATE elder SET ${field} = $1 WHERE elder_id = $2 RETURNING elder_id, ${field}`;
        const elderResult = await client.query(elderQuery, [value, elder_id]);
        
        // If updating name, email, or contact, also update User table
        if (['name', 'email', 'contact'].includes(field) && elderResult.rows.length > 0) {
          const elderEmail = await client.query('SELECT email FROM elder WHERE elder_id = $1', [elder_id]);
          if (elderEmail.rows.length > 0) {
            const currentEmail = elderEmail.rows[0].email;
            
            let userField = field;
            if (field === 'contact') userField = 'phone';
            
            const userQuery = `UPDATE "User" SET ${userField} = $1 WHERE email = $2 AND role = 'elder'`;
            await client.query(userQuery, [value, currentEmail]);
          }
        }
        
        if (elderResult.rows.length > 0) {
          results.push(elderResult.rows[0]);
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
  getDoctorsByElderDistrict,
  getAllDoctorsForOnlineMeeting,
  getDoctorById,           // Add this
  getAppointmentBookingInfo,
  bulkUpdateElders,
  createAppointment,        // Add this
  getElderAppointments ,
  getUpcomingAppointmentsByFamily,  // Add this
  getAppointmentCountByFamily,
  getBlockedTimeSlots,
   createTemporaryBooking,
  confirmPaymentAndCreateAppointment,
  cancelTemporaryBooking,
  cleanupExpiredBookings    
};


