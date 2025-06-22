// Optional model layer if you want to abstract DB queries
const pool = require('../db');

const getAllUsers = async () => {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
};

module.exports = { getAllUsers };