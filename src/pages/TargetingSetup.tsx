import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Brain, Target, Sparkles, AlertTriangle, Pencil, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [audienceSuggestion, setAudienceSuggestion] = useState<AudienceSuggestion | null>(null);
  const [selectedBudget, setSelectedBudget] = useState(35);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [errorState, setErrorState] = useState<{ message: string; details: string } | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
      
      // Call the generate-ad-variants function which also generates audience suggestions
      const { data, error } = await supabase.functions.invoke('generate-ad-variants', {
        body: { campaignId }
      });

      if (error) {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate targeting suggestions';
      
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

  const handleEditClick = async () => {
    if (!campaign) return;
    
    setEditName(campaign.name);
    
    // Get the campaign asset description
    const { data: assets } = await supabase
      .from('campaign_assets')
      .select('asset_text')
      .eq('campaign_id', campaign.id)
      .single();
    
    setEditDescription(assets?.asset_text || '');
    setShowEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!campaign || !editName.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    setSavingEdit(true);
    try {
      // Update campaign name
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ 
          name: editName.trim(),
          audience_suggestion: null // Clear old suggestion so it regenerates
        })
        .eq('id', campaign.id);

      if (campaignError) throw campaignError;

      // Update campaign asset description if it exists
      if (editDescription.trim()) {
        const { error: assetError } = await supabase
          .from('campaign_assets')
          .update({ asset_text: editDescription.trim() })
          .eq('campaign_id', campaign.id);

        if (assetError) throw assetError;
      }

      toast.success('Campaign updated! Regenerating targeting...');
      
      setShowEditDialog(false);
      setErrorState(null);
      setLoading(true);
      
      // Reload and regenerate
      await loadCampaign();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setSavingEdit(false);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-lg w-full">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Content Policy Issue</h2>
              <p className="text-destructive font-medium">{errorState.message}</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <p className="text-sm text-muted-foreground">
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
              
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
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
    { id: 'x', name: 'X', description: 'Real-time conversations' },
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

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update your campaign description to fix content policy issues. Make sure to remove any discriminatory language, illegal content, or misleading claims.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Campaign Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Campaign Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe your product or service"
                rows={8}
                className="resize-none"
              />
              <div className="bg-muted/50 rounded-md p-3 mt-2">
                <p className="text-xs text-muted-foreground font-medium mb-2">✅ Good description includes:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Clear product/service details</li>
                  <li>Key features and benefits</li>
                  <li>Pricing information</li>
                  <li>Target audience (without discrimination)</li>
                  <li>Contact information or call-to-action</li>
                </ul>
                <p className="text-xs text-destructive font-medium mt-3 mb-2">❌ Avoid:</p>
                <ul className="text-xs text-destructive space-y-1 list-disc list-inside">
                  <li>Discriminatory language (race, gender, religion, etc.)</li>
                  <li>Illegal products or services</li>
                  <li>Misleading or deceptive claims</li>
                  <li>Prohibited content</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={savingEdit || !editName.trim() || !editDescription.trim()}
            >
              {savingEdit ? 'Saving & Regenerating...' : 'Save & Regenerate Targeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
