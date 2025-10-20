const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Starting caregiver payment tables migration...');
    
    const sql = fs.readFileSync('./migrations/create_caregiver_payment_tables.sql', 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Created tables:');
    console.log('   - temporary_caregiver_booking');
    console.log('   - caregiver_payment');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
