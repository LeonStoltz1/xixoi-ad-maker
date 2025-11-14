import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdPlatformDashboard() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await (supabase as any)
      .from("ad_accounts")
      .select("*")
      .eq("user_id", user.id);
    
    setAccounts(data ?? []);
    setLoading(false);
  };

  const isConnected = (platform: string) =>
    accounts.some((acc) => acc.platform === platform && acc.status === "connected");

  const platforms = [
    { id: "meta", name: "Meta (Facebook)", route: "/connect/meta" },
    { id: "google", name: "Google Ads", route: "/connect/google" },
    { id: "tiktok", name: "TikTok Ads", route: "/connect/tiktok" },
    { id: "linkedin", name: "LinkedIn Ads", route: "/connect/linkedin" }
  ];

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Ad Platform Connections</h1>
      <p className="text-muted-foreground mb-8">
        Connect your advertising accounts to publish campaigns across platforms
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => {
          const connected = isConnected(platform.id);
          return (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{platform.name}</CardTitle>
                  <Badge variant={connected ? "default" : "secondary"}>
                    {connected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <CardDescription>
                  {connected
                    ? "Your account is connected and ready to publish"
                    : "Connect your account to start publishing campaigns"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!connected && (
                  <Button onClick={() => navigate(platform.route)}>
                    Connect {platform.name}
                  </Button>
                )}
                {connected && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Account connected successfully
                    </p>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
