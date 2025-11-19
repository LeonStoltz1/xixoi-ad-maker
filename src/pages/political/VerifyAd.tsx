import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PoliticalAd, PoliticalCandidate, ComplianceIssue } from "@/types/political";
import { BackButton } from "@/components/BackButton";

export default function VerifyAd() {
  const { adId } = useParams<{ adId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ad, setAd] = useState<PoliticalAd | null>(null);
  const [candidate, setCandidate] = useState<PoliticalCandidate | null>(null);

  useEffect(() => {
    loadAdData();
  }, [adId]);

  const loadAdData = async () => {
    if (!adId) return;
    
    try {
      // Fetch ad data
      const { data: adData, error: adError } = await supabase
        .from('political_ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (adError) throw adError;

      const mappedAd: PoliticalAd = {
        id: adData.id,
        userId: adData.user_id,
        candidateId: adData.candidate_id,
        campaignId: adData.campaign_id,
        adCopy: adData.ad_copy,
        imageUrl: adData.image_url,
        platform: adData.platform,
        watermarkUrl: adData.watermark_url,
        signatureBase58: adData.signature_base58,
        policyFocus: adData.policy_focus,
        tone: adData.tone,
        published: adData.published,
        publishedAt: adData.published_at,
        complianceChecked: adData.compliance_checked,
        complianceIssues: adData.compliance_issues 
          ? (adData.compliance_issues as unknown as ComplianceIssue[])
          : null,
        createdAt: adData.created_at,
        updatedAt: adData.updated_at,
      };

      setAd(mappedAd);

      // Fetch candidate data if available
      if (mappedAd.candidateId) {
        const { data: candidateData, error: candidateError } = await supabase
          .from('political_candidates')
          .select('*')
          .eq('id', mappedAd.candidateId)
          .single();

        if (!candidateError && candidateData) {
          const mappedCandidate: PoliticalCandidate = {
            id: candidateData.id,
            userId: candidateData.user_id,
            fullName: candidateData.full_name,
            party: candidateData.party,
            race: candidateData.race,
            electionYear: candidateData.election_year,
            website: candidateData.website,
            fecId: candidateData.fec_id,
            address: candidateData.address,
            officeSought: candidateData.office_sought,
            idDocumentFrontUrl: candidateData.id_document_front_url,
            idDocumentBackUrl: candidateData.id_document_back_url,
            selfieUrl: candidateData.selfie_url,
            walletAddress: candidateData.wallet_address,
            approved: candidateData.approved,
            approvedAt: candidateData.approved_at,
            createdAt: candidateData.created_at,
            updatedAt: candidateData.updated_at,
          };
          setCandidate(mappedCandidate);
        }
      }
    } catch (error) {
      console.error('Error loading ad data:', error);
      toast({
        title: "Error",
        description: "Failed to load ad verification data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copySignature = () => {
    if (ad?.signatureBase58) {
      navigator.clipboard.writeText(ad.signatureBase58);
      toast({
        title: "Copied",
        description: "Signature hash copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification data...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Ad Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The political ad you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton className="mb-8" />

        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">Political Ad Verification</h1>
              <p className="text-muted-foreground">
                Cryptographically verified political advertising
              </p>
            </div>
            <Badge variant={ad.complianceChecked ? "default" : "secondary"} className="text-lg px-4 py-2">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Verified
            </Badge>
          </div>

          <Separator className="mb-6" />

          {/* Candidate Information */}
          {candidate && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Candidate Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Candidate Name</p>
                  <p className="font-medium">{candidate.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Office Sought</p>
                  <p className="font-medium">{candidate.race || candidate.officeSought || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Election Year</p>
                  <p className="font-medium">{candidate.electionYear}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Party Affiliation</p>
                  <p className="font-medium">{candidate.party || 'Independent'}</p>
                </div>
                {candidate.fecId && (
                  <div>
                    <p className="text-sm text-muted-foreground">FEC ID</p>
                    <p className="font-medium">{candidate.fecId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Verification Status</p>
                  <Badge variant={candidate.approved ? "default" : "secondary"}>
                    {candidate.approved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </div>
              {candidate.website && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(candidate.website!, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Campaign Website
                </Button>
              )}
            </div>
          )}

          <Separator className="mb-6" />

          {/* Ad Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Ad Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ad Copy</p>
                <Card className="p-4 bg-muted">
                  <p className="whitespace-pre-wrap">{ad.adCopy}</p>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Platform</p>
                  <p className="font-medium capitalize">{ad.platform}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Policy Focus</p>
                  <p className="font-medium capitalize">{ad.policyFocus || 'General'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <Badge variant={ad.published ? "default" : "secondary"}>
                    {ad.published ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Verification Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Verification Details</h2>
            <div className="space-y-4">
              {ad.signatureBase58 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Digital Signature (SHA-256)</p>
                  <div className="flex items-center gap-2">
                    <Card className="p-3 bg-muted flex-1 overflow-hidden">
                      <code className="text-xs break-all">{ad.signatureBase58}</code>
                    </Card>
                    <Button variant="outline" size="icon" onClick={copySignature}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Date Created</p>
                <p className="font-medium">
                  {new Date(ad.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {ad.publishedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Date Published</p>
                  <p className="font-medium">
                    {new Date(ad.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Watermarked Image */}
          {ad.watermarkUrl && (
            <>
              <Separator className="mb-6" />
              <div>
                <h2 className="text-xl font-semibold mb-4">Verified Ad Creative</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the QR code in the bottom-left corner to verify this ad's authenticity
                </p>
                <img
                  src={ad.watermarkUrl}
                  alt="Watermarked political ad"
                  className="w-full border"
                />
              </div>
            </>
          )}

          {/* Compliance Badge */}
          <div className="mt-8 p-4 bg-muted text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="font-semibold">This ad has been verified by xiXoi™</p>
            <p className="text-sm text-muted-foreground mt-1">
              All political ads are cryptographically signed and compliance-checked
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
