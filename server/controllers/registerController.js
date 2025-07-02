const pool = require('../db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'elder-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// CREATE an elder registration
const createElderRegistration = async (req, res) => {
  // Handle file upload first
  upload.single('profilePhoto')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { 
      fullName, 
      email,
      dateOfBirth, 
      gender, 
      nicPassport, 
      contactNumber, 
      medicalConditions, 
      address, 
      password, 
      confirmPassword,
      role = 'elder' 
    } = req.body;
    
    try {
      // Validate required fields
      if (!fullName || !email || !dateOfBirth || !gender || !nicPassport || !contactNumber || !address || !password || !confirmPassword) {
        return res.status(400).json({ error: 'All required fields must be filled' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      // Validate contact number format (10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(contactNumber)) {
        return res.status(400).json({ error: 'Contact number must be exactly 10 digits' });
      }

      // Validate gender
      const validGenders = ['Male', 'Female', 'Other'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender selection' });
      }

      // Validate date of birth (should be in the past and reasonable age)
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate >= today) {
        return res.status(400).json({ error: 'Date of birth must be in the past' });
      }
      
      if (age < 50) {
        return res.status(400).json({ error: 'Elder must be at least 50 years old' });
      }

      // Validate password strength (using simpler validation for elders)
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check if elder already exists with this email
      const existingEmailElder = await pool.query(
        'SELECT * FROM elderreg WHERE email = $1',
        [email]
      );
      
      if (existingEmailElder.rows.length > 0) {
        return res.status(400).json({ error: 'Elder already registered with this email address' });
      }

      // Check if email already exists in other tables
      const existingEmailQueries = [
        pool.query('SELECT * FROM register WHERE email = $1', [email]),
        pool.query('SELECT * FROM registration WHERE email = $1', [email]),
        pool.query('SELECT * FROM DoctorReg WHERE email = $1', [email]),
        pool.query('SELECT * FROM HealthReg WHERE email = $1', [email])
      ];
      
      const existingEmailResults = await Promise.all(existingEmailQueries);
      const emailExists = existingEmailResults.some(result => result.rows.length > 0);
      
      if (emailExists) {
        return res.status(400).json({ error: 'Email address already registered in the system' });
      }

      // Check if elder already exists with this NIC/Passport
      const existingElder = await pool.query(
        'SELECT * FROM elderreg WHERE nic_passport = $1',
        [nicPassport]
      );
      
      if (existingElder.rows.length > 0) {
        return res.status(400).json({ error: 'Elder already registered with this NIC/Passport number' });
      }

      // Check if contact number already exists
      const existingContact = await pool.query(
        'SELECT * FROM elderreg WHERE contact_number = $1',
        [contactNumber]
      );
      
      if (existingContact.rows.length > 0) {
        return res.status(400).json({ error: 'Contact number already registered' });
      }
      
      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const hashedConfirmPassword = await bcrypt.hash(confirmPassword, saltRounds);
      
      // Get profile photo path if uploaded
      const profilePhotoPath = req.file ? req.file.path : null;
      
      // Insert new elder registration
      const result = await pool.query(
        `INSERT INTO elderreg (
          full_name, email, date_of_birth, gender, nic_passport, contact_number, 
          medical_conditions, address, profile_photo, password, confirm_password, role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING id, full_name, email, date_of_birth, gender, nic_passport, contact_number, 
                  medical_conditions, address, profile_photo, role, created_at`,
        [
          fullName, 
          email,
          dateOfBirth, 
          gender, 
          nicPassport, 
          contactNumber, 
          medicalConditions || null, 
          address, 
          profilePhotoPath, 
          hashedPassword, 
          hashedConfirmPassword, 
          role
        ]
      );
      
      res.status(201).json({
        message: 'Elder registered successfully',
        elder: result.rows[0]
      });
      
    } catch (err) {
      console.error('Elder registration error:', err);
      
      // Clean up uploaded file if there was an error
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
      
      // Handle specific database errors
      if (err.code === '23505') { // Unique constraint violation
        if (err.constraint === 'elderreg_email_key') {
          return res.status(400).json({ error: 'Email address already registered' });
        }
        if (err.constraint === 'elderreg_nic_passport_key') {
          return res.status(400).json({ error: 'NIC/Passport number already registered' });
        }
        if (err.constraint === 'elderreg_contact_number_key') {
          return res.status(400).json({ error: 'Contact number already registered' });
        }
      }
      
      res.status(500).json({ error: 'Error creating elder registration. Please try again.' });
    }
  });
};

// CREATE a health professional registration
const createHealthProfessionalRegistration = async (req, res) => {
  const { 
    name, 
    email, 
    phone, 
    alternativeNumber, 
    areaOfSpecification, 
    licenseRegistrationNumber, 
    yearOfExperience, 
    currentInstitutions, 
    professionalCredentials, 
    password, 
    role = 'healthprofessional' 
  } = req.body;
  
  try {
    // Validate required fields
    if (!name || !email || !phone || !areaOfSpecification || !licenseRegistrationNumber || !yearOfExperience || !currentInstitutions || !password) {
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

    // Validate license format
    const licenseRegex = /^PSY-\d{5}-SL$/;
    if (!licenseRegex.test(licenseRegistrationNumber)) {
      return res.status(400).json({ error: 'License/Registration must be in format PSY-12345-SL' });
    }

    // Validate password strength on server side
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if user already exists with this email in any table
    const existingUserQueries = [
      pool.query('SELECT * FROM HealthReg WHERE email = $1', [email]),
      pool.query('SELECT * FROM DoctorReg WHERE email = $1', [email]),
      pool.query('SELECT * FROM register WHERE email = $1', [email]),
      pool.query('SELECT * FROM registration WHERE email = $1', [email]),
      pool.query('SELECT * FROM elderreg WHERE email = $1', [email])
    ];
    
    const existingUserResults = await Promise.all(existingUserQueries);
    const userExists = existingUserResults.some(result => result.rows.length > 0);
    
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }

    // Check if license already exists
    const existingLicense = await pool.query(
      'SELECT * FROM HealthReg WHERE license = $1',
      [licenseRegistrationNumber]
    );
    
    if (existingLicense.rows.length > 0) {
      return res.status(400).json({ error: 'License/Registration number already registered' });
    }
    
    // Hash the password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new health professional registration
    const result = await pool.query(
      `INSERT INTO HealthReg (
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
        licenseRegistrationNumber, 
        parseInt(yearOfExperience), 
        currentInstitutions, 
        professionalCredentials || null, 
        hashedPassword, 
        role, 
        'pending'
      ]
    );
    
    res.status(201).json({
      message: 'Health professional registered successfully. Your registration is pending approval.',
      healthProfessional: result.rows[0]
    });
    
  } catch (err) {
    console.error('Health professional registration error:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'healthreg_email_key') {
        return res.status(400).json({ error: 'Email address already registered' });
      }
      if (err.constraint === 'healthreg_license_key') {
        return res.status(400).json({ error: 'License/Registration number already registered' });
      }
    }
    
    res.status(500).json({ error: 'Error creating health professional registration. Please try again.' });
  }
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
      pool.query('SELECT * FROM HealthReg WHERE email = $1', [email]),
      pool.query('SELECT * FROM register WHERE email = $1', [email]),
      pool.query('SELECT * FROM registration WHERE email = $1', [email]),
      pool.query('SELECT * FROM elderreg WHERE email = $1', [email])
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

    // Check if user already exists with this email in any table
    const existingUserQueries = [
      pool.query('SELECT * FROM register WHERE email = $1', [email]),
      pool.query('SELECT * FROM registration WHERE email = $1', [email]),
      pool.query('SELECT * FROM DoctorReg WHERE email = $1', [email]),
      pool.query('SELECT * FROM HealthReg WHERE email = $1', [email]),
      pool.query('SELECT * FROM elderreg WHERE email = $1', [email])
    ];
    
    const existingUserResults = await Promise.all(existingUserQueries);
    const userExists = existingUserResults.some(result => result.rows.length > 0);
    
    if (userExists) {
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

    // Check if user already exists with this email in any table
    const existingUserQueries = [
      pool.query('SELECT * FROM registration WHERE email = $1', [email]),
      pool.query('SELECT * FROM register WHERE email = $1', [email]),
      pool.query('SELECT * FROM DoctorReg WHERE email = $1', [email]),
      pool.query('SELECT * FROM HealthReg WHERE email = $1', [email]),
      pool.query('SELECT * FROM elderreg WHERE email = $1', [email])
    ];
    
    const existingUserResults = await Promise.all(existingUserQueries);
    const userExists = existingUserResults.some(result => result.rows.length > 0);
    
    if (userExists) {
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
    // Get from all tables including elderreg with email
    const registerResult = await pool.query('SELECT id, name, email, phone, fixed_line, role, created_at FROM register ORDER BY created_at DESC');
    const registrationResult = await pool.query('SELECT id, name, email, phone, fixed_line, district, role, created_at FROM registration ORDER BY created_at DESC');
    const doctorResult = await pool.query('SELECT id, name, email, phone, alter_phone, specification, license, years_experience, institutions, role, status, created_at FROM DoctorReg ORDER BY created_at DESC');
    const healthResult = await pool.query('SELECT id, name, email, phone, alter_phone, specification, license, years_experience, institutions, role, status, created_at FROM HealthReg ORDER BY created_at DESC');
    const elderResult = await pool.query('SELECT id, full_name, email, date_of_birth, gender, nic_passport, contact_number, medical_conditions, address, profile_photo, role, created_at FROM elderreg ORDER BY created_at DESC');
    
    // Combine results
    const allRegistrations = [
      ...registerResult.rows.map(row => ({ ...row, table: 'register' })),
      ...registrationResult.rows.map(row => ({ ...row, table: 'registration' })),
      ...doctorResult.rows.map(row => ({ ...row, table: 'doctor' })),
      ...healthResult.rows.map(row => ({ ...row, table: 'health_professional' })),
      ...elderResult.rows.map(row => ({ ...row, table: 'elder', name: row.full_name }))
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
  createHealthProfessionalRegistration,
  createElderRegistration,
  getRegistrations
};
