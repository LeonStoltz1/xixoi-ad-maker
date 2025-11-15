import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePolitical } from "@/contexts/PoliticalContext";
import { PoliticalCandidateSchema, type PoliticalCandidateFormValues } from "@/schema/political";

export default function VerifyCandidate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = usePolitical();
  const [loading, setLoading] = useState(false);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const form = useForm<PoliticalCandidateFormValues>({
    resolver: zodResolver(PoliticalCandidateSchema),
    defaultValues: {
      fullName: "",
      party: "",
      race: "",
      electionYear: new Date().getFullYear(),
      website: "",
      fecId: "",
      address: "",
      officeSought: "",
      walletAddress: "",
    },
  });

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('campaign-assets')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('campaign-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function onSubmit(data: PoliticalCandidateFormValues) {
    if (!idFrontFile || !idBackFile || !selfieFile) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required verification documents.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload documents
      const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
        uploadFile(idFrontFile, 'political-verification'),
        uploadFile(idBackFile, 'political-verification'),
        uploadFile(selfieFile, 'political-verification'),
      ]);

      if (!idFrontUrl || !idBackUrl || !selfieUrl) {
        throw new Error("Failed to upload verification documents");
      }

      // Create candidate profile
      const { error: insertError } = await supabase
        .from('political_candidates')
        .insert({
          user_id: user.id,
          full_name: data.fullName,
          party: data.party || null,
          race: data.race,
          election_year: data.electionYear,
          website: data.website || null,
          fec_id: data.fecId || null,
          address: data.address,
          office_sought: data.officeSought,
          wallet_address: data.walletAddress || null,
          id_document_front_url: idFrontUrl,
          id_document_back_url: idBackUrl,
          selfie_url: selfieUrl,
          approved: false,
        });

      if (insertError) throw insertError;

      toast({
        title: "Verification Submitted",
        description: "Your candidate profile is under review. You'll be notified once approved.",
      });

      await refreshProfile();
      navigate('/political/dashboard');
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit verification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Political Candidate Verification</h1>
            <p className="text-muted-foreground">
              Complete this form to verify your identity and access Political Mode ($99/month).
              All information is encrypted and reviewed by xiXoi compliance team.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Candidate Information</h2>
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Legal Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="party"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Affiliation</FormLabel>
                        <FormControl>
                          <Input placeholder="Democratic, Republican, Independent" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="electionYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election Year *</FormLabel>
                        <FormControl>
                          <Input type="number" min={2024} max={2050} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="officeSought"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Sought *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mayor, City Council, State Senate, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="race"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Race Description *</FormLabel>
                      <FormControl>
                        <Input placeholder="US Senate - Texas, Mayor - Austin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FEC ID (if applicable)</FormLabel>
                        <FormControl>
                          <Input placeholder="C00123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crypto Wallet Address (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Document Upload */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Identity Verification Documents</h2>
                <p className="text-sm text-muted-foreground">
                  Upload clear photos of your government-issued ID and a current selfie for identity verification.
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ID Front *</label>
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                      {idFrontFile ? (
                        <div className="text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-xs">{idFrontFile.name}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Upload ID Front</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ID Back *</label>
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                      {idBackFile ? (
                        <div className="text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-xs">{idBackFile.name}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Upload ID Back</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Selfie *</label>
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                      {selfieFile ? (
                        <div className="text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-xs">{selfieFile.name}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Upload Selfie</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !idFrontFile || !idBackFile || !selfieFile}
                className="w-full"
              >
                {loading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
