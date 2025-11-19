import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Shield, Key, RefreshCw } from "lucide-react";

interface PlatformCredential {
  id: string;
  platform: string;
  platform_account_id: string;
  account_name?: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function PlatformCredentialsAdmin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Wait for auth session to be fully loaded
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: adminCheck, error } = await supabase.rpc("is_admin", {
        _user_id: session.user.id
      });

      if (error) {
        console.error("RPC error:", error);
        throw error;
      }

      if (!adminCheck) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadCredentials();
    } catch (error) {
      console.error("Admin check error:", error);
      toast.error("Failed to verify admin access");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_credentials")
        .select("*")
        .eq("owner_type", "system")
        .order("platform");

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error("Failed to load credentials:", error);
      toast.error("Failed to load platform credentials");
    }
  };

  const handleUpdateToken = async (platform: string) => {
    const accessToken = prompt(`Enter new access token for ${platform}:`);
    if (!accessToken) return;

    let accountId = "";
    let pageId = "";

    // For Meta, also ask for account ID and page ID
    if (platform === "meta") {
      accountId = prompt("Enter Meta Ad Account ID (numbers only, no 'act_' prefix):") || "";
      pageId = prompt("Enter Facebook Page ID:") || "";
      
      if (!accountId || !pageId) {
        toast.error("Meta requires both Ad Account ID and Page ID");
        return;
      }
    }

    setUpdating(platform);

    try {
      // Encrypt the token
      const { data: encryptedData, error: encryptError } = await supabase.functions.invoke(
        "encrypt-master-token",
        {
          body: { token: accessToken }
        }
      );

      if (encryptError) throw encryptError;

      // Update the credential
      const updateData: any = {
        access_token: encryptedData.encrypted,
        updated_at: new Date().toISOString(),
        status: 'connected'
      };

      if (platform === "meta") {
        updateData.platform_account_id = accountId;
        updateData.account_name = pageId; // Temporarily using account_name for page_id
      }

      const { error: updateError } = await supabase
        .from("platform_credentials")
        .upsert({
          platform,
          owner_type: "system",
          ...updateData
        }, {
          onConflict: "platform,owner_type"
        });

      if (updateError) throw updateError;

      toast.success(`${platform} credentials saved successfully`);
      await loadCredentials();
    } catch (error) {
      console.error("Token update error:", error);
      toast.error(`Failed to update ${platform} token`);
    } finally {
      setUpdating(null);
    }
  };

  const handleTestMeta = async () => {
    setUpdating("meta-test");
    try {
      const { data, error } = await supabase.functions.invoke("test-meta-publish");
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(
          `Meta test successful! Campaign ID: ${data.campaign_id}`,
          { description: data.instructions }
        );
      } else {
        toast.error(data.error || "Test failed");
      }
    } catch (error: any) {
      console.error("Test error:", error);
      toast.error(error.message || "Failed to test Meta credentials");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 pt-40">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 pt-40 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-3xl font-bold">Master Platform Credentials</h1>
          </div>
          <p className="text-foreground/80 mb-4">
            Manage system-owned master account OAuth tokens for Quick-Start tier users. These credentials power all Quick-Start ad publishing.
          </p>
          <div className="p-4 border-2 border-black bg-background">
            <p className="text-sm font-medium mb-2">⚠️ Critical Setup Required</p>
            <p className="text-sm text-foreground/70">
              All 5 platforms must have valid tokens with "connected" status before Quick-Start tier can publish ads. Update any "pending" credentials below.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {credentials.length === 0 ? (
            <Card className="col-span-2 border-2 border-black">
              <CardHeader>
                <CardTitle>No Credentials Configured</CardTitle>
                <CardDescription>
                  No system platform credentials have been set up yet.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            credentials.map((cred) => (
              <Card key={cred.id} className="border-2 border-black">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5" />
                      <div>
                        <CardTitle className="capitalize text-xl">{cred.platform}</CardTitle>
                        <CardDescription className="text-xs">
                          System Master Account
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={cred.status === "connected" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {cred.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Account ID:</span>
                      <span className="font-mono text-xs">{cred.platform_account_id || "Not set"}</span>
                    </div>
                    {cred.platform === "meta" && cred.account_name && (
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Page ID:</span>
                        <span className="font-mono text-xs">{cred.account_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Last Updated:</span>
                      <span>{new Date(cred.updated_at).toLocaleDateString()}</span>
                    </div>
                    {cred.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Token Expires:</span>
                        <span>{new Date(cred.expires_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleUpdateToken(cred.platform)}
                    disabled={updating === cred.platform}
                    className="w-full"
                    variant={cred.status === "pending" ? "default" : "outline"}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${updating === cred.platform ? 'animate-spin' : ''}`} />
                    {updating === cred.platform ? "Updating..." : cred.status === "pending" ? "Add Token" : "Update Token"}
                  </Button>
                  
                  {/* Test button for Meta when connected */}
                  {cred.platform === "meta" && cred.status === "connected" && (
                    <Button
                      onClick={handleTestMeta}
                      disabled={updating === "meta-test"}
                      className="w-full mt-2"
                      variant="secondary"
                    >
                      {updating === "meta-test" ? "Testing..." : "🚀 Test Meta Publish"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="mt-8 p-6 border-2 border-black bg-background">
          <h3 className="font-semibold mb-2">🔒 Security Notice</h3>
          <p className="text-sm text-foreground/70 mb-3">
            All tokens are encrypted using AES-256-GCM before storage. Only the service role can decrypt and use these credentials for publishing Quick-Start user campaigns.
          </p>
          <p className="text-sm text-foreground/70">
            <strong>Pro/Elite/Agency users</strong> connect their own OAuth accounts and never use these master credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
