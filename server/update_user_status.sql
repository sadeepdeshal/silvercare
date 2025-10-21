-- Set default value for status column if it doesn't exist
DO $$
BEGIN
    -- Check if status column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'status'
    ) THEN
        -- Add status column if it doesn't exist
        ALTER TABLE "User" ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    ELSE
        -- If column exists, just set the default value
        ALTER TABLE "User" ALTER COLUMN status SET DEFAULT 'active';
    END IF;

    -- Update any existing NULL values to 'active'
    UPDATE "User" SET status = 'active' WHERE status IS NULL;

    -- Add constraint to ensure status is either 'active' or 'inactive'
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_status_check'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT user_status_check 
        CHECK (status IN ('active', 'inactive'));
    END IF;
END $$;