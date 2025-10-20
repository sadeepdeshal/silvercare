-- Update messages table constraint to allow 'counselor' as receiver_type
-- This fixes the constraint violation error when sending messages to counselors

-- Drop the existing constraint
ALTER TABLE messages DROP CONSTRAINT chk_receiver_type;

-- Add new constraint that includes 'counselor'
ALTER TABLE messages 
ADD CONSTRAINT chk_receiver_type 
CHECK (receiver_type IN ('family_member', 'elder', 'doctor', 'caregiver', 'counselor'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'messages'::regclass
  AND conname = 'chk_receiver_type';
