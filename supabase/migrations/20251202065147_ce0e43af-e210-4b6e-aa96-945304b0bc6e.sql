-- Add 'quickstart' to allowed plan values in profiles table
-- This enables Quick-Start tier ($49/mo) to be stored in user profiles

-- Drop existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Add new check constraint with 'quickstart' included
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check 
  CHECK (plan = ANY (ARRAY['free'::text, 'quickstart'::text, 'pro'::text, 'elite'::text, 'agency'::text]));