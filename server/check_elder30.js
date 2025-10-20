const pool = require('./db');

async function checkElder30() {
  try {
    const result = await pool.query(`
      SELECT 
        e.elder_id, 
        e.name as elder_name, 
        e.family_id, 
        fm.user_id as family_user_id, 
        u.name as family_member_name 
      FROM elder e 
      JOIN familymember fm ON e.family_id = fm.family_id 
      JOIN "User" u ON fm.user_id = u.user_id 
      WHERE e.elder_id = 30
    `);
    
    console.log('Elder 30 details:');
    console.table(result.rows);
    
    // Also check the carelog dates for this elder
    const carelogResult = await pool.query(`
      SELECT 
        DATE(cl.date) as log_date,
        cl.notes
      FROM carelog cl
      WHERE cl.elder_id = 30
      ORDER BY cl.date DESC
    `);
    
    console.log('Carelog dates for elder 30:');
    console.table(carelogResult.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkElder30();