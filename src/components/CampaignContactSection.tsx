import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Phone, Mail, Globe, MessageSquare, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGeolocation } from "@/hooks/useGeolocation";

interface CampaignContactSectionProps {
  primaryGoal: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  landingUrl: string | null;
  onPrimaryGoalChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
  onContactEmailChange: (value: string) => void;
  onLandingUrlChange: (value: string) => void;
}

export function CampaignContactSection({
  primaryGoal,
  contactPhone,
  contactEmail,
  landingUrl,
  onPrimaryGoalChange,
  onContactPhoneChange,
  onContactEmailChange,
  onLandingUrlChange,
}: CampaignContactSectionProps) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const geolocation = useGeolocation();

  const handleGoalChange = (value: string) => {
    if ((value === 'calls' || value === 'email') && !showDisclaimer) {
      setShowDisclaimer(true);
    }
    onPrimaryGoalChange(value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Contact & Call-to-Action</Label>
        <p className="text-sm text-muted-foreground mt-1">
          What should happen when people respond to this ad?
        </p>
      </div>

      <RadioGroup value={primaryGoal || ''} onValueChange={handleGoalChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="website" id="goal-website" />
          <Label htmlFor="goal-website" className="flex items-center gap-2 cursor-pointer font-normal">
            <Globe className="w-4 h-4" />
            Visit my website
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="calls" id="goal-calls" />
          <Label htmlFor="goal-calls" className="flex items-center gap-2 cursor-pointer font-normal">
            <Phone className="w-4 h-4" />
            Call my phone
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="email" id="goal-email" />
          <Label htmlFor="goal-email" className="flex items-center gap-2 cursor-pointer font-normal">
            <Mail className="w-4 h-4" />
            Send me an email
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="messages" id="goal-messages" />
          <Label htmlFor="goal-messages" className="flex items-center gap-2 cursor-pointer font-normal">
            <MessageSquare className="w-4 h-4" />
            Message me (Messenger / WhatsApp)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="lead_form" id="goal-leadform" />
          <Label htmlFor="goal-leadform" className="flex items-center gap-2 cursor-pointer font-normal">
            <FileText className="w-4 h-4" />
            Fill out lead form
          </Label>
        </div>
      </RadioGroup>

      {/* Conditional fields based on goal */}
      {primaryGoal === 'website' && (
        <div className="space-y-2 pl-6 border-l-2 border-primary/20">
          <Label htmlFor="landing-url">Landing Page URL *</Label>
          <Input
            id="landing-url"
            type="url"
            value={landingUrl || ''}
            onChange={(e) => onLandingUrlChange(e.target.value)}
            placeholder="https://example.com/landing-page"
          />
          <p className="text-xs text-muted-foreground">
            Where should the ad take people when they click
          </p>
        </div>
      )}

      {primaryGoal === 'calls' && (
        <div className="space-y-2 pl-6 border-l-2 border-primary/20">
          <Label htmlFor="contact-phone">Phone Number *</Label>
          <div className="flex gap-2">
            <div className="w-20 flex items-center justify-center border rounded-md bg-muted text-sm font-medium">
              {!geolocation.loading && geolocation.phonePrefix ? geolocation.phonePrefix : '+1'}
            </div>
            <Input
              id="contact-phone"
              type="tel"
              value={contactPhone || ''}
              onChange={(e) => onContactPhoneChange(e.target.value)}
              placeholder="(555) 123-4567"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {!geolocation.loading && geolocation.country 
              ? `Detected location: ${geolocation.country}` 
              : 'Include area code for best results'}
          </p>
        </div>
      )}

      {primaryGoal === 'email' && (
        <div className="space-y-2 pl-6 border-l-2 border-primary/20">
          <Label htmlFor="contact-email">Contact Email *</Label>
          <Input
            id="contact-email"
            type="email"
            value={contactEmail || ''}
            onChange={(e) => onContactEmailChange(e.target.value)}
            placeholder="contact@example.com"
          />
          <p className="text-xs text-muted-foreground">
            Email where you want to receive inquiries
          </p>
        </div>
      )}

      {primaryGoal === 'messages' && (
        <div className="space-y-2 pl-6 border-l-2 border-primary/20">
          <Label htmlFor="contact-phone-msg">Phone Number (with country code) *</Label>
          <Input
            id="contact-phone-msg"
            type="tel"
            value={contactPhone || ''}
            onChange={(e) => onContactPhoneChange(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
          <p className="text-xs text-muted-foreground">
            For WhatsApp/Messenger integration
          </p>
        </div>
      )}

      {primaryGoal === 'lead_form' && (
        <div className="space-y-2 pl-6 border-l-2 border-primary/20">
          <Label htmlFor="landing-url-form">Landing Page URL *</Label>
          <Input
            id="landing-url-form"
            type="url"
            value={landingUrl || ''}
            onChange={(e) => onLandingUrlChange(e.target.value)}
            placeholder="https://example.com/contact-form"
          />
          <p className="text-xs text-muted-foreground">
            Page with your lead capture form
          </p>
        </div>
      )}

      {/* Platform mapping notice */}
      {primaryGoal && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            xiXoi will map this to each platform's appropriate CTA button (e.g., "Call Now" on Meta, call extensions on Google Ads, "Contact" on LinkedIn).
          </AlertDescription>
        </Alert>
      )}

      {/* Compliance disclaimer */}
      {showDisclaimer && (primaryGoal === 'calls' || primaryGoal === 'email') && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-xs text-orange-900">
            By using Call/Email CTAs you confirm you have permission to receive calls/emails and agree to each platform's advertising policies and anti-spam rules.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
