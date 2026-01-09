-- Fix affiliate_banners table security: remove public access and restrict to owners only

-- Drop the existing public policy
DROP POLICY IF EXISTS "Anyone can view banners" ON public.affiliate_banners;

-- Create a new policy that only allows users to view their own banners
CREATE POLICY "Users can view their own banners"
ON public.affiliate_banners
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure insert/update/delete policies also exist for owners only
DROP POLICY IF EXISTS "Users can insert their own banners" ON public.affiliate_banners;
CREATE POLICY "Users can insert their own banners"
ON public.affiliate_banners
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own banners" ON public.affiliate_banners;
CREATE POLICY "Users can update their own banners"
ON public.affiliate_banners
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own banners" ON public.affiliate_banners;
CREATE POLICY "Users can delete their own banners"
ON public.affiliate_banners
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);