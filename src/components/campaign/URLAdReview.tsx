import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffectiveTier } from "@/hooks/useEffectiveTier";
import { FreeUpgradeModal } from "@/components/FreeUpgradeModal";

interface URLAdReviewProps {
  campaignId: string;
  selectedImage: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
  sourceUrl: string;
  businessName: string;
  targeting: {
    suggestedLocation: string;
    suggestedBudget: number;
    audienceSummary: string;
  };
  onBack: () => void;
  onPublish: (data: {
    headline: string;
    bodyCopy: string;
    ctaText: string;
    destinationType: string;
    destination: string;
    location: string;
    dailyBudget: number;
    platforms: { facebook: boolean; instagram: boolean };
  }) => void;
}

export function URLAdReview({
  campaignId,
  selectedImage,
  headline: initialHeadline,
  bodyCopy: initialBodyCopy,
  ctaText: initialCtaText,
  sourceUrl,
  businessName,
  targeting,
  onBack,
  onPublish
}: URLAdReviewProps) {
  const { tier } = useEffectiveTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [headline, setHeadline] = useState(initialHeadline);
  const [bodyCopy, setBodyCopy] = useState(initialBodyCopy);
  const [ctaText, setCtaText] = useState(initialCtaText);
  const [destinationType, setDestinationType] = useState<'website' | 'phone' | 'email'>('website');
  const [destination, setDestination] = useState(sourceUrl);
  const [location, setLocation] = useState(targeting.suggestedLocation);
  const [dailyBudget, setDailyBudget] = useState(targeting.suggestedBudget);
  const [platforms, setPlatforms] = useState({ facebook: true, instagram: true });
  const [targetingOpen, setTargetingOpen] = useState(false);

  const handlePublish = () => {
    // Check if user is on free tier
    if (tier === 'free') {
      setShowUpgradeModal(true);
      return;
    }

    // Proceed with normal publish for paid users
    onPublish({
      headline,
      bodyCopy,
      ctaText,
      destinationType,
      destination,
      location,
      dailyBudget,
      platforms
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Images
        </Button>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">Review Your Ad</h1>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Live Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Live Preview</h2>
          <Card className="p-0 overflow-hidden">
            {/* Instagram-style ad preview */}
            <div className="bg-background">
              {/* Post header */}
              <div className="flex items-center gap-3 p-3 border-b">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{businessName}</p>
                  <p className="text-xs text-muted-foreground">Sponsored</p>
                </div>
              </div>

              {/* Image */}
              <div className="aspect-square bg-muted">
                <img
                  src={selectedImage}
                  alt="Ad preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Ad content */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-base line-clamp-2">{headline}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{bodyCopy}</p>
                </div>

                <Button className="w-full" size="sm">
                  {ctaText}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Editable Fields */}
        <div className="space-y-6">
          {/* Destination Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Where should people go?</Label>
            <RadioGroup value={destinationType} onValueChange={(v) => setDestinationType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="website" id="website" />
                <Label htmlFor="website" className="font-normal cursor-pointer">Website URL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="font-normal cursor-pointer">Phone Number</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="font-normal cursor-pointer">Email Address</Label>
              </div>
            </RadioGroup>

            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={
                destinationType === 'website' ? 'https://yoursite.com' :
                destinationType === 'phone' ? '+1 (555) 123-4567' :
                'hello@yourcompany.com'
              }
            />
          </div>

          {/* Quick Edit Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Quick Edits</Label>
            
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={40}
              />
              <p className="text-xs text-muted-foreground">{headline.length}/40 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyCopy">Body Copy</Label>
              <Textarea
                id="bodyCopy"
                value={bodyCopy}
                onChange={(e) => setBodyCopy(e.target.value)}
                maxLength={125}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{bodyCopy.length}/125 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta">Call to Action</Label>
              <Input
                id="cta"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                maxLength={30}
              />
            </div>
          </div>

          {/* Advanced: Targeting (Collapsed) */}
          <Collapsible open={targetingOpen} onOpenChange={setTargetingOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Advanced: Targeting & Budget
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", targetingOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Target Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., United States"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Daily Budget: ${dailyBudget}</Label>
                <input
                  type="range"
                  id="budget"
                  min="5"
                  max="100"
                  step="5"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={platforms.facebook ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlatforms(p => ({ ...p, facebook: !p.facebook }))}
                  >
                    Facebook
                  </Button>
                  <Button
                    type="button"
                    variant={platforms.instagram ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlatforms(p => ({ ...p, instagram: !p.instagram }))}
                  >
                    Instagram
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            size="lg"
            className="w-full"
          >
            Publish Ad →
          </Button>
        </div>
      </div>

      {/* Free Upgrade Modal */}
      <FreeUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        campaignId={campaignId}
        adData={{
          image: selectedImage,
          headline,
          bodyCopy,
          ctaText
        }}
      />
    </div>
  );
}
