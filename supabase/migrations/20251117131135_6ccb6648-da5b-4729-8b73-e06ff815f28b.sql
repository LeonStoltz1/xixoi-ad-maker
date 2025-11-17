-- Add RLS policies for platform_credentials table
-- This table stores master platform credentials (system-owned) and should only be accessible by service role and admins

-- Service role has full access for edge functions to retrieve system credentials
CREATE POLICY "Service role can manage platform credentials"
ON public.platform_credentials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can view platform credentials (for admin UI management)
CREATE POLICY "Admins can view platform credentials"
ON public.platform_credentials
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update platform credentials (for token rotation)
CREATE POLICY "Admins can update platform credentials"
ON public.platform_credentials
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Note: No INSERT or DELETE policies for authenticated users
-- System credentials should only be created/deleted via SQL or service role