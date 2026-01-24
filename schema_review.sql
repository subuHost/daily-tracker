-- Add status column to transactions
-- Values: 'verified', 'needs_review'
-- Default to 'verified' for existing data, but we can set some to 'needs_review' to test.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'verified';

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);

-- Optional: Set some recent transactions to 'needs_review' for testing
-- UPDATE transactions SET status = 'needs_review' WHERE created_at > NOW() - INTERVAL '7 days';
