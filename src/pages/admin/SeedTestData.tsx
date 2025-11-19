import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Trash2 } from "lucide-react";

export default function SeedTestData() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [count, setCount] = useState(5);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
    campaigns?: any[];
    totalVariants?: number;
  } | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.rpc("is_admin", { _user_id: user.id });
      
      if (error || !data) {
        toast.error("Access denied: Admin only");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Admin check failed:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Calling seed-test-campaigns function...");
      const { data, error } = await supabase.functions.invoke("seed-test-campaigns", {
        body: { userId: user.id, count },
      });

      if (error) {
        throw new Error(`Seed failed: ${error.message}`);
      }

      setSeedResult(data);
      toast.success(`Created ${data.campaigns?.length || 0} test campaigns!`);
    } catch (error: any) {
      console.error("Seed failed:", error);
      setSeedResult({
        success: false,
        message: error.message,
      });
      toast.error("Failed to seed test data");
    } finally {
      setSeeding(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Delete all test campaigns (those starting with [TEST])
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("user_id", user.id)
        .like("name", "[TEST]%");

      if (error) {
        throw new Error(`Cleanup failed: ${error.message}`);
      }

      toast.success("All test campaigns cleaned up!");
      setSeedResult(null);
    } catch (error: any) {
      console.error("Cleanup failed:", error);
      toast.error("Failed to clean up test data");
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 pt-32 pb-16 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/platform-credentials")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Platform Credentials
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Seed Test Campaign Data</CardTitle>
            <CardDescription>
              Generate comprehensive test campaigns with all variant types (static, video, ugc, meta, tiktok, google, linkedin) for testing platform publishing flows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                <strong>What this tool does:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Creates realistic test campaigns with proper names and targeting</li>
                  <li>Generates 7 variants per campaign (one for each variant type)</li>
                  <li>Includes test assets (placeholder images) for each campaign</li>
                  <li>Adds platform-specific copy optimized for character limits</li>
                  <li>Tags all campaigns with [TEST] prefix for easy identification</li>
                  <li>Provides A/B testing variant sets for testing split flows</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="count">Number of campaigns to create</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  disabled={seeding}
                />
                <p className="text-xs text-muted-foreground">
                  Each campaign will have 7 variants (one per type) = {count * 7} total variants
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSeed}
                  disabled={seeding || cleaning}
                  className="flex-1"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Test Data...
                    </>
                  ) : (
                    "Create Test Campaigns"
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleCleanup}
                  disabled={seeding || cleaning}
                >
                  {cleaning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clean Up All Test Data
                    </>
                  )}
                </Button>
              </div>

              {seedResult && (
                <Alert className={seedResult.success ? "border-green-500" : "border-red-500"}>
                  <div className="flex items-start gap-3">
                    {seedResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">{seedResult.message}</p>
                      {seedResult.campaigns && (
                        <div className="text-sm space-y-1">
                          <p className="font-medium">Created campaigns:</p>
                          <ul className="list-disc list-inside ml-2">
                            {seedResult.campaigns.map((c: any) => (
                              <li key={c.id}>
                                {c.name} ({c.variants} variants)
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2">
                            <strong>Total variants:</strong> {seedResult.totalVariants}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Campaign templates included:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>E-commerce Product Launch</li>
                <li>Local Restaurant Promotion</li>
                <li>SaaS Free Trial Campaign</li>
                <li>Fitness App Download</li>
                <li>Real Estate Open House</li>
              </ul>
              <p className="mt-4"><strong>Variant types generated:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>static</strong> - Standard image ad</li>
                <li><strong>video</strong> - Video ad format</li>
                <li><strong>ugc</strong> - User-generated content style</li>
                <li><strong>meta</strong> - Meta-optimized (40 char headline, 125 char body)</li>
                <li><strong>tiktok</strong> - TikTok-optimized (100 char)</li>
                <li><strong>google</strong> - Google Ads-optimized (30 char headline, 90 char desc)</li>
                <li><strong>linkedin</strong> - LinkedIn-optimized (150 char)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
