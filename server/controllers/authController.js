const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // First, check in the User table
    const userResult = await pool.query(
      'SELECT user_id, name, email, password, phone, role FROM "User" WHERE email = $1',
      [email]
    );
    
    let user = null;
    let roleSpecificData = null;
    
    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
      
      // Get role-specific data based on user role
      switch (user.role) {
        case 'family_member':
          const familyResult = await pool.query(
            'SELECT family_id, phone_fixed FROM familymember WHERE user_id = $1',
            [user.user_id]
          );
          if (familyResult.rows.length > 0) {
            roleSpecificData = familyResult.rows[0];
          }
          break;
          
        case 'caregiver':
          const caregiverResult = await pool.query(
            'SELECT caregiver_id, fixed_line, district FROM caregiver WHERE user_id = $1',
            [user.user_id]
          );
          if (caregiverResult.rows.length > 0) {
            roleSpecificData = caregiverResult.rows[0];
          }
          break;
          
        case 'doctor':
          const doctorResult = await pool.query(
            'SELECT doctor_id, specialization, license_number, alternative_number, current_institution, proof, years_experience, status FROM doctor WHERE user_id = $1',
            [user.user_id]
          );
          if (doctorResult.rows.length > 0) {
            roleSpecificData = doctorResult.rows[0];
            // Check if doctor status is confirmed
            if (roleSpecificData.status !== 'confirmed') {
              return res.status(403).json({ 
                error: 'Your account is pending approval. Please wait for admin confirmation before logging in.' 
              });
            }
          }
          break;
          
        case 'healthprofessional':
          const counselorResult = await pool.query(
            'SELECT counselor_id, specialization, license_number, alternative_number, years_of_experience, current_institution, proof, status FROM counselor WHERE user_id = $1',
            [user.user_id]
          );
          if (counselorResult.rows.length > 0) {
            roleSpecificData = counselorResult.rows[0];
            // Check if health professional status is confirmed
            if (roleSpecificData.status !== 'confirmed') {
              return res.status(403).json({ 
                error: 'Your account is pending approval. Please wait for admin confirmation before logging in.' 
              });
            }
          }
          break;
      }
    } else {
      // Check in legacy tables for backward compatibility
      // Check in elderreg table (elders)
      const elderResult = await pool.query(
        'SELECT id, full_name as name, email, password, role FROM elderreg WHERE email = $1',
        [email]
      );
      
      if (elderResult.rows.length > 0) {
        user = elderResult.rows[0];
        user.user_id = user.id; // Map id to user_id for consistency
      } else {
        // Check in register table (legacy family members/admin)
        const registerResult = await pool.query(
          'SELECT id, name, email, password, role FROM register WHERE email = $1',
          [email]
        );
        
        if (registerResult.rows.length > 0) {
          user = registerResult.rows[0];
          user.user_id = user.id; // Map id to user_id for consistency
        } else {
          // Check in registration table (legacy caregivers)
          const registrationResult = await pool.query(
            'SELECT id, name, email, password, role FROM registration WHERE email = $1',
            [email]
          );
          
          if (registrationResult.rows.length > 0) {
            user = registrationResult.rows[0];
            user.user_id = user.id; // Map id to user_id for consistency
          }
        }
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role
      },
      process.env.JWT_SECRET || 'silvercare-secret-key-2024',
      { expiresIn: '24h' }
    );
    
    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;
    
    // Combine user data with role-specific data
    const responseUser = {
      ...userWithoutPassword,
      ...roleSpecificData
    };
    
    res.json({
      message: 'Login successful',
      user: responseUser,
      token,
      role: user.role
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error during login' });
  }
};

module.exports = {
  loginUser
};
