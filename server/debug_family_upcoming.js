// Quick diagnostic: find family member by email and list upcoming appointments visible to dashboard
require('dotenv').config();
const pool = require('./db');

async function main() {
  const email = process.argv[2] || 'kamal@gmail.com';
  console.log('Looking up family member by email:', email);
  try {
    const userRes = await pool.query('SELECT user_id, name, role FROM "User" WHERE LOWER(email)=LOWER($1)', [email]);
    if (userRes.rows.length === 0) {
      console.log('No user found for email');
      process.exit(0);
    }
    const { user_id, name, role } = userRes.rows[0];
    console.log('User:', { user_id, name, role });
    const fmRes = await pool.query('SELECT family_id FROM familymember WHERE user_id = $1', [user_id]);
    if (fmRes.rows.length === 0) {
      console.log('No familymember record for user');
      process.exit(0);
    }
    const familyId = fmRes.rows[0].family_id;
    console.log('family_id:', familyId);

    const apptRes = await pool.query(`
      SELECT a.appointment_id, a.elder_id, e.name as elder_name, a.date_time, a.status, a.appointment_type,
             u.name as doctor_name
      FROM appointment a
      JOIN elder e ON a.elder_id = e.elder_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
      JOIN "User" u ON d.user_id = u.user_id
      WHERE a.family_id = $1 AND a.date_time > CURRENT_TIMESTAMP AND a.status IN ('pending','approved','confirmed')
      ORDER BY a.date_time ASC
      LIMIT 20
    `, [familyId]);
    console.log(`Found ${apptRes.rows.length} upcoming appointments:`);
    for (const row of apptRes.rows) {
      console.log(`- #${row.appointment_id} ${row.elder_name} with ${row.doctor_name} at ${row.date_time.toISOString()} [${row.status}]`);
    }
  } catch (e) {
    console.error('Diagnostic failed:', e);
  } finally {
    process.exit(0);
  }
}

main();
