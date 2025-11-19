import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

export default function TestMetaPublish() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
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

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Create test campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: `[TEST] Meta Publish Test ${new Date().toISOString()}`,
          status: "draft",
          daily_budget: 20,
          target_location: "United States",
          landing_url: "https://xixoi.com",
        })
        .select()
        .single();

      if (campaignError || !campaign) {
        throw new Error(`Failed to create test campaign: ${campaignError?.message}`);
      }

      // Create test asset
      const { error: assetError } = await supabase
        .from("campaign_assets")
        .insert({
          campaign_id: campaign.id,
          asset_type: "image",
          asset_url: "https://via.placeholder.com/1200x628.png?text=Test+Ad",
        });

      if (assetError) {
        throw new Error(`Failed to create test asset: ${assetError.message}`);
      }

      // Create test variant
      const { data: variant, error: variantError } = await supabase
        .from("ad_variants")
        .insert({
          campaign_id: campaign.id,
          variant_type: "meta",
          headline: "Test Ad Headline",
          body_copy: "This is a test ad to verify Meta publishing works with Quick-Start tier credentials.",
          cta_text: "Learn More",
          creative_url: "https://via.placeholder.com/1200x628.png?text=Test+Ad",
        })
        .select()
        .single();

      if (variantError || !variant) {
        throw new Error(`Failed to create test variant: ${variantError?.message}`);
      }

      // Call publish-meta function
      console.log("Calling publish-meta with campaignId:", campaign.id);
      const { data: publishResult, error: publishError } = await supabase.functions.invoke(
        "publish-meta",
        {
          body: {
            campaignId: campaign.id,
            userId: user.id,
          },
        }
      );

      if (publishError) {
        throw new Error(`Publish failed: ${publishError.message}`);
      }

      if (publishResult?.error) {
        throw new Error(`Publish returned error: ${publishResult.error}`);
      }

      setTestResult({
        success: true,
        message: "✅ Meta publishing test successful! Master credentials are working.",
        details: {
          campaignId: campaign.id,
          metaCampaignId: publishResult?.metaCampaignId,
          metaAdSetId: publishResult?.metaAdSetId,
          metaAdId: publishResult?.metaAdId,
        },
      });

      toast.success("Meta publish test successful!");

      // Clean up test campaign after 5 seconds
      setTimeout(async () => {
        await supabase.from("campaigns").delete().eq("id", campaign.id);
        console.log("Test campaign cleaned up");
      }, 5000);

    } catch (error: any) {
      console.error("Test failed:", error);
      setTestResult({
        success: false,
        message: `❌ Test failed: ${error.message}`,
        details: error,
      });
      toast.error("Meta publish test failed");
    } finally {
      setTesting(false);
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
            <CardTitle>Test Meta Publishing</CardTitle>
            <CardDescription>
              Verify that Meta publishing works with Quick-Start tier master credentials.
              This will create a test campaign, publish it to Meta, and then clean it up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                <strong>What this test does:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Creates a temporary test campaign in the database</li>
                  <li>Generates a test ad variant with placeholder content</li>
                  <li>Calls the publish-meta edge function with test data</li>
                  <li>Verifies the master credentials authenticate successfully</li>
                  <li>Confirms the Meta API accepts the campaign/ad creation</li>
                  <li>Auto-deletes the test campaign after 5 seconds</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-4">
              <Button
                onClick={runTest}
                disabled={testing}
                size="lg"
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  "Run Meta Publishing Test"
                )}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? "border-green-500" : "border-red-500"}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">{testResult.message}</p>
                      {testResult.details && (
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Prerequisites for this test to pass:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>META_ACCESS_TOKEN secret configured</li>
                <li>META_AD_ACCOUNT_ID secret configured</li>
                <li>META_PAGE_ID secret configured (if required)</li>
                <li>Master credentials stored in platform_credentials table</li>
                <li>Meta Business Manager has active ad account</li>
                <li>Token has proper permissions (ads_management)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
