const pool = require('./db');

async function checkDayRateColumn() {
  try {
    console.log('=== CHECKING DAY_RATE COLUMN ===\n');
    
    // Check if column exists
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'caregiver' AND column_name = 'day_rate'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ ERROR: day_rate column does NOT exist in caregiver table!');
      console.log('You need to add it with:');
      console.log('ALTER TABLE caregiver ADD COLUMN day_rate NUMERIC(10,2);');
    } else {
      console.log('✅ day_rate column exists:');
      console.log(columnCheck.rows[0]);
    }
    
    console.log('\n=== CHECKING CAREGIVER DATA ===\n');
    
    // Check some caregiver records
    const dataCheck = await pool.query(`
      SELECT caregiver_id, user_id, day_rate, availability, district
      FROM caregiver
      ORDER BY caregiver_id
      LIMIT 10
    `);
    
    console.log('Sample caregiver records:');
    console.table(dataCheck.rows);
    
    console.log('\n=== CHECKING SPECIFIC CAREGIVER (if you have one) ===');
    console.log('If you know your caregiver_id, check it specifically in the database');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDayRateColumn();
