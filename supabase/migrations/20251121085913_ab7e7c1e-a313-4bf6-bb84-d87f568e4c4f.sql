-- Fix security warnings: Add search_path to functions

-- Fix calculate_affiliate_tier function
CREATE OR REPLACE FUNCTION calculate_affiliate_tier(
  conversions INT,
  monthly_rev NUMERIC
)
RETURNS TEXT AS $$
BEGIN
  IF conversions >= 100 OR monthly_rev >= 3000 THEN
    RETURN 'super';
  ELSIF conversions >= 26 THEN
    RETURN 'power';
  ELSIF conversions >= 6 THEN
    RETURN 'active';
  ELSIF conversions >= 1 THEN
    RETURN 'light';
  ELSE
    RETURN 'inactive';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- Fix check_milestone_eligibility function  
CREATE OR REPLACE FUNCTION check_milestone_eligibility(
  affiliate_id_param UUID,
  conversions INT
)
RETURNS TABLE(milestone_level INT, reward_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (VALUES
    (20, 200::NUMERIC),
    (50, 500::NUMERIC),
    (100, 1000::NUMERIC),
    (500, 5000::NUMERIC),
    (1000, 10000::NUMERIC)
  ) AS milestones(level, amount)
  WHERE conversions >= milestones.level
  AND NOT EXISTS (
    SELECT 1 FROM affiliate_bonus_rewards
    WHERE affiliate_id = affiliate_id_param
    AND milestone_level = milestones.level
    AND reward_type = 'milestone'
  )
  ORDER BY milestones.level DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;