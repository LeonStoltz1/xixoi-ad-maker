-- =============================================
-- SECURITY HOTFIX: Tighten affiliates RLS
-- =============================================

-- Drop overly permissive policies if they exist
DROP POLICY IF EXISTS "Allow all" ON affiliates;
DROP POLICY IF EXISTS "Public read" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can view own record" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update own record" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can insert own record" ON affiliates;
DROP POLICY IF EXISTS "Admins can view all affiliates" ON affiliates;
DROP POLICY IF EXISTS "Admins can update all affiliates" ON affiliates;

-- Affiliates can view their own record only
CREATE POLICY "Affiliates can view own record"
ON affiliates
FOR SELECT
USING (user_id = auth.uid());

-- Affiliates can insert their own record
CREATE POLICY "Affiliates can insert own record"
ON affiliates
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Affiliates can update their own record
CREATE POLICY "Affiliates can update own record"
ON affiliates
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all affiliates
CREATE POLICY "Admins can view all affiliates"
ON affiliates
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update all affiliates
CREATE POLICY "Admins can update all affiliates"
ON affiliates
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));