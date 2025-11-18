import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

type Platform = "meta" | "google" | "tiktok" | "linkedin" | "x";

const PLATFORMS: { id: Platform; name: string; description: string }[] = [
  { id: "meta", name: "Meta (Facebook/Instagram)", description: "Connect your Facebook Business Manager" },
  { id: "google", name: "Google Ads", description: "Connect your Google Ads account" },
  { id: "tiktok", name: "TikTok Ads", description: "Connect your TikTok Business account" },
  { id: "linkedin", name: "LinkedIn Ads", description: "Connect your LinkedIn Campaign Manager" },
  { id: "x", name: "X (Twitter)", description: "Connect your X Ads account" },
];

export default function ConnectPlatforms() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Record<Platform, boolean>>({
    meta: false,
    google: false,
    tiktok: false,
    linkedin: false,
    x: false,
  });
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      toast.success(`${success.toUpperCase()} connected successfully!`);
      loadConnections();
    }

    if (error) {
      toast.error(`Failed to connect ${error.toUpperCase()}. Please try again.`);
    }
  }, [searchParams]);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      setUserPlan(profile?.plan || "free");

      const { data: credentials } = await supabase
        .from("platform_credentials")
        .select("platform, status")
        .eq("owner_id", user.id)
        .eq("owner_type", "user");

      const connected: Record<string, boolean> = {};
      credentials?.forEach((cred: any) => {
        connected[cred.platform] = cred.status === "connected";
      });

      setConnections(connected as any);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: Platform) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const stateObj: any = { userId: user.id };

    if (platform === "x") {
      const codeVerifier = crypto.randomUUID().replace(/-/g, "");
      stateObj.codeVerifier = codeVerifier;
    }

    const state = btoa(JSON.stringify(stateObj));
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const urls: Record<Platform, string> = {
      meta: `https://www.facebook.com/v20.0/dialog/oauth?${new URLSearchParams({
        client_id: import.meta.env.VITE_META_APP_ID || "",
        redirect_uri: `${supabaseUrl}/functions/v1/meta-oauth-callback`,
        state,
        scope: "ads_management,business_management",
        response_type: "code",
      })}`,
      google: `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        redirect_uri: `${supabaseUrl}/functions/v1/google-oauth-callback`,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/adwords",
        access_type: "offline",
        prompt: "consent",
        state,
      })}`,
      tiktok: `https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize?${new URLSearchParams({
        app_id: import.meta.env.VITE_TIKTOK_CLIENT_KEY || "",
        redirect_uri: `${supabaseUrl}/functions/v1/tiktok-oauth-callback`,
        state,
      })}`,
      linkedin: `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
        response_type: "code",
        client_id: import.meta.env.VITE_LINKEDIN_CLIENT_ID || "",
        redirect_uri: `${supabaseUrl}/functions/v1/linkedin-oauth-callback`,
        scope: "rw_organization_admin openid profile email",
        state,
      })}`,
      x: `https://twitter.com/i/oauth2/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: import.meta.env.VITE_X_CLIENT_ID || "",
        redirect_uri: import.meta.env.VITE_X_REDIRECT_URI || "",
        scope: "tweet.read tweet.write users.read offline.access",
        state,
        code_challenge_method: "plain",
        code_challenge: stateObj.codeVerifier || "",
      })}`,
    };

    window.location.href = urls[platform];
  };

  const handleDisconnect = async (platform: Platform) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("platform_credentials")
      .delete()
      .eq("owner_id", user.id)
      .eq("platform", platform);

    if (error) {
      toast.error(`Failed to disconnect ${platform.toUpperCase()}`);
      return;
    }

    toast.success(`${platform.toUpperCase()} disconnected`);
    loadConnections();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading connections...</p>
        </div>
      </div>
    );
  }

  const needsUpgrade = userPlan === "quickstart" || userPlan === "free";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-[720px] mx-auto px-6 pt-40 pb-20">
        <h1 className="text-3xl font-bold mb-2">Connected Ad Accounts</h1>
        <p className="text-muted-foreground mb-8">
          {needsUpgrade
            ? "Upgrade to Pro to connect your own ad accounts and publish without spending limits."
            : "Connect your ad accounts to publish campaigns directly to your platforms."}
        </p>

        {needsUpgrade && (
          <Card className="mb-8 border-2 border-border">
            <CardHeader>
              <CardTitle>⚡ Upgrade Required</CardTitle>
              <CardDescription>
                Quick-Start tier uses xiXoi's master accounts. Upgrade to Pro ($149/mo) to connect your own accounts and remove all spending limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} className="w-full">
                View Pro Plans
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {PLATFORMS.map((platform) => (
            <Card key={platform.id} className="border border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                    <CardDescription>{platform.description}</CardDescription>
                  </div>
                  {connections[platform.id] && (
                    <Badge variant="default" className="bg-green-600">
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {connections[platform.id] ? (
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect(platform.id)}
                    disabled={needsUpgrade}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(platform.id)}
                    disabled={needsUpgrade}
                  >
                    Connect {platform.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
