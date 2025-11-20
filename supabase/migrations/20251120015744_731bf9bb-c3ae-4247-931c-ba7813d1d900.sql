-- Create admin_overrides table to store temporary admin experience settings
CREATE TABLE IF NOT EXISTS public.admin_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  override_tier TEXT,
  override_realtor_mode BOOLEAN DEFAULT false,
  override_political_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_overrides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage own overrides" ON public.admin_overrides;

-- RLS policy for admins only
CREATE POLICY "Admins can manage own overrides"
ON public.admin_overrides
FOR ALL
USING (public.is_admin(auth.uid()) AND auth.uid() = user_id)
WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = user_id);