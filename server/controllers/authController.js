const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check in both tables for the user
    let user = null;
    let userTable = null;
    
    // First check in registration table (caregivers)
    const registrationResult = await pool.query(
      'SELECT id, name, email, password, role FROM registration WHERE email = $1',
      [email]
    );
    
    if (registrationResult.rows.length > 0) {
      user = registrationResult.rows[0];
      userTable = 'registration';
    } else {
      // Check in register table (family members)
      const registerResult = await pool.query(
        'SELECT id, name, email, password, role FROM register WHERE email = $1',
        [email]
      );
      
      if (registerResult.rows.length > 0) {
        user = registerResult.rows[0];
        userTable = 'register';
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
        userId: user.id, 
        email: user.email, 
        role: user.role,
        table: userTable
      },
      process.env.JWT_SECRET || 'silvercare-secret-key-2024',
      { expiresIn: '24h' }
    );
    
    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
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
