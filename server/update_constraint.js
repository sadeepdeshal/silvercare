const db = require('./db');

async function updateReceiverTypeConstraint() {
  try {
    console.log('Dropping existing constraint...');
    await db.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_receiver_type;');
    
    console.log('Adding new constraint with caregiver and healthprofessional...');
    await db.query(`
      ALTER TABLE messages ADD CONSTRAINT chk_receiver_type 
      CHECK (receiver_type::text = ANY (ARRAY[
        'family_member'::character varying, 
        'elder'::character varying, 
        'doctor'::character varying,
        'caregiver'::character varying,
        'healthprofessional'::character varying
      ]::text[]));
    `);
    
    console.log('Verifying constraint...');
    const result = await db.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conname = 'chk_receiver_type';
    `);
    
    console.log('Constraint updated successfully:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('Error updating constraint:', error);
  } finally {
    process.exit();
  }
}

updateReceiverTypeConstraint();