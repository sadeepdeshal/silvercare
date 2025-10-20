const pool = require('./db');

async function testCarelogAPI() {
  try {
    console.log('Testing carelog data...');
    
    // Check total carelog records
    const countResult = await pool.query('SELECT COUNT(*) as count FROM carelog');
    console.log('Total carelog records:', countResult.rows[0].count);
    
    // Check recent carelog records
    const recentResult = await pool.query(`
      SELECT 
        cl.log_id,
        cl.elder_id,
        cl.caregiver_id,
        DATE(cl.date) as log_date,
        cl.notes,
        e.name as elder_name
      FROM carelog cl
      JOIN elder e ON cl.elder_id = e.elder_id
      ORDER BY cl.date DESC 
      LIMIT 5
    `);
    console.log('Recent carelog records:');
    console.table(recentResult.rows);
    
    // Test the family member access query
    console.log('\nTesting family member access query...');
    
    // Get a sample family member and elder
    const familyResult = await pool.query(`
      SELECT 
        fm.user_id as family_user_id,
        fm.family_id,
        e.elder_id,
        e.name as elder_name
      FROM familymember fm
      JOIN elder e ON fm.family_id = e.family_id
      LIMIT 1
    `);
    
    if (familyResult.rows.length > 0) {
      const testData = familyResult.rows[0];
      console.log('Test data:', testData);
      
      // Test the access verification query
      const accessResult = await pool.query(`
        SELECT fm.family_id 
        FROM familymember fm
        JOIN elder e ON fm.family_id = e.family_id
        WHERE fm.user_id = $1 AND e.elder_id = $2
      `, [testData.family_user_id, testData.elder_id]);
      
      console.log('Access verification result:', accessResult.rows);
      
      // Test carelog status query for this elder (with null date filter)
      const statusResult = await pool.query(`
        SELECT 
          DATE(cl.date) as log_date,
          COUNT(*) as report_count,
          array_agg(DISTINCT u.name) as caregiver_names
        FROM carelog cl
        JOIN caregiver c ON cl.caregiver_id = c.caregiver_id
        JOIN "User" u ON c.user_id = u.user_id
        WHERE cl.elder_id = $1 
          AND cl.date IS NOT NULL
          AND DATE(cl.date) >= '2025-10-01' 
          AND DATE(cl.date) <= '2025-10-31'
        GROUP BY DATE(cl.date)
        ORDER BY log_date DESC
      `, [testData.elder_id]);
      
      console.log('Carelog status for elder', testData.elder_id, ':', statusResult.rows);
      
      // Also test specifically for elder 30 (which has carelog data)
      console.log('\nTesting specifically for elder 30:');
      const elder30Result = await pool.query(`
        SELECT 
          DATE(cl.date) as log_date,
          COUNT(*) as report_count,
          array_agg(DISTINCT u.name) as caregiver_names
        FROM carelog cl
        JOIN caregiver c ON cl.caregiver_id = c.caregiver_id
        JOIN "User" u ON c.user_id = u.user_id
        WHERE cl.elder_id = 30
          AND cl.date IS NOT NULL
          AND DATE(cl.date) >= '2025-10-01' 
          AND DATE(cl.date) <= '2025-10-31'
        GROUP BY DATE(cl.date)
        ORDER BY log_date DESC
      `);
      
      console.log('Carelog status for elder 30:', elder30Result.rows);
      
      // Check which family member owns elder 30
      const elder30FamilyResult = await pool.query(`
        SELECT fm.user_id, u.name as family_member_name, e.name as elder_name
        FROM familymember fm
        JOIN elder e ON fm.family_id = e.family_id
        JOIN "User" u ON fm.user_id = u.user_id
        WHERE e.elder_id = 30
      `);
      
      console.log('Family member who owns elder 30:', elder30FamilyResult.rows);
    } else {
      console.log('No family member-elder relationships found');
    }
    
  } catch (error) {
    console.error('Error testing carelog API:', error);
  } finally {
    process.exit();
  }
}

testCarelogAPI();