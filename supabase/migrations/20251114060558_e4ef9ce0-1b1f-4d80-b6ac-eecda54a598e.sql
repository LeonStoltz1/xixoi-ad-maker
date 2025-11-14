-- Add stripe_account_id to affiliates table for Stripe Connect
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;