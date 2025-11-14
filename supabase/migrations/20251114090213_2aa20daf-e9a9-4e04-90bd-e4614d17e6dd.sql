-- 1. AD SPEND WALLET SYSTEM
CREATE TABLE IF NOT EXISTS public.ad_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_deposited NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.ad_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON public.ad_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
  ON public.ad_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallets"
  ON public.ad_wallets FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. WALLET TRANSACTIONS LOG
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.ad_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'spend', 'refund', 'batch_fund')),
  amount NUMERIC NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions"
  ON public.wallet_transactions FOR ALL
  USING (true);

-- 3. BATCH FUNDING QUEUE
CREATE TABLE IF NOT EXISTS public.batch_funding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google', 'linkedin')),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'batched', 'funded', 'failed')),
  batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.batch_funding_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batch queue"
  ON public.batch_funding_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage batch queue"
  ON public.batch_funding_queue FOR ALL
  USING (true);

-- 4. FRAUD TRACKING
CREATE TABLE IF NOT EXISTS public.fraud_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('velocity', 'card_fingerprint', 'ip_check', 'device_fingerprint')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'blocked')),
  details JSONB,
  action_taken TEXT CHECK (action_taken IN ('allow', 'flag', 'block', 'review')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage fraud checks"
  ON public.fraud_checks FOR ALL
  USING (true);

-- 5. CAMPAIGN TEMPLATES
CREATE TABLE IF NOT EXISTS public.campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ugc', 'carousel', 'lead_gen', 'video', 'static', 'story')),
  ai_prompt TEXT NOT NULL,
  example_output JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON public.campaign_templates FOR SELECT
  USING (is_active = true);

-- 6. PERFORMANCE ALERTS
CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('high_roas', 'low_roas', 'budget_depleted', 'scale_opportunity')),
  threshold_value NUMERIC,
  current_value NUMERIC,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'acted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ
);

ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON public.performance_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.performance_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage alerts"
  ON public.performance_alerts FOR ALL
  USING (true);

-- 7. AGENCY WHITE-LABEL CONFIG
CREATE TABLE IF NOT EXISTS public.agency_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  custom_domain TEXT,
  logo_url TEXT,
  primary_color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.agency_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view own config"
  ON public.agency_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Agencies can manage own config"
  ON public.agency_config FOR ALL
  USING (auth.uid() = user_id);

-- 8. AGENCY CLIENTS
CREATE TABLE IF NOT EXISTS public.agency_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  markup_percentage NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_user_id, client_user_id)
);

ALTER TABLE public.agency_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view own clients"
  ON public.agency_clients FOR SELECT
  USING (auth.uid() = agency_user_id);

CREATE POLICY "Agencies can manage own clients"
  ON public.agency_clients FOR ALL
  USING (auth.uid() = agency_user_id);

-- 9. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ai_resolved', 'escalated', 'closed')),
  ai_response TEXT,
  human_assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 10. AD ACCOUNT MAPPING
CREATE TABLE IF NOT EXISTS public.platform_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google', 'linkedin')),
  platform_ad_account_id TEXT NOT NULL,
  parent_business_manager_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.platform_ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad accounts"
  ON public.platform_ad_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage ad accounts"
  ON public.platform_ad_accounts FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_batch_funding_status ON batch_funding_queue(status, created_at);
CREATE INDEX idx_fraud_checks_user ON fraud_checks(user_id, created_at DESC);
CREATE INDEX idx_alerts_user_unread ON performance_alerts(user_id, status) WHERE status = 'unread';
CREATE INDEX idx_agency_clients_agency ON agency_clients(agency_user_id) WHERE is_active = true;