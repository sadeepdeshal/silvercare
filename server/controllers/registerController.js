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

// CREATE a doctor registration
const createDoctorRegistration = async (req, res) => {
  const { 
    name, 
    email, 
    phone, 
    alternativeNumber, 
    areaOfSpecification, 
    medicalLicenseNumber, 
    yearOfExperience, 
    currentInstitutions, 
    medicalCredentials, 
    password, 
    role = 'doctor' 
  } = req.body;
  
  try {
    // Validate required fields
    if (!name || !email || !phone || !areaOfSpecification || !medicalLicenseNumber || !yearOfExperience || !currentInstitutions || !password) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Validate email format (Gmail only)
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid Gmail address' });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    // Validate alternative number if provided
    if (alternativeNumber && !phoneRegex.test(alternativeNumber)) {
      return res.status(400).json({ error: 'Alternative number must be exactly 10 digits' });
    }

    // Validate medical license format
    const licenseRegex = /^SLMC\/\d{5}$/;
    if (!licenseRegex.test(medicalLicenseNumber)) {
      return res.status(400).json({ error: 'Medical license must be in format SLMC/12345' });
    }

    // Validate password strength on server side
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if user already exists with this email in any table
    const existingUserQueries = [
      pool.query('SELECT * FROM DoctorReg WHERE email = $1', [email]),
      pool.query('SELECT * FROM register WHERE email = $1', [email]),
      pool.query('SELECT * FROM registration WHERE email = $1', [email])
    ];
    
    const existingUserResults = await Promise.all(existingUserQueries);
    const userExists = existingUserResults.some(result => result.rows.length > 0);
    
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }

    // Check if medical license already exists
    const existingLicense = await pool.query(
      'SELECT * FROM DoctorReg WHERE license = $1',
      [medicalLicenseNumber]
    );
    
    if (existingLicense.rows.length > 0) {
      return res.status(400).json({ error: 'Medical license number already registered' });
    }
    
    // Hash the password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new doctor registration
    const result = await pool.query(
      `INSERT INTO DoctorReg (
        name, email, phone, alter_phone, specification, license, 
        years_experience, institutions, medical_credentials, password, role, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING id, name, email, phone, alter_phone, specification, license, 
                years_experience, institutions, medical_credentials, role, status, created_at`,
      [
        name, 
        email, 
        phone, 
        alternativeNumber || null, 
        areaOfSpecification, 
        medicalLicenseNumber, 
        parseInt(yearOfExperience), 
        currentInstitutions, 
        medicalCredentials || null, 
        hashedPassword, 
        role, 
        'pending'
      ]
    );
    
    res.status(201).json({
      message: 'Doctor registered successfully. Your registration is pending approval.',
      doctor: result.rows[0]
    });
    
  } catch (err) {
    console.error('Doctor registration error:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'doctorreg_email_key') {
        return res.status(400).json({ error: 'Email address already registered' });
      }
      if (err.constraint === 'doctorreg_license_key') {
        return res.status(400).json({ error: 'Medical license number already registered' });
      }
    }
    
    res.status(500).json({ error: 'Error creating doctor registration. Please try again.' });
  }
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

    // Check if user already exists with this email in register table
    const existingUser = await pool.query(
      'SELECT * FROM register WHERE email = $1',
      [email]
    );
    
    // Check if user already exists with this email in registration table
    const existingUserInRegistration = await pool.query(
      'SELECT * FROM registration WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0 || existingUserInRegistration.rows.length > 0) {
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
    console.error('Family member registration error:', err);
    res.status(500).json({ error: 'Error creating family member registration' });
  }
};

// CREATE a caregiver registration
const createCaregiverRegistration = async (req, res) => {
  const { name, email, phone, fixedLine, district, password, role = 'caregiver' } = req.body;
  
  try {
    // Validate password strength on server side
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if user already exists with this email in registration table
    const existingUser = await pool.query(
      'SELECT * FROM registration WHERE email = $1',
      [email]
    );
    
    // Check if user already exists with this email in register table
    const existingUserInRegister = await pool.query(
      'SELECT * FROM register WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0 || existingUserInRegister.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }
    
    // Hash the password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new registration into registration table with district
    const result = await pool.query(
      'INSERT INTO registration (name, email, phone, fixed_line, district, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, phone, fixed_line, district, role, created_at',
      [name, email, phone, fixedLine, district, hashedPassword, role]
    );
    
    res.status(201).json({
      message: 'Caregiver registered successfully',
      user: result.rows[0]
    });
    
  } catch (err) {
    console.error('Caregiver registration error:', err);
    res.status(500).json({ error: 'Error creating caregiver registration' });
  }
};

// GET all registrations
const getRegistrations = async (req, res) => {
  try {
    // Get from all tables
    const registerResult = await pool.query('SELECT id, name, email, phone, fixed_line, role, created_at FROM register ORDER BY created_at DESC');
    const registrationResult = await pool.query('SELECT id, name, email, phone, fixed_line, district, role, created_at FROM registration ORDER BY created_at DESC');
    const doctorResult = await pool.query('SELECT id, name, email, phone, alter_phone, specification, license, years_experience, institutions, role, status, created_at FROM DoctorReg ORDER BY created_at DESC');
    
    // Combine results
    const allRegistrations = [
      ...registerResult.rows.map(row => ({ ...row, table: 'register' })),
      ...registrationResult.rows.map(row => ({ ...row, table: 'registration' })),
      ...doctorResult.rows.map(row => ({ ...row, table: 'doctor' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json(allRegistrations);
  } catch (err) {
    console.error('Get registrations error:', err);
    res.status(500).json({ error: 'Error fetching registrations' });
  }
};

module.exports = {
  createFamilyMemberRegistration,
  createCaregiverRegistration,
  createDoctorRegistration,
  getRegistrations
};
