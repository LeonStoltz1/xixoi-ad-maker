-- Create table to track achieved milestones
CREATE TABLE IF NOT EXISTS public.affiliate_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(affiliate_id, milestone_type)
);

-- Enable RLS
ALTER TABLE public.affiliate_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policy for affiliates to view own milestones
CREATE POLICY "Affiliates can view own milestones"
ON public.affiliate_milestones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE affiliates.id = affiliate_milestones.affiliate_id
    AND affiliates.user_id = auth.uid()
  )
);

-- Function to check and send referral milestone emails
CREATE OR REPLACE FUNCTION public.check_referral_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_count INTEGER;
  milestone_type TEXT;
  affiliate_record RECORD;
BEGIN
  -- Get the affiliate record
  SELECT * INTO affiliate_record FROM affiliates WHERE id = NEW.affiliate_id;
  
  -- Count total referrals for this affiliate
  SELECT COUNT(*) INTO referral_count
  FROM affiliate_referrals
  WHERE affiliate_id = NEW.affiliate_id;
  
  -- Determine milestone type based on count
  milestone_type := CASE
    WHEN referral_count = 1 THEN 'first_referral'
    WHEN referral_count = 5 THEN 'referrals_5'
    WHEN referral_count = 10 THEN 'referrals_10'
    WHEN referral_count = 25 THEN 'referrals_25'
    WHEN referral_count = 50 THEN 'referrals_50'
    WHEN referral_count = 100 THEN 'referrals_100'
    ELSE NULL
  END;
  
  -- If this is a milestone and hasn't been achieved before
  IF milestone_type IS NOT NULL THEN
    -- Try to insert milestone record (will fail if already exists due to UNIQUE constraint)
    BEGIN
      INSERT INTO affiliate_milestones (affiliate_id, milestone_type)
      VALUES (NEW.affiliate_id, milestone_type);
      
      -- Send milestone email
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-affiliate-milestone',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'affiliateId', NEW.affiliate_id::text,
          'milestoneType', milestone_type
        )
      );
    EXCEPTION WHEN unique_violation THEN
      -- Milestone already achieved, do nothing
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to check and send earnings milestone emails
CREATE OR REPLACE FUNCTION public.check_earnings_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  milestone_type TEXT;
BEGIN
  -- Check if first payout milestone
  IF NEW.total_paid > 0 AND (OLD.total_paid = 0 OR OLD.total_paid IS NULL) THEN
    milestone_type := 'first_payout';
  -- Check earnings thresholds
  ELSIF NEW.total_earned >= 10000 AND OLD.total_earned < 10000 THEN
    milestone_type := 'earnings_10000';
  ELSIF NEW.total_earned >= 5000 AND OLD.total_earned < 5000 THEN
    milestone_type := 'earnings_5000';
  ELSIF NEW.total_earned >= 1000 AND OLD.total_earned < 1000 THEN
    milestone_type := 'earnings_1000';
  END IF;
  
  -- If this is a milestone
  IF milestone_type IS NOT NULL THEN
    -- Try to insert milestone record
    BEGIN
      INSERT INTO affiliate_milestones (affiliate_id, milestone_type)
      VALUES (NEW.id, milestone_type);
      
      -- Send milestone email
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-affiliate-milestone',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'affiliateId', NEW.id::text,
          'milestoneType', milestone_type
        )
      );
    EXCEPTION WHEN unique_violation THEN
      -- Milestone already achieved, do nothing
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral milestones
DROP TRIGGER IF EXISTS trigger_referral_milestone ON public.affiliate_referrals;
CREATE TRIGGER trigger_referral_milestone
AFTER INSERT ON public.affiliate_referrals
FOR EACH ROW
EXECUTE FUNCTION public.check_referral_milestones();

-- Create trigger for earnings milestones
DROP TRIGGER IF EXISTS trigger_earnings_milestone ON public.affiliates;
CREATE TRIGGER trigger_earnings_milestone
AFTER UPDATE OF total_earned, total_paid ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.check_earnings_milestones();