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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: adminCheck, error } = await supabase.rpc("is_admin", {
        _user_id: user.id
      });

      if (error) throw error;

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
      const { error: updateError } = await supabase
        .from("platform_credentials")
        .update({
          access_token: encryptedData.encrypted,
          updated_at: new Date().toISOString()
        })
        .eq("platform", platform)
        .eq("owner_type", "system");

      if (updateError) throw updateError;

      toast.success(`${platform} token updated successfully`);
      await loadCredentials();
    } catch (error) {
      console.error("Token update error:", error);
      toast.error(`Failed to update ${platform} token`);
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
      <div className="container mx-auto p-6 pt-40">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-3xl font-bold">Platform Credentials</h1>
          </div>
          <p className="text-muted-foreground">
            Manage master ad platform credentials for xiXoi™ system accounts
          </p>
        </div>

        <div className="grid gap-6">
          {credentials.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Credentials Configured</CardTitle>
                <CardDescription>
                  No system platform credentials have been set up yet.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            credentials.map((cred) => (
              <Card key={cred.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {cred.platform.toUpperCase()}
                        <Badge variant={cred.status === "connected" ? "default" : "secondary"}>
                          {cred.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Account ID: {cred.platform_account_id}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateToken(cred.platform)}
                      disabled={updating === cred.platform}
                    >
                      {updating === cred.platform ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                      <span className="ml-2">Update Token</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(cred.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>{" "}
                      {new Date(cred.updated_at).toLocaleDateString()}
                    </div>
                    {cred.expires_at && (
                      <div>
                        <span className="font-medium">Expires:</span>{" "}
                        {new Date(cred.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Security Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All tokens are encrypted at rest using AES-256-GCM encryption. Tokens are only
              decrypted when needed by edge functions to make API calls to ad platforms. Never
              share or expose these credentials.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
