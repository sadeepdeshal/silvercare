const db = require('./db');

async function fixSenderTypeConstraint() {
  try {
    console.log('Fixing sender_type constraint...');
    
    // Drop existing constraint
    await db.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_sender_type');
    console.log('✅ Dropped existing chk_sender_type constraint');
    
    // Add new constraint with caregiver and healthprofessional
    await db.query(`
      ALTER TABLE messages
      ADD CONSTRAINT chk_sender_type
      CHECK (sender_type IN ('family_member', 'elder', 'doctor', 'caregiver', 'healthprofessional'))
    `);
    console.log('✅ Added new chk_sender_type constraint with caregiver and healthprofessional');
    
    console.log('🎉 Sender type constraint fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing sender type constraint:', error);
  } finally {
    process.exit();
  }
}

fixSenderTypeConstraint();