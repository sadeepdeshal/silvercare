const pool = require('./db');

async function checkDates() {
  try {
    console.log('Checking dates for caregiver_id = 12...\n');
    
    const result = await pool.query(`
      SELECT 
        cr.request_id,
        e.name as elder_name,
        cr.start_date,
        cr.end_date,
        cr.status
      FROM carerequest cr
      JOIN elder e ON cr.elder_id = e.elder_id
      WHERE cr.caregiver_id = 12 
        AND cr.status = 'confirmed'
      ORDER BY cr.end_date DESC
      LIMIT 10
    `);
    
    console.log('Raw database results:');
    console.log('='.repeat(80));
    
    result.rows.forEach(row => {
      console.log(`\nElder: ${row.elder_name}`);
      console.log(`Request ID: ${row.request_id}`);
      console.log(`Status: ${row.status}`);
      console.log(`\nStart Date (raw from DB):`, row.start_date);
      console.log(`Start Date (typeof):`, typeof row.start_date);
      console.log(`Start Date (toISOString):`, row.start_date.toISOString());
      console.log(`Start Date (split T):`, row.start_date.toISOString().split('T')[0]);
      
      console.log(`\nEnd Date (raw from DB):`, row.end_date);
      console.log(`End Date (typeof):`, typeof row.end_date);
      console.log(`End Date (toISOString):`, row.end_date.toISOString());
      console.log(`End Date (split T):`, row.end_date.toISOString().split('T')[0]);
      console.log('-'.repeat(80));
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDates();
