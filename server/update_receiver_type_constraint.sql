-- SQL queries to update the receiver_type constraint to include caregiver and healthprofessional

-- First, drop the existing constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_receiver_type;

-- Then, add the new constraint with additional allowed values
ALTER TABLE messages ADD CONSTRAINT chk_receiver_type 
CHECK (receiver_type::text = ANY (ARRAY[
    'family_member'::character varying, 
    'elder'::character varying, 
    'doctor'::character varying,
    'caregiver'::character varying,
    'healthprofessional'::character varying
]::text[]));

-- Verify the constraint was added successfully
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conname = 'chk_receiver_type';