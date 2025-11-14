-- Create table for ad budget reloads
CREATE TABLE public.ad_budget_reloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  total_amount DECIMAL(10,2) NOT NULL,
  platforms TEXT[] NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ad_budget_reloads ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own ad budget reloads" 
ON public.ad_budget_reloads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ad budget reloads" 
ON public.ad_budget_reloads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad budget reloads" 
ON public.ad_budget_reloads 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ad_budget_reloads_updated_at
BEFORE UPDATE ON public.ad_budget_reloads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_ad_budget_reloads_user_id ON public.ad_budget_reloads(user_id);
CREATE INDEX idx_ad_budget_reloads_created_at ON public.ad_budget_reloads(created_at DESC);