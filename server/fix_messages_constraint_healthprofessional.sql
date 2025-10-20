-- Update messages table constraint to allow 'healthprofessional' as receiver_type
-- This fixes the constraint violation error when sending messages to health professionals

-- Drop the existing constraint
ALTER TABLE messages DROP CONSTRAINT chk_receiver_type;

-- Add new constraint that includes both 'counselor' and 'healthprofessional'
ALTER TABLE messages 
ADD CONSTRAINT chk_receiver_type 
CHECK (receiver_type IN ('family_member', 'elder', 'doctor', 'caregiver', 'counselor', 'healthprofessional'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'messages'::regclass
  AND conname = 'chk_receiver_type';