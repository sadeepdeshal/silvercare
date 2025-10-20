const pool = require('./db');

async function testDayRateUpdate() {
  try {
    console.log('=== TESTING DAY RATE UPDATE ===\n');
    
    const caregiverId = 12;
    const newDayRate = 3000; // Test with a new value
    
    // Check current value
    console.log('1. Current value:');
    let result = await pool.query(
      'SELECT caregiver_id, day_rate, availability FROM caregiver WHERE caregiver_id = $1',
      [caregiverId]
    );
    console.log(result.rows[0]);
    
    // Update the day_rate
    console.log('\n2. Updating day_rate to:', newDayRate);
    await pool.query(
      'UPDATE caregiver SET day_rate = $1 WHERE caregiver_id = $2',
      [newDayRate, caregiverId]
    );
    console.log('Update executed');
    
    // Check new value
    console.log('\n3. New value after update:');
    result = await pool.query(
      'SELECT caregiver_id, day_rate, availability FROM caregiver WHERE caregiver_id = $1',
      [caregiverId]
    );
    console.log(result.rows[0]);
    
    // Reset to original value
    console.log('\n4. Resetting to original value (2500)');
    await pool.query(
      'UPDATE caregiver SET day_rate = $1 WHERE caregiver_id = $2',
      [2500, caregiverId]
    );
    console.log('Reset complete');
    
    // Verify reset
    console.log('\n5. Final verification:');
    result = await pool.query(
      'SELECT caregiver_id, day_rate, availability FROM caregiver WHERE caregiver_id = $1',
      [caregiverId]
    );
    console.log(result.rows[0]);
    
    console.log('\n✅ Day rate update test completed successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDayRateUpdate();
