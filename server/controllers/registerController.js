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
      familyMemberId, // This will be the user_id from the family member
      role = 'elder' 
    } = req.body;
    
    try {
      console.log('Elder registration data received:', {
        fullName,
        email,
        dateOfBirth,
        gender,
        nicPassport,
        contactNumber,
        address,
        familyMemberId,
        role
      });

      // Validate required fields
      if (!fullName || !email || !dateOfBirth || !gender || !nicPassport || !contactNumber || !address || !password || !confirmPassword) {
        return res.status(400).json({ error: 'All required fields must be filled' });
      }

      // Validate familyMemberId is provided
      if (!familyMemberId) {
        return res.status(400).json({ error: 'Family member ID is required' });
      }

      // Get the family_id from the familymember table using the user_id
      const familyMemberCheck = await pool.query(
        'SELECT fm.family_id, u.name, u.email FROM familymember fm JOIN "User" u ON fm.user_id = u.user_id WHERE fm.user_id = $1',
        [familyMemberId]
      );

      if (familyMemberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid family member ID or family member not found' });
      }

      const familyId = familyMemberCheck.rows[0].family_id;
      console.log('Found family_id:', familyId);

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
        return res.status(400).json({ error: 'Invalid gender selection. Must be Male, Female, or Other' });
      }

      console.log('Normalized gender:', normalizedGender);

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

      // Check if elder already exists with this contact or NIC in the elder table
      const existingElderCheck = await pool.query(
        'SELECT * FROM elder WHERE contact = $1 OR nic = $2 OR email = $3',
        [contactNumber, nicPassport, email]
      );
      
      if (existingElderCheck.rows.length > 0) {
        const existing = existingElderCheck.rows[0];
        if (existing.contact === contactNumber) {
          return res.status(400).json({ error: 'Contact number already registered' });
        }
        if (existing.nic === nicPassport) {
          return res.status(400).json({ error: 'NIC/Passport number already registered' });
        }
        if (existing.email === email) {
          return res.status(400).json({ error: 'Email address already registered in elder records' });
        }
      }

      // Check if email already exists in the User table
      const existingEmailCheck = await pool.query(
        'SELECT * FROM "User" WHERE email = $1',
        [email]
      );
      
      if (existingEmailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email address already registered in the system' });
      }
      
      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Get profile photo path if uploaded
      const profilePhotoPath = req.file ? req.file.path : null;
      
      // Start transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Insert into User table first for elder login
        const userResult = await client.query(
          'INSERT INTO "User" (name, email, password, phone, role, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING user_id, name, email, phone, role, created_at',
          [fullName, email, hashedPassword, contactNumber, role]
        );
        
        const elderUserId = userResult.rows[0].user_id;
        console.log('Created user with ID:', elderUserId);
        
        // Insert into elder table with family relationship - ADDED EMAIL HERE
        const elderResult = await client.query(
          `INSERT INTO elder (
            family_id, name, email, dob, gender, contact, address, nic, medical_conditions, profile_photo, created_at
          ) VALUES ($1, $2, $3, $4, $5::gender_type, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP) 
          RETURNING elder_id, family_id, name, email, dob, gender, contact, address, nic, medical_conditions, profile_photo, created_at`,
          [
            familyId,
            fullName,
            email,              // ADDED EMAIL PARAMETER
            dateOfBirth,
            normalizedGender,   // Use normalized gender
            contactNumber,
            address,
            nicPassport,
            medicalConditions || null,
            profilePhotoPath
          ]
        );
        
        console.log('Created elder with ID:', elderResult.rows[0].elder_id);
        
        await client.query('COMMIT');
        
        // Combine user and elder data for response
        const responseData = {
          user: userResult.rows[0],
          elder: elderResult.rows[0],
          family_member: {
            id: familyMemberId,
            family_id: familyId,
            name: familyMemberCheck.rows[0].name,
            email: familyMemberCheck.rows[0].email
          }
        };
        
        res.status(201).json({
          message: 'Elder registered successfully',
          data: responseData
        });
        
      } catch (transactionErr) {
        await client.query('ROLLBACK');
        console.error('Transaction error:', transactionErr);
        throw transactionErr;
      } finally {
        client.release();
      }
      
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
        if (err.constraint && err.constraint.includes('email')) {
          return res.status(400).json({ error: 'Email address already registered' });
        }
        if (err.constraint && err.constraint.includes('contact')) {
          return res.status(400).json({ error: 'Contact number already registered' });
        }
        if (err.constraint && err.constraint.includes('nic')) {
          return res.status(400).json({ error: 'NIC/Passport number already registered' });
        }
      }
      
      // Handle enum constraint violation
      if (err.code === '22P02' || err.message.includes('invalid input value for enum')) {
        return res.status(400).json({ error: 'Invalid gender value. Please select Male, Female, or Other.' });
      }
      
      // Handle foreign key constraint violation
      if (err.code === '23503') {
        return res.status(400).json({ error: 'Invalid family member reference' });
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
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
      pool.query('SELECT * FROM "User" WHERE email = $1', [email])
    ];
    
    const existingUserResults = await Promise.all(existingUserQueries);
    const userExists = existingUserResults.some(result => result.rows.length > 0);
    
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }

    // Check if license already exists
    const existingLicense = await pool.query(
      'SELECT * FROM counselor WHERE license_number = $1',
      [licenseRegistrationNumber]
    );
    
    if (existingLicense.rows.length > 0) {
      return res.status(400).json({ error: 'License/Registration number already registered' });
    }
    
    // Hash the password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert into User table first
      const userResult = await client.query(
        'INSERT INTO "User" (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, phone, role, created_at',
        [name, email, hashedPassword, phone, role]
      );
      
      const userId = userResult.rows[0].user_id;
      
      // Insert into counselor table
      const counselorResult = await client.query(
        'INSERT INTO counselor (user_id, specialization, license_number, alternative_number, years_of_experience, current_institution, proof, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING counselor_id, user_id, specialization, license_number, alternative_number, years_of_experience, current_institution, proof, status',
        [userId, areaOfSpecification, licenseRegistrationNumber, alternativeNumber || null, parseInt(yearOfExperience), currentInstitutions, professionalCredentials || null, 'pending']
      );
      
      await client.query('COMMIT');
      
      // Combine user and counselor data for response
      const responseData = {
        user_id: userResult.rows[0].user_id,
        counselor_id: counselorResult.rows[0].counselor_id,
        name: userResult.rows[0].name,
        email: userResult.rows[0].email,
        phone: userResult.rows[0].phone,
        role: userResult.rows[0].role,
        specialization: counselorResult.rows[0].specialization,
        license_number: counselorResult.rows[0].license_number,
        alternative_number: counselorResult.rows[0].alternative_number,
        years_of_experience: counselorResult.rows[0].years_of_experience,
        current_institution: counselorResult.rows[0].current_institution,
        proof: counselorResult.rows[0].proof,
        status: counselorResult.rows[0].status,
        created_at: userResult.rows[0].created_at
      };
      
      res.status(201).json({
        message: 'Health professional registered successfully. Your registration is pending approval.',
        user: responseData
      });
      
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Health professional registration error:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'User_email_key' || err.constraint === 'users_email_key') {
        return res.status(400).json({ error: 'Email address already registered' });
      }
      if (err.constraint === 'counselor_license_number_key') {
        return res.status(400).json({ error: 'License/Registration number already registered' });
      }
    }
    
    res.status(500).json({ error: 'Error creating health professional registration. Please try again.' });
  }
};

// CREATE a doctor registration
// CREATE a doctor registration
const createDoctorRegistration = async (req, res) => {
  const { 
    name, 
    email, 
    phone, 
    alternativeNumber, 
    areaOfSpecification,  // Changed from specialization
    medicalLicenseNumber, // Changed from licenseNumber
    yearOfExperience, 
    currentInstitutions,  // Changed from currentInstitution
    medicalCredentials,   // Changed from proof
    password, 
    role = 'doctor' 
  } = req.body;
  
  try {
    // Validate required fields - use the correct field names
    if (!name || !email || !phone || !areaOfSpecification || !medicalLicenseNumber || !yearOfExperience || !currentInstitutions || !password) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
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
      pool.query('SELECT * FROM "User" WHERE email = $1', [email])
    ];
    
    const existingUserResults = await Promise.all(existingUserQueries);
    const userExists = existingUserResults.some(result => result.rows.length > 0);
    
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }

    // Check if medical license already exists
    const existingLicense = await pool.query(
      'SELECT * FROM doctor WHERE license_number = $1',
      [medicalLicenseNumber]
    );
    
    if (existingLicense.rows.length > 0) {
      return res.status(400).json({ error: 'Medical license number already registered' });
    }
    
    // Hash the password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert into User table first
      const userResult = await client.query(
        'INSERT INTO "User" (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, phone, role, created_at',
        [name, email, hashedPassword, phone, role]
      );
      
      const userId = userResult.rows[0].user_id;
      
      // Insert into doctor table - use the correct field mappings
      const doctorResult = await client.query(
        'INSERT INTO doctor (user_id, specialization, license_number, alternative_number, current_institution, proof, years_experience, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING doctor_id, user_id, specialization, license_number, alternative_number, current_institution, proof, years_experience, status',
        [userId, areaOfSpecification, medicalLicenseNumber, alternativeNumber || null, currentInstitutions, medicalCredentials || null, parseInt(yearOfExperience), 'pending']
      );
      
      await client.query('COMMIT');
      
      // Combine user and doctor data for response
      const responseData = {
        user_id: userResult.rows[0].user_id,
        doctor_id: doctorResult.rows[0].doctor_id,
        name: userResult.rows[0].name,
        email: userResult.rows[0].email,
        phone: userResult.rows[0].phone,
        role: userResult.rows[0].role,
        specialization: doctorResult.rows[0].specialization,
        license_number: doctorResult.rows[0].license_number,
        alternative_number: doctorResult.rows[0].alternative_number,
        current_institution: doctorResult.rows[0].current_institution,
        proof: doctorResult.rows[0].proof,
        years_experience: doctorResult.rows[0].years_experience,
        status: doctorResult.rows[0].status,
        created_at: userResult.rows[0].created_at
      };
      
      res.status(201).json({
        message: 'Doctor registered successfully. Your registration is pending approval.',
        user: responseData
      });
      
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Doctor registration error:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'User_email_key' || err.constraint === 'users_email_key') {
        return res.status(400).json({ error: 'Email address already registered' });
      }
      if (err.constraint === 'doctor_license_number_key') {
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
    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    // Validate password strength on server side
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if user already exists with this email in any table
    const existingUserQueries = [
      pool.query('SELECT * FROM "User" WHERE email = $1', [email])
    ];
    
    const existingUserResults = await Promise.all(existingUserQueries);
    const userExists = existingUserResults.some(result => result.rows.length > 0);
    
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }
    
    // Hash the password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert into User table first
      const userResult = await client.query(
        'INSERT INTO "User" (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, phone, role, created_at',
        [name, email, hashedPassword, phone, role]
      );
      
      const userId = userResult.rows[0].user_id;
      
      // Insert into familymember table
      const familyMemberResult = await client.query(
        'INSERT INTO familymember (user_id, phone_fixed) VALUES ($1, $2) RETURNING family_id, user_id, phone_fixed',
        [userId, fixedLine]
      );
      
      await client.query('COMMIT');
      
      // Combine user and family member data for response
      const responseData = {
        user_id: userResult.rows[0].user_id,
        family_id: familyMemberResult.rows[0].family_id,
        name: userResult.rows[0].name,
        email: userResult.rows[0].email,
        phone: userResult.rows[0].phone,
        role: userResult.rows[0].role,
        phone_fixed: familyMemberResult.rows[0].phone_fixed,
        created_at: userResult.rows[0].created_at
      };
      
      res.status(201).json({
        message: 'Family member registered successfully',
        user: responseData
      });
      
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Family member registration error:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'User_email_key' || err.constraint === 'users_email_key') {
        return res.status(400).json({ error: 'Email address already registered' });
      }
    }
    
    res.status(500).json({ error: 'Error creating family member registration. Please try again.' });
  }
};


// CREATE a caregiver registration
// CREATE a caregiver registration
const createCaregiverRegistration = async (req, res) => {
  const { name, email, phone, fixedLine, district, password, role = 'caregiver' } = req.body;
  
  try {
    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    // Validate fixed line if provided
    if (fixedLine) {
      const fixedLineRegex = /^[0-9]{10}$/;
      if (!fixedLineRegex.test(fixedLine)) {
        return res.status(400).json({ error: 'Fixed line must be exactly 10 digits' });
      }
    }

    // Validate password strength on server side
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if user already exists with this email in any table
    const existingUserQueries = [
      pool.query('SELECT * FROM "User" WHERE email = $1', [email])
    ];
    
    const existingUserResults = await Promise.all(existingUserQueries);
    const userExists = existingUserResults.some(result => result.rows.length > 0);
    
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }
    
    // Hash the password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert into User table first
      const userResult = await client.query(
        'INSERT INTO "User" (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, phone, role, created_at',
        [name, email, hashedPassword, phone, role]
      );
      
      const userId = userResult.rows[0].user_id;
      
      // Insert into caregiver table
      const caregiverResult = await client.query(
        'INSERT INTO caregiver (user_id, fixed_line, district) VALUES ($1, $2, $3) RETURNING caregiver_id, user_id, fixed_line, district',
        [userId, fixedLine || null, district || null]
      );
      
      await client.query('COMMIT');
      
      // Combine user and caregiver data for response
      const responseData = {
        user_id: userResult.rows[0].user_id,
        caregiver_id: caregiverResult.rows[0].caregiver_id,
        name: userResult.rows[0].name,
        email: userResult.rows[0].email,
        phone: userResult.rows[0].phone,
        role: userResult.rows[0].role,
        fixed_line: caregiverResult.rows[0].fixed_line,
        district: caregiverResult.rows[0].district,
        created_at: userResult.rows[0].created_at
      };
      
      res.status(201).json({
        message: 'Caregiver registered successfully',
        user: responseData
      });
      
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      throw transactionErr;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Caregiver registration error:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'User_email_key' || err.constraint === 'users_email_key') {
        return res.status(400).json({ error: 'Email address already registered' });
      }
    }
    
    res.status(500).json({ error: 'Error creating caregiver registration. Please try again.' });
  }
};


// GET all registrations
const getRegistrations = async (req, res) => {
  try {
    // Get from all tables including elderreg with family member relationship
    const registerResult = await pool.query('SELECT id, name, email, phone, fixed_line, role, created_at FROM register ORDER BY created_at DESC');
    const registrationResult = await pool.query('SELECT id, name, email, phone, fixed_line, district, role, created_at FROM registration ORDER BY created_at DESC');
    const doctorResult = await pool.query('SELECT id, name, email, phone, alter_phone, specification, license, years_experience, institutions, role, status, created_at FROM DoctorReg ORDER BY created_at DESC');
    const healthResult = await pool.query('SELECT id, name, email, phone, alter_phone, specification, license, years_experience, institutions, role, status, created_at FROM HealthReg ORDER BY created_at DESC');
    
    // Updated elder query to include family member information
    const elderResult = await pool.query(`
      SELECT 
        e.id, 
        e.full_name, 
        e.email, 
        e.date_of_birth, 
        e.gender, 
        e.nic_passport, 
        e.contact_number, 
        e.medical_conditions, 
        e.address, 
        e.profile_photo, 
        e.role, 
        e.family_member_id,
        e.created_at,
        fm.name as family_member_name,
        fm.email as family_member_email
      FROM elderreg e
      LEFT JOIN register fm ON e.family_member_id = fm.id
      ORDER BY e.created_at DESC
    `);
    
    // Combine results
    const allRegistrations = [
      ...registerResult.rows.map(row => ({ ...row, table: 'register' })),
      ...registrationResult.rows.map(row => ({ ...row, table: 'registration' })),
      ...doctorResult.rows.map(row => ({ ...row, table: 'doctor' })),
      ...healthResult.rows.map(row => ({ ...row, table: 'health_professional' })),
      ...elderResult.rows.map(row => ({ 
        ...row, 
        table: 'elder', 
        name: row.full_name,
        family_member: {
          id: row.family_member_id,
          name: row.family_member_name,
          email: row.family_member_email
        }
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json(allRegistrations);
  } catch (err) {
    console.error('Get registrations error:', err);
    res.status(500).json({ error: 'Error fetching registrations' });
  }
};

// GET elders by family member ID (new function)
const getEldersByFamilyMember = async (req, res) => {
  const { familyMemberId } = req.params;
  
  try {
    // Verify family member exists
        // Verify family member exists
    const familyMemberCheck = await pool.query(
      'SELECT id, name, email FROM register WHERE id = $1 AND role = $2',
      [familyMemberId, 'family_member']
    );

    if (familyMemberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    // Get all elders registered by this family member
    const eldersResult = await pool.query(`
      SELECT 
        id, 
        full_name, 
        email, 
        date_of_birth, 
        gender, 
        nic_passport, 
        contact_number, 
        medical_conditions, 
        address, 
        profile_photo, 
        role, 
        family_member_id,
        created_at
      FROM elderreg 
      WHERE family_member_id = $1 
      ORDER BY created_at DESC
    `, [familyMemberId]);
    
    res.json({
      message: 'Elders retrieved successfully',
      familyMember: familyMemberCheck.rows[0],
      elders: eldersResult.rows,
      count: eldersResult.rows.length
    });
    
  } catch (err) {
    console.error('Get elders by family member error:', err);
    res.status(500).json({ error: 'Error fetching elders' });
  }
};

// GET single elder by ID (new function)
const getElderById = async (req, res) => {
  const { elderId } = req.params;
  
  try {
    const elderResult = await pool.query(`
      SELECT 
        e.id, 
        e.full_name, 
        e.email, 
        e.date_of_birth, 
        e.gender, 
        e.nic_passport, 
        e.contact_number, 
        e.medical_conditions, 
        e.address, 
        e.profile_photo, 
        e.role, 
        e.family_member_id,
        e.created_at,
        fm.name as family_member_name,
        fm.email as family_member_email,
        fm.phone as family_member_phone
      FROM elderreg e
      LEFT JOIN register fm ON e.family_member_id = fm.id
      WHERE e.id = $1
    `, [elderId]);
    
    if (elderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Elder not found' });
    }
    
    const elder = elderResult.rows[0];
    
    res.json({
      message: 'Elder retrieved successfully',
      elder: {
        ...elder,
        family_member: {
          id: elder.family_member_id,
          name: elder.family_member_name,
          email: elder.family_member_email,
          phone: elder.family_member_phone
        }
      }
    });
    
  } catch (err) {
    console.error('Get elder by ID error:', err);
    res.status(500).json({ error: 'Error fetching elder' });
  }
};

// UPDATE elder information (new function)
const updateElderById = async (req, res) => {
  const { elderId } = req.params;
  const { 
    fullName, 
    email, 
    dateOfBirth, 
    gender, 
    nicPassport, 
    contactNumber, 
    medicalConditions, 
    address 
  } = req.body;
  
  try {
    // Check if elder exists
    const elderCheck = await pool.query('SELECT * FROM elderreg WHERE id = $1', [elderId]);
    
    if (elderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Elder not found' });
    }
    
    // Update elder information
    const result = await pool.query(`
      UPDATE elderreg 
      SET 
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        date_of_birth = COALESCE($3, date_of_birth),
        gender = COALESCE($4, gender),
        nic_passport = COALESCE($5, nic_passport),
        contact_number = COALESCE($6, contact_number),
        medical_conditions = COALESCE($7, medical_conditions),
        address = COALESCE($8, address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, full_name, email, date_of_birth, gender, nic_passport, 
                contact_number, medical_conditions, address, family_member_id, created_at
    `, [fullName, email, dateOfBirth, gender, nicPassport, contactNumber, medicalConditions, address, elderId]);
    
    res.json({
      message: 'Elder updated successfully',
      elder: result.rows[0]
    });
    
  } catch (err) {
    console.error('Update elder error:', err);
    
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
    
    res.status(500).json({ error: 'Error updating elder information' });
  }
};

module.exports = {
  createFamilyMemberRegistration,
  createCaregiverRegistration,
  createDoctorRegistration,
  createHealthProfessionalRegistration,
  createElderRegistration,
  getRegistrations,
  getEldersByFamilyMember,
  getElderById,
  updateElderById
};


