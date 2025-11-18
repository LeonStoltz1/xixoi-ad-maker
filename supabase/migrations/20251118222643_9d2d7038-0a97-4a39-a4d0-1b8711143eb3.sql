-- Add Quick-Start weekly spend tracking columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS quickstart_weekly_spend DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quickstart_week_start_date DATE DEFAULT CURRENT_DATE;

-- Create function to enforce Quick-Start $300/week cap with auto-reset
CREATE OR REPLACE FUNCTION public.enforce_quickstart_cap(requested NUMERIC)
RETURNS JSON AS $$
DECLARE
  current_spend DECIMAL(10,2);
  week_start DATE;
  user_plan TEXT;
BEGIN
  -- Get user's current spend and week start date
  SELECT quickstart_weekly_spend, quickstart_week_start_date, plan
  INTO current_spend, week_start, user_plan
  FROM profiles 
  WHERE id = auth.uid();

  -- Only enforce cap for quickstart tier
  IF user_plan != 'quickstart' THEN
    RETURN json_build_object('allowed', true);
  END IF;

  -- Reset if new week (7 days passed)
  IF week_start < CURRENT_DATE - INTERVAL '6 days' THEN
    UPDATE profiles
    SET quickstart_weekly_spend = 0,
        quickstart_week_start_date = CURRENT_DATE
    WHERE id = auth.uid();
    current_spend := 0;
  END IF;

  -- Check if adding requested amount would exceed $300 cap
  IF current_spend + requested > 300 THEN
    RETURN json_build_object(
      'allowed', false,
      'error', 'WEEKLY_CAP_EXCEEDED',
      'message', 'Quick-Start weekly $300 limit reached. Upgrade to Pro for unlimited spend.',
      'current_spend', current_spend,
      'requested', requested,
      'cap', 300
    );
  END IF;

  -- Update spend
  UPDATE profiles
  SET quickstart_weekly_spend = current_spend + requested
  WHERE id = auth.uid();

  RETURN json_build_object('allowed', true, 'new_spend', current_spend + requested);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;