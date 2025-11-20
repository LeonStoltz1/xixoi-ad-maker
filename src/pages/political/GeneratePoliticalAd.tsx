import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle2, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePolitical } from "@/contexts/PoliticalContext";
import { BackButton } from "@/components/BackButton";
import { PoliticalAdGenerationSchema, type PoliticalAdGenerationFormValues } from "@/schema/political";
import { checkPoliticalCompliance } from "@/lib/politicalCompliance";
import type { ComplianceIssue } from "@/types/political";
import { invokeWithRetry } from "@/lib/retryWithBackoff";

export default function GeneratePoliticalAd() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { politicalProfile, refreshProfile } = usePolitical();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<{
    short: string;
    medium: string;
    long: string;
  } | null>(null);
  const [disclaimer, setDisclaimer] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<'short' | 'medium' | 'long' | null>(null);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [watermarkUrl, setWatermarkUrl] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PoliticalAdGenerationFormValues>({
    resolver: zodResolver(PoliticalAdGenerationSchema),
    defaultValues: {
      policyFocus: 'economy',
      tone: 'professional',
      platform: 'meta',
      customMessage: '',
    },
  });

  // Check if user has political tier and approved candidate
  if (!politicalProfile?.hasPoliticalTier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Political Tier Required</h2>
          <p className="text-muted-foreground mb-6">
            Political ad generation requires the $99/month Political tier subscription.
          </p>
          <Button onClick={() => navigate('/pricing')}>View Pricing</Button>
        </Card>
      </div>
    );
  }

  if (!politicalProfile?.candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Verification Required</h2>
          <p className="text-muted-foreground mb-6">
            You must complete candidate verification before generating political ads.
          </p>
          <Button onClick={() => navigate('/political/verify')}>Complete Verification</Button>
        </Card>
      </div>
    );
  }

  if (!politicalProfile.candidate.approved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Approval Pending</h2>
          <p className="text-muted-foreground mb-6">
            Your candidate verification is under review. You'll be notified once approved.
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Check usage limit
  const hasReachedLimit = politicalProfile.adsUsed >= politicalProfile.adsLimit;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const platformLimits: Record<string, number> = {
    meta: 125,
    google: 90,
    tiktok: 100,
    linkedin: 150,
    x: 280,
  };

  async function onSubmit(data: PoliticalAdGenerationFormValues) {
    setLoading(true);
    try {
      // Check and increment usage quota before generating
      const { data: usageData, error: usageError } = await supabase.functions.invoke(
        'increment-political-usage'
      );

      if (usageError || usageData?.error) {
        // Handle rate limit and credits exhausted errors
        if (usageError?.message?.includes('429') || usageError?.message?.includes('rate limit')) {
          toast({
            title: "Service Unavailable",
            description: "Service temporarily unavailable. Please try again in a moment.",
            variant: "destructive",
          });
        } else if (usageError?.message?.includes('402') || usageError?.message?.includes('credits exhausted')) {
          toast({
            title: "Credits Exhausted",
            description: "AI service credits exhausted. Please contact support at info@stoltzone.com",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Usage Limit Reached",
            description: usageData?.message || "Failed to check usage quota",
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      toast({
        title: "Quota Updated",
        description: `${usageData.remaining} ads remaining this month`,
      });

      const characterLimit = platformLimits[data.platform];
      
      const { data: functionData, error: functionError } = await invokeWithRetry(
        supabase,
        'generate-political-ad',
        {
          candidateName: politicalProfile.candidate!.fullName,
          race: politicalProfile.candidate!.race,
          electionYear: politicalProfile.candidate!.electionYear,
          policyFocus: data.policyFocus,
          tone: data.tone,
          platform: data.platform,
          customMessage: data.customMessage,
          characterLimit,
        },
        { maxRetries: 2, initialDelayMs: 1000 }
      );

      if (functionError) {
        // Handle rate limit and credits exhausted errors
        if (functionError.message?.includes('429') || functionError.message?.includes('rate limit')) {
          toast({
            title: "Rate Limit Reached",
            description: "AI service temporarily unavailable. Please try again in a moment.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        } else if (functionError.message?.includes('402') || functionError.message?.includes('credits exhausted')) {
          toast({
            title: "Credits Exhausted",
            description: "AI service credits exhausted. Please contact support at info@stoltzone.com",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        throw functionError;
      }

      setGeneratedVariants(functionData.variants);
      setDisclaimer(functionData.disclaimer);
      
      // Generate watermark if image uploaded
      if (uploadedFile && previewUrl) {
        try {
          const { data: watermarkData, error: watermarkError } = await supabase.functions.invoke('sign-political-ad', {
            body: {
              imageUrl: previewUrl,
              candidateName: politicalProfile.candidate!.fullName,
              race: politicalProfile.candidate!.race || "Unknown",
              electionYear: politicalProfile.candidate!.electionYear || new Date().getFullYear(),
              adCopy: functionData.variants.medium
            }
          });

          if (watermarkError) {
            console.error('Watermark generation error:', watermarkError);
          } else if (watermarkData) {
            setWatermarkUrl(watermarkData.watermarkUrl);
            setSignature(watermarkData.signatureBase58);
            
            if (watermarkData.verifyUrl) {
              toast({
                title: "QR Code Added",
                description: "Scan the QR code on your ad to verify authenticity",
              });
            }
          }
        } catch (watermarkError) {
          console.error('Watermark generation error:', watermarkError);
          // Don't fail the whole process if watermarking fails
        }
      }
      
      // Check compliance on all variants
      const allIssues: ComplianceIssue[] = [];
      Object.values(functionData.variants).forEach((variant: string) => {
        const issues = checkPoliticalCompliance(variant, politicalProfile.candidate!.fullName);
        allIssues.push(...issues);
      });
      setComplianceIssues(allIssues);

      // Refresh profile to get updated usage count
      await refreshProfile();

      toast({
        title: "Ads Generated",
        description: "Review the generated variants and check compliance before saving.",
      });

    } catch (error) {
      console.error('Error generating political ad:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate political ads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAd(variant: 'short' | 'medium' | 'long') {
    if (!generatedVariants || !politicalProfile.candidate) return;

    try {
      const adCopy = generatedVariants[variant];
      const fullCopy = `${adCopy}\n\n${disclaimer}`;

      // Upload image if provided
      let imageUrl = null;
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `political-ads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('campaign-assets')
          .upload(filePath, uploadedFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('campaign-assets')
            .getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
      }

      // Save to database
      const { error } = await supabase
        .from('political_ads')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user!.id,
          candidate_id: politicalProfile.candidate.id,
          ad_copy: fullCopy,
          image_url: imageUrl,
          platform: form.getValues('platform'),
          policy_focus: form.getValues('policyFocus'),
          tone: form.getValues('tone'),
          watermark_url: watermarkUrl || null,
          signature_base58: signature || null,
          compliance_checked: complianceIssues.filter(i => i.severity === 'error').length === 0,
          compliance_issues: JSON.stringify(complianceIssues),
        }] as any);

      if (error) throw error;

      toast({
        title: "Ad Saved",
        description: "Your political ad has been saved to your dashboard.",
      });

      navigate('/political/dashboard');
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save ad",
        variant: "destructive",
      });
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`${text}\n\n${disclaimer}`);
    toast({ title: "Copied to clipboard" });
  };

  const errorCount = complianceIssues.filter(i => i.severity === 'error').length;
  const warningCount = complianceIssues.filter(i => i.severity === 'warning').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <BackButton to="/dashboard" label="Dashboard" className="mb-8" />

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Generate Political Ad</h1>
          <p className="text-muted-foreground">
            Candidate: {politicalProfile.candidate.fullName} • {politicalProfile.candidate.race} • {politicalProfile.candidate.electionYear}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Usage: {politicalProfile.adsUsed} / {politicalProfile.adsLimit} ads this month
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <Card className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="policyFocus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Focus</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="economy">Economy & Jobs</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="environment">Environment</SelectItem>
                          <SelectItem value="security">Public Safety</SelectItem>
                          <SelectItem value="immigration">Immigration</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="persuasive">Persuasive</SelectItem>
                          <SelectItem value="hopeful">Hopeful</SelectItem>
                          <SelectItem value="strong">Strong</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="meta">Meta (Facebook/Instagram)</SelectItem>
                          <SelectItem value="google">Google Ads</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="x">X (Twitter)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Context (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add specific achievements, local issues, or unique campaign messages..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Image (Optional)</label>
                  <div className="border-2 border-dashed p-8 text-center hover:border-primary transition-colors">
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload image</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || hasReachedLimit}
                  className="w-full"
                >
                  {loading ? (
                    "Generating..."
                  ) : hasReachedLimit ? (
                    "Monthly Limit Reached"
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Political Ads
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </Card>

          {/* Generated Variants */}
          <div className="space-y-6">
            {generatedVariants && (
              <>
                {/* Watermarked Preview */}
                {watermarkUrl && (
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Watermarked Preview
                    </h3>
                    <div className="space-y-4">
                      <img 
                        src={watermarkUrl} 
                        alt="Watermarked ad preview" 
                        className="w-full rounded border border-border"
                      />
                      {signature && (
                        <div className="p-3 bg-muted rounded space-y-2">
                          <p className="text-xs text-muted-foreground font-mono break-all">
                            <strong>Digital Signature:</strong> {signature.substring(0, 32)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            This signature verifies the authenticity of your political ad.
                          </p>
                          <p className="text-xs text-primary font-medium">
                            ✓ QR code included for instant verification
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Compliance Status */}
                {complianceIssues.length > 0 && (
                  <Alert variant={errorCount > 0 ? "destructive" : "default"}>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Compliance Check:</strong>{" "}
                      {errorCount > 0 ? `${errorCount} critical issues found` : `${warningCount} warnings`}
                      <ul className="mt-2 space-y-1 text-sm">
                        {complianceIssues.slice(0, 3).map((issue, idx) => (
                          <li key={idx}>• {issue.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Short Variant */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Short (Headline)</h3>
                      <p className="text-sm text-muted-foreground">{generatedVariants.short.length} characters</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedVariants.short)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveAd('short')}
                        disabled={errorCount > 0}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{generatedVariants.short}</p>
                  <p className="text-xs text-muted-foreground italic">{disclaimer}</p>
                </Card>

                {/* Medium Variant */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Medium</h3>
                      <p className="text-sm text-muted-foreground">{generatedVariants.medium.length} characters</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedVariants.medium)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveAd('medium')}
                        disabled={errorCount > 0}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{generatedVariants.medium}</p>
                  <p className="text-xs text-muted-foreground italic">{disclaimer}</p>
                </Card>

                {/* Long Variant */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Long (Full)</h3>
                      <p className="text-sm text-muted-foreground">{generatedVariants.long.length} characters</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedVariants.long)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveAd('long')}
                        disabled={errorCount > 0}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{generatedVariants.long}</p>
                  <p className="text-xs text-muted-foreground italic">{disclaimer}</p>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
