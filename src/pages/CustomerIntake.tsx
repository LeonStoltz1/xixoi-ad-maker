import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";

export default function CustomerIntake() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industryCategory, setIndustryCategory] = useState("");
  const [country, setCountry] = useState("");
  
  const [advertisingGoals, setAdvertisingGoals] = useState<string[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [aiAssistanceNeeds, setAiAssistanceNeeds] = useState<string[]>([]);
  const [productDescription, setProductDescription] = useState("");
  const [currentChallenges, setCurrentChallenges] = useState<string[]>([]);
  const [featureRequest, setFeatureRequest] = useState("");
  
  const [hasBugs, setHasBugs] = useState(false);
  const [bugDescription, setBugDescription] = useState("");
  const [bugLocation, setBugLocation] = useState("");
  const [bugExpectedBehavior, setBugExpectedBehavior] = useState("");
  
  const [questionsForUs, setQuestionsForUs] = useState("");
  const [onboardingRating, setOnboardingRating] = useState(5);
  const [aiTrainingPermission, setAiTrainingPermission] = useState(false);

  const advertisingGoalsOptions = [
    "Get more leads",
    "Grow my brand",
    "Get more online sales",
    "Promote events",
    "Test new creatives",
    "Lower my ad cost",
    "Not sure yet — I need AI guidance"
  ];

  const budgetOptions = [
    "$0–$300",
    "$300–$1,000",
    "$1,000–$5,000",
    "$5,000+",
    "I don't know — please recommend a budget"
  ];

  const aiAssistanceOptions = [
    "Create ad copy",
    "Create hook ideas",
    "Generate ad scripts",
    "Ad targeting suggestions",
    "Audience research",
    "Improve my existing ads",
    "Fully automated ads (just run everything for me)"
  ];

  const challengesOptions = [
    "Too complicated",
    "Too expensive",
    "My ads don't convert",
    "I don't know who to target",
    "I don't know what to say in ads",
    "Other"
  ];

  const toggleArrayItem = (array: string[], item: string, setter: (val: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit the intake form.",
          variant: "destructive"
        });
        return;
      }

      // Insert main intake form
      const { data: intakeForm, error: intakeError } = await supabase
        .from('customer_intake_forms')
        .insert({
          user_id: user.id,
          full_name: fullName,
          email: email,
          business_name: businessName || null,
          industry_category: industryCategory || null,
          country: country || null,
          advertising_goals: advertisingGoals,
          monthly_budget: monthlyBudget || null,
          ai_assistance_needs: aiAssistanceNeeds,
          product_description: productDescription || null,
          current_challenges: currentChallenges,
          feature_request: featureRequest || null,
          has_bugs: hasBugs,
          bug_description: hasBugs ? bugDescription : null,
          bug_location: hasBugs ? bugLocation : null,
          bug_expected_behavior: hasBugs ? bugExpectedBehavior : null,
          questions_for_us: questionsForUs || null,
          onboarding_rating: onboardingRating,
          ai_training_permission: aiTrainingPermission
        })
        .select()
        .single();

      if (intakeError) throw intakeError;

      // Create AI training signals if permission granted
      if (aiTrainingPermission && intakeForm) {
        const signals = [];

        // Add goals as signals
        advertisingGoals.forEach(goal => {
          signals.push({
            user_id: user.id,
            signal_type: 'goal',
            signal_content: goal,
            context: { source: 'intake_form', form_id: intakeForm.id }
          });
        });

        // Add challenges as signals
        currentChallenges.forEach(challenge => {
          signals.push({
            user_id: user.id,
            signal_type: 'challenge',
            signal_content: challenge,
            context: { source: 'intake_form', form_id: intakeForm.id }
          });
        });

        if (signals.length > 0) {
          await supabase.from('ai_training_signals').insert(signals);
        }

        // Add questions if provided
        if (questionsForUs) {
          await supabase.from('customer_questions').insert({
            user_id: user.id,
            intake_form_id: intakeForm.id,
            question: questionsForUs,
            used_for_ai_training: true
          });
        }

        // Add feature request as suggestion
        if (featureRequest) {
          await supabase.from('customer_suggestions').insert({
            user_id: user.id,
            intake_form_id: intakeForm.id,
            suggestion: featureRequest,
            category: 'feature'
          });
        }

        // Add bug report
        if (hasBugs && bugDescription) {
          await supabase.from('customer_bug_reports').insert({
            user_id: user.id,
            intake_form_id: intakeForm.id,
            bug_location: bugLocation,
            bug_description: bugDescription,
            expected_behavior: bugExpectedBehavior,
            severity: 'medium'
          });
        }
      }

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully. Our team will review it shortly."
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting intake form:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Unable to submit form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Customer Intake & Feedback" showBack backTo="/dashboard">
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to xiXoi™</h1>
            <p className="text-muted-foreground">
              Help us serve you better by completing this quick intake form. Your feedback directly improves our AI.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Basic Information */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">1. Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="border-foreground/20"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-foreground/20"
                  />
                </div>
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="border-foreground/20"
                  />
                </div>
                <div>
                  <Label htmlFor="industryCategory">Industry / Category</Label>
                  <Input
                    id="industryCategory"
                    value={industryCategory}
                    onChange={(e) => setIndustryCategory(e.target.value)}
                    className="border-foreground/20"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="border-foreground/20"
                  />
                </div>
              </div>
            </Card>

            {/* 2. Advertising Goals */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">2. Advertising Goals</h2>
              <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>
              <div className="space-y-3">
                {advertisingGoalsOptions.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal}`}
                      checked={advertisingGoals.includes(goal)}
                      onCheckedChange={() => toggleArrayItem(advertisingGoals, goal, setAdvertisingGoals)}
                    />
                    <Label htmlFor={`goal-${goal}`} className="cursor-pointer">{goal}</Label>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3. Monthly Ad Budget */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">3. Monthly Ad Budget</h2>
              <div className="space-y-3">
                {budgetOptions.map((budget) => (
                  <div key={budget} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`budget-${budget}`}
                      name="budget"
                      checked={monthlyBudget === budget}
                      onChange={() => setMonthlyBudget(budget)}
                      className="cursor-pointer"
                    />
                    <Label htmlFor={`budget-${budget}`} className="cursor-pointer">{budget}</Label>
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. AI Creative Assistance */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">4. AI Creative Assistance</h2>
              <p className="text-sm text-muted-foreground mb-4">What do you want AI to help with first?</p>
              <div className="space-y-3">
                {aiAssistanceOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ai-${option}`}
                      checked={aiAssistanceNeeds.includes(option)}
                      onCheckedChange={() => toggleArrayItem(aiAssistanceNeeds, option, setAiAssistanceNeeds)}
                    />
                    <Label htmlFor={`ai-${option}`} className="cursor-pointer">{option}</Label>
                  </div>
                ))}
              </div>
            </Card>

            {/* 5. What Do You Sell */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">5. What Do You Sell?</h2>
              <Label htmlFor="productDescription">Describe your product or service in 1–2 sentences</Label>
              <Textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="AI will generate ads based on this description..."
                className="min-h-[100px] border-foreground/20 mt-2"
              />
            </Card>

            {/* 6. Current Challenges */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">6. Your Current Challenges</h2>
              <p className="text-sm text-muted-foreground mb-4">What are your biggest challenges with advertising?</p>
              <div className="space-y-3">
                {challengesOptions.map((challenge) => (
                  <div key={challenge} className="flex items-center space-x-2">
                    <Checkbox
                      id={`challenge-${challenge}`}
                      checked={currentChallenges.includes(challenge)}
                      onCheckedChange={() => toggleArrayItem(currentChallenges, challenge, setCurrentChallenges)}
                    />
                    <Label htmlFor={`challenge-${challenge}`} className="cursor-pointer">{challenge}</Label>
                  </div>
                ))}
              </div>
            </Card>

            {/* 7. Feature Requests */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">7. Feature Requests (AI Improvement Input)</h2>
              <Label htmlFor="featureRequest">What should xiXoi build next to help you more?</Label>
              <Textarea
                id="featureRequest"
                value={featureRequest}
                onChange={(e) => setFeatureRequest(e.target.value)}
                placeholder="New features, improvements, anything at all..."
                className="min-h-[100px] border-foreground/20 mt-2"
              />
            </Card>

            {/* 8. Bug Reports */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">8. Bug Reports</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasBugs"
                    checked={hasBugs}
                    onCheckedChange={(checked) => setHasBugs(checked as boolean)}
                  />
                  <Label htmlFor="hasBugs" className="cursor-pointer">I experienced bugs or issues</Label>
                </div>
                
                {hasBugs && (
                  <>
                    <div>
                      <Label htmlFor="bugLocation">Where did it happen?</Label>
                      <Input
                        id="bugLocation"
                        value={bugLocation}
                        onChange={(e) => setBugLocation(e.target.value)}
                        placeholder="e.g., Campaign creation page, Dashboard"
                        className="border-foreground/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bugDescription">What were you doing?</Label>
                      <Textarea
                        id="bugDescription"
                        value={bugDescription}
                        onChange={(e) => setBugDescription(e.target.value)}
                        placeholder="Describe what happened..."
                        className="min-h-[80px] border-foreground/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bugExpectedBehavior">What did you expect to happen?</Label>
                      <Textarea
                        id="bugExpectedBehavior"
                        value={bugExpectedBehavior}
                        onChange={(e) => setBugExpectedBehavior(e.target.value)}
                        placeholder="What should have happened instead..."
                        className="min-h-[80px] border-foreground/20"
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* 9. Questions */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">9. Questions You Have for Us</h2>
              <Label htmlFor="questionsForUs">What questions do you have about xiXoi or advertising?</Label>
              <Textarea
                id="questionsForUs"
                value={questionsForUs}
                onChange={(e) => setQuestionsForUs(e.target.value)}
                placeholder="Ask us anything..."
                className="min-h-[100px] border-foreground/20 mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your questions help train our AI to provide better support.
              </p>
            </Card>

            {/* 10. Onboarding Rating */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">10. Onboarding Rating</h2>
              <Label>How easy was the onboarding so far?</Label>
              <div className="flex gap-4 mt-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setOnboardingRating(rating)}
                    className={`text-3xl transition-opacity ${
                      onboardingRating >= rating ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {onboardingRating === 5 && "Very easy"}
                {onboardingRating === 4 && "Pretty easy"}
                {onboardingRating === 3 && "Okay"}
                {onboardingRating === 2 && "Somewhat confusing"}
                {onboardingRating === 1 && "Very confusing"}
              </p>
            </Card>

            {/* 11. AI Training Permission */}
            <Card className="p-6 border-foreground/20">
              <h2 className="text-xl font-semibold mb-4">11. Permission for AI Training</h2>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="aiTrainingPermission"
                  checked={aiTrainingPermission}
                  onCheckedChange={(checked) => setAiTrainingPermission(checked as boolean)}
                />
                <Label htmlFor="aiTrainingPermission" className="cursor-pointer">
                  May we use your responses to improve our AI and your experience?
                </Label>
              </div>
            </Card>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full" 
              disabled={loading || !fullName || !email}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Need help? Contact us at{" "}
              <a href="mailto:info@stoltzone.com" className="text-foreground underline">
                info@stoltzone.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}