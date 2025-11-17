-- Add stripe_account_status to affiliates table to track Connect account verification
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS stripe_account_status text DEFAULT 'pending';

-- Add comment for documentation
COMMENT ON COLUMN affiliates.stripe_account_status IS 'Stripe Connect account status: pending, verified, rejected, restricted. Updated via account.updated webhook.';

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_affiliates_stripe_account_status ON affiliates(stripe_account_status);

-- Update existing records with stripe_account_id to 'verified' if onboarding is complete
UPDATE affiliates 
SET stripe_account_status = 'verified' 
WHERE stripe_account_id IS NOT NULL 
  AND stripe_onboarding_complete = true 
  AND stripe_account_status = 'pending';