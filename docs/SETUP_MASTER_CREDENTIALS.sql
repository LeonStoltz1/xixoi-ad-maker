-- ============================================================
-- xiXoi™ Master Account Setup Script
-- Purpose: Insert system credential placeholders and grant admin access
-- Run this in: Supabase SQL Editor
-- ============================================================

-- STEP 1: Insert system credential placeholders for all 4 platforms
-- These will be updated with real encrypted tokens via the admin UI

INSERT INTO public.platform_credentials (
  platform,
  platform_account_id,
  access_token,
  refresh_token,
  owner_type,
  owner_id,
  status,
  expires_at
) VALUES
  ('meta', 'SYSTEM_META_ACCOUNT', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL),
  ('tiktok', 'SYSTEM_TIKTOK_ACCOUNT', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL),
  ('google', 'SYSTEM_GOOGLE_ACCOUNT', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL),
  ('linkedin', 'SYSTEM_LINKEDIN_ACCOUNT', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL)
ON CONFLICT (platform, owner_type, owner_id) 
DO UPDATE SET 
  status = 'pending',
  updated_at = NOW();

-- Verify insertion
SELECT 
  platform, 
  platform_account_id,
  status,
  owner_type,
  created_at
FROM platform_credentials
WHERE owner_type = 'system'
ORDER BY platform;

-- ============================================================
-- STEP 2: Find your user ID
-- Replace 'your-email@example.com' with your actual email
-- ============================================================

SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Copy the user_id from the result above ^^

-- ============================================================
-- STEP 3: Grant admin role to your user
-- REPLACE 'YOUR_USER_ID_HERE' with the actual UUID from Step 2
-- ============================================================

INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify admin role was granted
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  u.email,
  ur.created_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin';

-- ============================================================
-- STEP 4: Test admin function
-- This should return TRUE for your user
-- ============================================================

SELECT public.is_admin('YOUR_USER_ID_HERE');

-- ============================================================
-- VERIFICATION QUERIES
-- Run these to verify everything is set up correctly
-- ============================================================

-- Check all system credentials
SELECT 
  platform,
  platform_account_id,
  status,
  owner_type,
  LEFT(access_token, 30) as token_preview,
  expires_at,
  created_at,
  updated_at
FROM platform_credentials
WHERE owner_type = 'system'
ORDER BY platform;

-- Check admin users
SELECT 
  ur.user_id,
  u.email,
  ur.role,
  ur.created_at as role_granted_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.created_at DESC;

-- ============================================================
-- NEXT STEPS:
-- 1. Navigate to /xi-admin/platform-credentials
-- 2. Click "Update Token" for each platform
-- 3. Paste your actual master tokens (they will be encrypted)
-- 4. Test campaign creation and publishing
-- ============================================================

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================

-- Remove admin role if needed
-- DELETE FROM user_roles WHERE user_id = 'YOUR_USER_ID_HERE' AND role = 'admin';

-- Delete all system credentials (WARNING: This will break publishing)
-- DELETE FROM platform_credentials WHERE owner_type = 'system';

-- Check encryption key is set (run in Edge Function context, not SQL)
-- SELECT current_setting('app.settings.encryption_key', true);
