-- Create saved_images table for users to save AI-generated images
CREATE TABLE IF NOT EXISTS public.saved_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'ai_generated',
  prompt_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.saved_images ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved images
CREATE POLICY "Users can view their own saved images"
  ON public.saved_images
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved images
CREATE POLICY "Users can save their own images"
  ON public.saved_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved images
CREATE POLICY "Users can delete their own saved images"
  ON public.saved_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own saved images
CREATE POLICY "Users can update their own saved images"
  ON public.saved_images
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_images_user_id ON public.saved_images(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_images_created_at ON public.saved_images(created_at DESC);