
-- Add fraud tracking columns to affiliates
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS fraud_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS last_fraud_check TIMESTAMPTZ;

-- Add fraud tracking to affiliate_clicks
ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT false;
ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS fraud_reason TEXT;

-- Add fraud tracking to affiliate_referrals  
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT false;
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS fraud_reason TEXT;
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- Create fraud detection function
CREATE OR REPLACE FUNCTION check_referral_fraud()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_user_id UUID;
  referred_email TEXT;
  affiliate_email TEXT;
  same_ip_count INTEGER;
  same_fingerprint_count INTEGER;
BEGIN
  -- Get affiliate's user_id
  SELECT user_id INTO affiliate_user_id FROM affiliates WHERE id = NEW.affiliate_id;
  
  -- Check 1: Self-referral (affiliate referring themselves)
  IF NEW.referred_user_id = affiliate_user_id THEN
    NEW.is_suspicious := true;
    NEW.fraud_reason := 'self_referral';
    
    UPDATE affiliates 
    SET fraud_score = fraud_score + 50,
        fraud_flags = fraud_flags || '["self_referral"]'::jsonb
    WHERE id = NEW.affiliate_id;
    
    RETURN NEW;
  END IF;
  
  -- Check 2: Same IP used too many times (more than 3 referrals from same IP in 24h)
  IF NEW.ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO same_ip_count
    FROM affiliate_referrals
    WHERE affiliate_id = NEW.affiliate_id
      AND ip_address = NEW.ip_address
      AND referred_at > NOW() - INTERVAL '24 hours';
    
    IF same_ip_count >= 3 THEN
      NEW.is_suspicious := true;
      NEW.fraud_reason := COALESCE(NEW.fraud_reason || ', ', '') || 'duplicate_ip';
      
      UPDATE affiliates 
      SET fraud_score = fraud_score + 20,
          fraud_flags = fraud_flags || '["duplicate_ip"]'::jsonb
      WHERE id = NEW.affiliate_id;
    END IF;
  END IF;
  
  -- Check 3: Same fingerprint too many times
  IF NEW.fingerprint IS NOT NULL THEN
    SELECT COUNT(*) INTO same_fingerprint_count
    FROM affiliate_referrals
    WHERE affiliate_id = NEW.affiliate_id
      AND fingerprint = NEW.fingerprint
      AND referred_at > NOW() - INTERVAL '7 days';
    
    IF same_fingerprint_count >= 2 THEN
      NEW.is_suspicious := true;
      NEW.fraud_reason := COALESCE(NEW.fraud_reason || ', ', '') || 'duplicate_fingerprint';
      
      UPDATE affiliates 
      SET fraud_score = fraud_score + 30,
          fraud_flags = fraud_flags || '["duplicate_fingerprint"]'::jsonb
      WHERE id = NEW.affiliate_id;
    END IF;
  END IF;
  
  -- Auto-block affiliate if fraud score exceeds threshold
  IF (SELECT fraud_score FROM affiliates WHERE id = NEW.affiliate_id) >= 100 THEN
    UPDATE affiliates SET is_blocked = true WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for fraud detection on referrals
DROP TRIGGER IF EXISTS check_referral_fraud_trigger ON affiliate_referrals;
CREATE TRIGGER check_referral_fraud_trigger
  BEFORE INSERT ON affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION check_referral_fraud();

-- Create click fraud detection function
CREATE OR REPLACE FUNCTION check_click_fraud()
RETURNS TRIGGER AS $$
DECLARE
  recent_clicks INTEGER;
BEGIN
  -- Check for click flooding (more than 50 clicks from same IP in 1 hour)
  SELECT COUNT(*) INTO recent_clicks
  FROM affiliate_clicks
  WHERE affiliate_id = NEW.affiliate_id
    AND ip_address = NEW.ip_address
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_clicks >= 50 THEN
    NEW.is_suspicious := true;
    NEW.fraud_reason := 'click_flooding';
    
    UPDATE affiliates 
    SET fraud_score = fraud_score + 10,
        fraud_flags = fraud_flags || '["click_flooding"]'::jsonb
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for click fraud detection
DROP TRIGGER IF EXISTS check_click_fraud_trigger ON affiliate_clicks;
CREATE TRIGGER check_click_fraud_trigger
  BEFORE INSERT ON affiliate_clicks
  FOR EACH ROW
  EXECUTE FUNCTION check_click_fraud();
