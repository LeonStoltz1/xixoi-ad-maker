-- Customer Intake Forms table
CREATE TABLE public.customer_intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  industry_category TEXT,
  country TEXT,
  advertising_goals TEXT[], -- Array of selected goals
  monthly_budget TEXT,
  ai_assistance_needs TEXT[], -- Array of selected AI assistance types
  product_description TEXT,
  current_challenges TEXT[], -- Array of challenges
  feature_request TEXT,
  has_bugs BOOLEAN DEFAULT false,
  bug_description TEXT,
  bug_location TEXT,
  bug_expected_behavior TEXT,
  bug_screenshots TEXT[],
  questions_for_us TEXT,
  onboarding_rating INTEGER CHECK (onboarding_rating >= 1 AND onboarding_rating <= 5),
  ai_training_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Customer Questions table (for AI learning)
CREATE TABLE public.customer_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  intake_form_id UUID REFERENCES public.customer_intake_forms(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answered BOOLEAN DEFAULT false,
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  answered_by UUID,
  used_for_ai_training BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Customer Suggestions table
CREATE TABLE public.customer_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  intake_form_id UUID REFERENCES public.customer_intake_forms(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  category TEXT, -- feature, improvement, integration, etc.
  status TEXT DEFAULT 'submitted', -- submitted, reviewed, planned, implemented, rejected
  priority TEXT, -- low, medium, high, critical
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  implemented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Customer Bug Reports table
CREATE TABLE public.customer_bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  intake_form_id UUID REFERENCES public.customer_intake_forms(id) ON DELETE CASCADE,
  bug_location TEXT NOT NULL,
  bug_description TEXT NOT NULL,
  expected_behavior TEXT,
  actual_behavior TEXT,
  steps_to_reproduce TEXT,
  screenshots TEXT[],
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'reported', -- reported, investigating, in_progress, resolved, closed
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Training Signals table
CREATE TABLE public.ai_training_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal_type TEXT NOT NULL, -- question, suggestion, bug, feedback, goal, challenge
  signal_content TEXT NOT NULL,
  context JSONB, -- Additional structured data
  used_for_training BOOLEAN DEFAULT false,
  training_category TEXT, -- ad_copy, targeting, creative, optimization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customer_intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_intake_forms
CREATE POLICY "Users can insert own intake forms"
  ON public.customer_intake_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own intake forms"
  ON public.customer_intake_forms
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all intake forms"
  ON public.customer_intake_forms
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for customer_questions
CREATE POLICY "Users can insert own questions"
  ON public.customer_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own questions"
  ON public.customer_questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all questions"
  ON public.customer_questions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for customer_suggestions
CREATE POLICY "Users can insert own suggestions"
  ON public.customer_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own suggestions"
  ON public.customer_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all suggestions"
  ON public.customer_suggestions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for customer_bug_reports
CREATE POLICY "Users can insert own bug reports"
  ON public.customer_bug_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bug reports"
  ON public.customer_bug_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bug reports"
  ON public.customer_bug_reports
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for ai_training_signals
CREATE POLICY "Service role can manage AI training signals"
  ON public.ai_training_signals
  FOR ALL
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_intake_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for intake forms
CREATE TRIGGER update_customer_intake_forms_updated_at
  BEFORE UPDATE ON public.customer_intake_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_intake_updated_at();

-- Create indexes for performance
CREATE INDEX idx_intake_forms_user_id ON public.customer_intake_forms(user_id);
CREATE INDEX idx_intake_forms_created_at ON public.customer_intake_forms(created_at DESC);
CREATE INDEX idx_questions_user_id ON public.customer_questions(user_id);
CREATE INDEX idx_questions_answered ON public.customer_questions(answered);
CREATE INDEX idx_suggestions_user_id ON public.customer_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON public.customer_suggestions(status);
CREATE INDEX idx_bug_reports_user_id ON public.customer_bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON public.customer_bug_reports(status);
CREATE INDEX idx_ai_signals_user_id ON public.ai_training_signals(user_id);
CREATE INDEX idx_ai_signals_type ON public.ai_training_signals(signal_type);