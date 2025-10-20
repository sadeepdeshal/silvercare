const pool = require('./db');

async function checkCarelogData() {
  try {
    // Check if carelog table exists and has data
    const carelogCount = await pool.query('SELECT COUNT(*) FROM carelog');
    console.log('Total carelog records:', carelogCount.rows[0].count);
    
    // Check recent carelog entries
    const recentCarelogs = await pool.query(`
      SELECT 
        cl.log_id,
        cl.elder_id,
        cl.caregiver_id,
        cl.date,
        cl.notes,
        e.name as elder_name,
        u.name as caregiver_name
      FROM carelog cl
      JOIN elder e ON cl.elder_id = e.elder_id
      JOIN caregiver c ON cl.caregiver_id = c.caregiver_id
      JOIN "User" u ON c.user_id = u.user_id
      ORDER BY cl.date DESC
      LIMIT 10
    `);
    
    console.log('\nRecent carelog entries:');
    recentCarelogs.rows.forEach(row => {
      console.log(`- Elder: ${row.elder_name}, Caregiver: ${row.caregiver_name}, Date: ${row.date}`);
    });
    
    // Check if there are any carelogs for today
    const todayCarelogs = await pool.query(`
      SELECT COUNT(*) 
      FROM carelog 
      WHERE DATE(date) = CURRENT_DATE
    `);
    console.log('\nToday\'s carelog entries:', todayCarelogs.rows[0].count);
    
    // Check elders and their family members
    const elderFamilyData = await pool.query(`
      SELECT 
        e.elder_id,
        e.name as elder_name,
        e.family_id,
        fm.user_id as family_user_id,
        u.name as family_member_name
      FROM elder e
      JOIN familymember fm ON e.family_id = fm.family_id
      JOIN "User" u ON fm.user_id = u.user_id
      LIMIT 5
    `);
    
    console.log('\nElder-Family relationships:');
    elderFamilyData.rows.forEach(row => {
      console.log(`- Elder: ${row.elder_name} (ID: ${row.elder_id}), Family Member: ${row.family_member_name} (User ID: ${row.family_user_id})`);
    });
    
  } catch (error) {
    console.error('Error checking carelog data:', error);
  } finally {
    process.exit();
  }
}

checkCarelogData();