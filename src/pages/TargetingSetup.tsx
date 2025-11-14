import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Brain, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [audienceSuggestion, setAudienceSuggestion] = useState<AudienceSuggestion | null>(null);
  const [selectedBudget, setSelectedBudget] = useState(35);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [userPlan, setUserPlan] = useState<string>('free');

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
      
      if ((data as any).audience_suggestion) {
        const suggestion = (data as any).audience_suggestion as unknown as AudienceSuggestion;
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

  const togglePlatform = (platform: string) => {
    // Platform restrictions by tier
    const allowedPlatforms: Record<string, string[]> = {
      free: ['meta'],
      pro: ['meta', 'tiktok', 'google', 'linkedin'],
      elite: ['meta', 'tiktok', 'google', 'linkedin'],
      agency: ['meta', 'tiktok', 'google', 'linkedin']
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
    try {
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

      toast.success('Targeting saved!');
      
      // Navigate to dashboard
      navigate(`/dashboard`);
    } catch (error) {
      console.error('Error saving targeting:', error);
      toast.error('Failed to save targeting');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground">Loading targeting...</div>
      </div>
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
    { id: 'meta', name: 'Meta', description: 'Facebook & Instagram' },
    { id: 'tiktok', name: 'TikTok', description: 'Short-form video' },
    { id: 'google', name: 'Google', description: 'Search & Display' },
    { id: 'linkedin', name: 'LinkedIn', description: 'B2B Professional' },
  ];

  const estimatedReach = Math.floor(selectedBudget * 35);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
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
        <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Detected Product</h3>
              <p className="text-lg text-foreground">{audienceSuggestion.product_type}</p>
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
                  <span key={idx} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
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
        <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
        <div className="bg-card border border-border rounded-lg p-6 mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold text-foreground mb-4">Recommended Platforms</h3>
          <div className="grid grid-cols-2 gap-3">
            {platformOptions.map((platform) => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-semibold text-foreground">{platform.name}</div>
                <div className="text-sm text-muted-foreground">{platform.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Reasoning */}
        <div className="bg-muted/50 rounded-lg p-4 mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-sm text-muted-foreground italic">
            "{audienceSuggestion.reasoning}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/dashboard')}
          >
            Edit More
          </Button>
          <Button
            className="flex-1"
            onClick={handlePublish}
            disabled={loading || selectedPlatforms.length === 0}
          >
            Publish Now
          </Button>
        </div>
      </div>
    </div>
  );
}
