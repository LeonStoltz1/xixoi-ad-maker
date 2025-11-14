import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Zap, DollarSign, Settings } from "lucide-react";
import { toast } from "sonner";

export default function PayoutSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zapierWebhook, setZapierWebhook] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roles } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roles?.some((r: any) => r.role === 'admin')) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }

    setUser(user);
    setLoading(false);
  };

  const handleTestWebhook = async () => {
    if (!zapierWebhook) {
      toast.error("Please enter a Zapier webhook URL first");
      return;
    }

    setTestingWebhook(true);
    try {
      const response = await fetch(zapierWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          event: "test_webhook",
          timestamp: new Date().toISOString(),
          message: "This is a test from xiXoi Payout Settings"
        })
      });

      toast.success("Test webhook sent! Check your Zapier history to confirm.");
    } catch (error) {
      console.error("Webhook test error:", error);
      toast.error("Failed to send test webhook");
    } finally {
      setTestingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Settings className="w-10 h-10 text-primary" />
            Payout Automation Settings
          </h1>
          <p className="text-muted-foreground">
            Configure automatic monthly payouts and notifications
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">Automatic Payouts Active</div>
                <div className="text-sm text-muted-foreground">
                  Next payout: 1st of next month at 9:00 AM UTC
                </div>
              </div>
              <Badge className="bg-green-500">Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              How Automatic Payouts Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <div className="font-medium">Monthly Schedule</div>
                  <div className="text-sm text-muted-foreground">
                    System runs automatically on the 1st of every month at 9:00 AM UTC
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <div className="font-medium">Automatic Calculations</div>
                  <div className="text-sm text-muted-foreground">
                    Calculates 30% affiliate commission + 10% agency bonus for all active subscriptions
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <div className="font-medium">Direct Bank Transfers</div>
                  <div className="text-sm text-muted-foreground">
                    Transfers funds via Stripe Connect to all affiliates with Stripe accounts
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <div className="font-medium">Records Everything</div>
                  <div className="text-sm text-muted-foreground">
                    Updates payout dashboard with complete records for tax reporting
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zapier Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Zapier Integration (Optional)
            </CardTitle>
            <CardDescription>
              Get notified when monthly payouts run via Slack, email, or any app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zapier-webhook">Zapier Webhook URL</Label>
              <Input
                id="zapier-webhook"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={zapierWebhook}
                onChange={(e) => setZapierWebhook(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                To set up: 1) Create a Zap in Zapier 2) Use "Webhooks by Zapier" as trigger 
                3) Copy the webhook URL here
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleTestWebhook}
                disabled={!zapierWebhook || testingWebhook}
              >
                {testingWebhook ? "Sending..." : "Test Webhook"}
              </Button>
              <Button
                onClick={() => {
                  // In production, this would save to database
                  toast.success("Webhook URL saved! (Demo mode)");
                }}
                disabled={!zapierWebhook}
              >
                Save Webhook URL
              </Button>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2">Webhook Data Sent:</div>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`{
  "event": "monthly_payouts_completed",
  "month": "2025-01",
  "totalPayout": 5643.20,
  "totalAffiliatePayout": 4250.00,
  "totalAgencyBonus": 1393.20,
  "affiliateCount": 42,
  "timestamp": "2025-01-01T09:00:00Z"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Button variant="outline" onClick={() => navigate("/payouts")}>
            View Payout Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
