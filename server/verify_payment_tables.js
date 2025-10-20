const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyTables() {
  try {
    console.log('🔍 Checking payment tables...\n');
    
    // Check tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('temporary_caregiver_booking', 'caregiver_payment')
      ORDER BY table_name;
    `;
    
    const tables = await pool.query(tablesQuery);
    
    if (tables.rows.length === 0) {
      console.log('❌ Payment tables NOT FOUND');
      return;
    }
    
    console.log('✅ Payment Tables Found:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check temporary_caregiver_booking columns
    console.log('\n📋 temporary_caregiver_booking columns:');
    const tempColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'temporary_caregiver_booking'
      ORDER BY ordinal_position;
    `);
    tempColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check caregiver_payment columns
    console.log('\n💰 caregiver_payment columns:');
    const paymentColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'caregiver_payment'
      ORDER BY ordinal_position;
    `);
    paymentColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check indexes
    console.log('\n🔑 Indexes:');
    const indexes = await pool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('temporary_caregiver_booking', 'caregiver_payment')
      AND schemaname = 'public';
    `);
    indexes.rows.forEach(idx => {
      console.log(`   - ${idx.indexname} on ${idx.tablename}`);
    });
    
    console.log('\n✅ All payment tables verified successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyTables();
