import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Brain, Target, Sparkles, AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AudienceSuggestion {
  product_type: string;
  audience: {
    age_range: string;
    gender: string;
    interests: string[];
  };
  locations: string[];
  daily_budget: number;
  platforms: string[];
  reasoning: string;
}

export default function TargetingSetup() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const geolocation = useGeolocation();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [audienceSuggestion, setAudienceSuggestion] = useState<AudienceSuggestion | null>(null);
  const [selectedBudget, setSelectedBudget] = useState(35);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [errorState, setErrorState] = useState<{ message: string; details: string } | null>(null);
  const [moderationResult, setModerationResult] = useState<any>(null);
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [moderating, setModerating] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      // Get user plan
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        setUserPlan(profile?.plan || 'free');
      }

      setCampaign(data as any);
      
      // If no audience suggestion exists, generate it now
      if (!(data as any).audience_suggestion) {
        console.log('No audience suggestion found, generating...');
        await generateAudienceSuggestion();
      } else {
        const suggestion = (data as any).audience_suggestion as unknown as AudienceSuggestion;
        
        // If location is not set or is generic, update with detected location
        if (!geolocation.loading && geolocation.country && 
            (!suggestion.locations || suggestion.locations.length === 0 || 
             suggestion.locations.includes('Global') || suggestion.locations.includes('United States'))) {
          suggestion.locations = [geolocation.city && geolocation.region 
            ? `${geolocation.city}, ${geolocation.region}, ${geolocation.country}`
            : geolocation.country];
        }
        
        setAudienceSuggestion(suggestion);
        setSelectedBudget(suggestion.daily_budget || 35);
        setSelectedPlatforms(suggestion.platforms || ['meta']);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Failed to load campaign');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const generateAudienceSuggestion = async () => {
    try {
      setLoading(true);
      
      // Call the generate-ad-variants function with retry logic
      const { data, error } = await invokeWithRetry(
        supabase,
        'generate-ad-variants',
        { campaignId },
        { maxRetries: 3, initialDelayMs: 1000 }
      );

      if (error) {
        // Handle rate limit and credits exhausted errors
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast.error('AI service temporarily unavailable. Please try again in a moment.');
          return;
        } else if (error.message?.includes('402') || error.message?.includes('credits exhausted')) {
          toast.error('AI service credits exhausted. Please contact support at support@xixoi.com');
          return;
        }
        const errorMessage = error.message || 'Failed to generate targeting suggestions';
        throw new Error(errorMessage);
      }

      // Reload the campaign to get the new audience suggestion
      const { data: updatedCampaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (fetchError) throw fetchError;

      if ((updatedCampaign as any).audience_suggestion) {
        const suggestion = (updatedCampaign as any).audience_suggestion as unknown as AudienceSuggestion;
        setAudienceSuggestion(suggestion);
        setSelectedBudget(suggestion.daily_budget || 35);
        setSelectedPlatforms(suggestion.platforms || ['meta']);
        setCampaign(updatedCampaign);
      } else {
        throw new Error('Failed to generate audience suggestions');
      }
    } catch (error) {
      console.error('Error generating audience suggestion:', error);
      
      // Extract the actual error message from the edge function
      let errorMessage = 'Failed to generate targeting suggestions';
      
      if (error instanceof Error) {
        // Try to parse the error message to extract the actual error from the edge function
        const match = error.message.match(/{"error":"([^"]+)"}/);
        if (match && match[1]) {
          errorMessage = match[1];
        } else if (error.message && !error.message.includes('non-2xx')) {
          errorMessage = error.message;
        }
      }
      
      // Check if it's a content policy violation
      const isPolicyViolation = errorMessage.toLowerCase().includes('violates') || 
                                errorMessage.toLowerCase().includes('discriminatory') ||
                                errorMessage.toLowerCase().includes('illegal');
      
      setErrorState({
        message: errorMessage,
        details: isPolicyViolation 
          ? 'The AI detected content that violates advertising policies. This could include discriminatory language, illegal content, or other policy violations. Please review and edit your campaign description to remove any problematic content.'
          : 'There was an issue generating targeting suggestions. Please review your campaign description and ensure it contains clear, specific information about your product or service.'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    // Platform restrictions by tier
    const allowedPlatforms: Record<string, string[]> = {
      free: ['meta'],
      pro: ['meta', 'tiktok', 'google', 'linkedin', 'x'],
      elite: ['meta', 'tiktok', 'google', 'linkedin', 'x'],
      agency: ['meta', 'tiktok', 'google', 'linkedin', 'x']
    };

    const allowed = allowedPlatforms[userPlan] || ['meta'];
    
    if (!allowed.includes(platform)) {
      toast.error(`Upgrade to Pro to use ${platform.toUpperCase()}`);
      return;
    }

    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    try {
      setModerating(true);

      // Step 1: Moderate content before publishing with retry logic
      const { data: moderation, error: moderationError } = await invokeWithRetry(
        supabase,
        'moderate-ad-content',
        {
          campaignId,
          platforms: selectedPlatforms
        },
        { maxRetries: 2, initialDelayMs: 1000 }
      );

      if (moderationError) {
        console.error('Moderation error:', moderationError);
        
        // Handle rate limit and credits exhausted errors
        if (moderationError.message?.includes('429') || moderationError.message?.includes('rate limit')) {
          toast.error('AI service temporarily unavailable. Please try again in a moment.');
          return;
        } else if (moderationError.message?.includes('402') || moderationError.message?.includes('credits exhausted')) {
          toast.error('AI service credits exhausted. Please contact support at support@xixoi.com');
          return;
        }
        
        toast.error('Content moderation check failed. Please try again.');
        return;
      }

      console.log('Moderation result:', moderation);

      // Step 2: Check if content is approved
      if (!moderation.approved) {
        setModerationResult(moderation);
        setShowModerationDialog(true);
        setModerating(false);
        return;
      }

      // Step 3: If approved, proceed with publish
      setLoading(true);

      // Update campaign with selected targeting
      await supabase
        .from('campaigns')
        .update({
          daily_budget: selectedBudget,
          target_location: audienceSuggestion?.locations.join(', ') || 'Global',
        })
        .eq('id', campaignId);

      // Create campaign channels
      const channelRecords = selectedPlatforms.map(platform => ({
        campaign_id: campaignId,
        channel: platform,
        is_connected: false
      }));

      await supabase
        .from('campaign_channels')
        .insert(channelRecords);

      toast.success('Content approved! Campaign ready to publish.');
      
      // Navigate to dashboard
      navigate(`/dashboard`);
    } catch (error) {
      console.error('Error in publish flow:', error);
      toast.error('Failed to complete publish process');
    } finally {
      setLoading(false);
      setModerating(false);
    }
  };

  const handleEditClick = () => {
    navigate(`/edit-campaign/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold">Analyzing your campaign...</p>
            <p className="text-sm text-muted-foreground">
              AI is generating optimal targeting suggestions
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with option to edit
  if (errorState) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-lg w-full">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Content Policy Issue</h2>
                <p className="font-medium">{errorState.message}</p>
              </div>
              
              <div className="bg-muted/50 p-4 text-left">
                <p className="text-sm">
                  {errorState.details}
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleEditClick}
                  className="w-full"
                  size="lg"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Campaign Description
                </Button>
                
                <BackButton to="/dashboard" label="Dashboard" className="flex-1" />
              </div>

              <div className="text-xs text-muted-foreground pt-4">
                <p>Common issues include:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                  <li>Discriminatory language based on race, gender, religion, etc.</li>
                  <li>References to illegal products or services</li>
                  <li>Misleading or deceptive claims</li>
                  <li>Prohibited content per advertising policies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!audienceSuggestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-foreground mb-4">No targeting suggestions available</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const platformOptions = [
    { id: 'meta', name: 'Meta', description: 'Facebook & Instagram', disabled: false },
    { id: 'tiktok', name: 'TikTok', description: 'Short-form video', disabled: true },
    { id: 'google', name: 'Google', description: 'Search & Display', disabled: true },
    { id: 'linkedin', name: 'LinkedIn', description: 'B2B Professional', disabled: true },
    { id: 'x', name: 'X', description: 'Real-time conversations', disabled: true },
  ];

  const estimatedReach = Math.floor(selectedBudget * 35);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <BackButton to="/create-campaign" label="Campaign" className="mb-8" />

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-8 h-8 text-primary" />
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            xiXoi™ Auto-Targeted Your Ad
          </h1>
          <p className="text-muted-foreground">
            We analyzed your content and found the best audience
          </p>
        </div>

        {/* Detected Product */}
        <div className="bg-card border border-border p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Detected Product</h3>
              <p className="text-lg text-foreground">{audienceSuggestion.product_type}</p>
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-card border border-border p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold text-foreground mb-4">Target Audience</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground min-w-[80px]">Age:</span>
              <span className="text-foreground">{audienceSuggestion.audience.age_range}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground min-w-[80px]">Gender:</span>
              <span className="text-foreground capitalize">{audienceSuggestion.audience.gender}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-muted-foreground min-w-[80px]">Interests:</span>
              <div className="flex flex-wrap gap-2">
                {audienceSuggestion.audience.interests.map((interest, idx) => (
                  <span key={idx} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm border border-foreground/20">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground min-w-[80px]">Location:</span>
              <span className="text-foreground">{audienceSuggestion.locations.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Budget Slider */}
        <div className="bg-card border border-border p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-semibold text-foreground mb-4">Daily Budget</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">${selectedBudget}</span>
              <span className="text-sm text-muted-foreground">per day</span>
            </div>
            <Slider
              value={[selectedBudget]}
              onValueChange={(values) => setSelectedBudget(values[0])}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Reaches ~{estimatedReach.toLocaleString()} people/day
            </p>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="bg-card border border-border p-6 mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold text-foreground mb-4">Recommended Platforms</h3>
          <div className="grid grid-cols-2 gap-3">
            {platformOptions.map((platform) => (
              <button
                key={platform.id}
                onClick={() => !platform.disabled && togglePlatform(platform.id)}
                disabled={platform.disabled}
                className={`p-4 border-2 transition-all text-left relative ${
                  platform.disabled
                    ? 'border-border/50 bg-muted/30 opacity-60 cursor-not-allowed'
                    : selectedPlatforms.includes(platform.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-semibold text-foreground">{platform.name}</div>
                <div className="text-sm text-muted-foreground">{platform.description}</div>
                {platform.disabled && (
                  <div className="absolute top-2 right-2 text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
                    Coming Soon
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Reasoning */}
        <div className="bg-muted/50 p-4 mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-sm text-muted-foreground italic">
            "{audienceSuggestion.reasoning}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEditClick}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Campaign
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate(`/review-ad/${campaignId}`)}
              disabled={selectedPlatforms.length === 0}
            >
              Continue to Review
            </Button>
          </div>
          {selectedPlatforms.length === 0 && (
            <p className="text-xs text-center text-destructive">
              ⚠️ Please select at least one platform to continue
            </p>
          )}
        </div>
      </div>
    </div>

      {/* Content Moderation Dialog */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Content Policy Violations Detected
            </DialogTitle>
            <DialogDescription>
              {moderationResult?.summary || 'Your ad content violates platform advertising policies and will likely be rejected.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {moderationResult?.violations && moderationResult.violations.length > 0 && (
              <div className="space-y-3">
                {moderationResult.violations.map((violation: any, index: number) => (
                  <div 
                    key={index} 
                    className={`p-4 border-2 ${
                      violation.severity === 'high' 
                        ? 'border-destructive bg-destructive/5' 
                        : violation.severity === 'medium'
                        ? 'border-foreground bg-background'
                        : 'border-foreground/50 bg-background'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 font-bold text-xs uppercase px-2 py-1 ${
                        violation.severity === 'high'
                          ? 'bg-destructive text-destructive-foreground'
                          : violation.severity === 'medium'
                          ? 'bg-foreground text-background'
                          : 'bg-foreground/70 text-background'
                      }`}>
                        {violation.severity}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm capitalize">{violation.platform}</span>
                          <span className="text-xs text-muted-foreground">Platform</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">Issue:</p>
                          <p className="text-sm text-muted-foreground">{violation.issue}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">How to Fix:</p>
                          <p className="text-sm text-muted-foreground">{violation.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`p-4 border ${
              moderationResult?.overallRisk === 'high'
                ? 'border-destructive bg-destructive/5'
                : moderationResult?.overallRisk === 'medium'
                ? 'border-foreground bg-background'
                : 'border-foreground/50 bg-background'
            }`}>
              <p className="text-sm font-medium mb-2">Overall Risk: <span className="uppercase">{moderationResult?.overallRisk}</span></p>
              <p className="text-sm text-muted-foreground">
                Content that violates platform policies will be rejected, wasting your ad spend and potentially getting your account flagged. Please edit your campaign to fix these issues before publishing.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModerationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowModerationDialog(false);
                handleEditClick();
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
