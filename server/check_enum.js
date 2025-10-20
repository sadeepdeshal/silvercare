const pool = require('./db');

async function checkEnumValues() {
  try {
    // Check enum values for status
    const result = await pool.query(`
      SELECT unnest(enum_range(NULL::status_type)) AS status_values;
    `);
    
    console.log('Valid status enum values:');
    result.rows.forEach(row => {
      console.log('- "' + row.status_values + '"');
    });

    // Also check some actual appointment statuses in the database
    const appointments = await pool.query(`
      SELECT DISTINCT status FROM appointment LIMIT 10;
    `);
    
    console.log('\nActual status values in appointment table:');
    appointments.rows.forEach(row => {
      console.log('- "' + row.status + '"');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkEnumValues();