-- Fix sender_type constraint to allow caregiver and healthprofessional
ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_sender_type;

ALTER TABLE messages
ADD CONSTRAINT chk_sender_type
CHECK (sender_type IN ('family_member', 'elder', 'doctor', 'caregiver', 'healthprofessional'));