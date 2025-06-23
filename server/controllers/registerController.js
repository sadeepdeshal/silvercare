const pool = require('../db');
const bcrypt = require('bcrypt');

// Password strength validation function
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
    };
  }

  return { isValid: true, message: 'Password is strong' };
};

// CREATE a family member registration
const createFamilyMemberRegistration = async (req, res) => {
  const { name, email, phone, fixedLine, password, role = 'family_member' } = req.body;
  
  try {
    // Validate password strength on server side
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if user already exists with this email
    const existingUser = await pool.query(
      'SELECT * FROM register WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }
    
    // Hash the password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new registration
    const result = await pool.query(
      'INSERT INTO register (name, email, phone, fixed_line, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, fixed_line, role, created_at',
      [name, email, phone, fixedLine, hashedPassword, role]
    );
    
    res.status(201).json({
      message: 'Family member registered successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle unique constraint violation
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email address is already registered' });
    }
    
    res.status(500).json({ error: 'Error creating registration' });
  }
};

// GET all registrations
const getRegistrations = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, fixed_line, role, created_at FROM register ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ error: 'Error fetching registrations' });
  }
};

module.exports = { 
  createFamilyMemberRegistration,
  getRegistrations
};
