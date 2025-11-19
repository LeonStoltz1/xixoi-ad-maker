import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Shield, Key, AlertCircle, CheckCircle } from "lucide-react";

interface PlatformCredential {
  id: string;
  platform: string;
  platform_account_id: string;
  account_name?: string | null;
  status: string;
}

interface PlatformHealth {
  platform: string;
  isHealthy: boolean;
  lastChecked: Date;
  error?: string;
}

const PLATFORMS = ["meta"]; // TODO: Re-enable other platforms: "google", "tiktok", "linkedin", "x"
const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds

export default function PlatformCredentialsAdmin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [platformHealth, setPlatformHealth] = useState<PlatformHealth[]>([]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin && credentials.length > 0) {
      // Initial health check
      checkPlatformHealth();
      
      // Set up continuous monitoring
      const interval = setInterval(checkPlatformHealth, HEALTH_CHECK_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [isAdmin, credentials]);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: adminCheck, error } = await supabase.rpc("is_admin", {
        _user_id: session.user.id
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

  const checkPlatformHealth = async () => {
    console.log("Running platform health check...");
    
    const healthResults: PlatformHealth[] = [];

    for (const platform of PLATFORMS) {
      try {
        // Only check platforms that have credentials configured
        const hasCred = credentials.some(c => c.platform === platform && c.status === "connected");
        
        if (!hasCred) {
          healthResults.push({
            platform,
            isHealthy: false,
            lastChecked: new Date(),
            error: "No credentials configured"
          });
          continue;
        }

        // Platform-specific health checks
        let isHealthy = false;
        let error: string | undefined;

        if (platform === "meta") {
          const { data, error: testError } = await supabase.functions.invoke("test-meta-connection");
          isHealthy = !testError && data?.success === true;
          error = testError?.message || data?.error;
        } else if (platform === "google") {
          const { data, error: testError } = await supabase.functions.invoke("test-google-connection");
          isHealthy = !testError && data?.success === true;
          error = testError?.message || data?.error;
        } else {
          // For other platforms, just verify credentials exist
          isHealthy = true;
        }

        healthResults.push({
          platform,
          isHealthy,
          lastChecked: new Date(),
          error
        });

      } catch (err: any) {
        healthResults.push({
          platform,
          isHealthy: false,
          lastChecked: new Date(),
          error: err.message || "Health check failed"
        });
      }
    }

    setPlatformHealth(healthResults);
    
    // Show toast for any unhealthy platforms
    const unhealthy = healthResults.filter(h => !h.isHealthy);
    if (unhealthy.length > 0) {
      console.error("Unhealthy platforms detected:", unhealthy.map(h => h.platform).join(", "));
    }
  };

  const getPlatformHealth = (platform: string): PlatformHealth | undefined => {
    return platformHealth.find(h => h.platform === platform);
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              <h1 className="text-3xl font-bold">Platform API Status</h1>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/admin/test-meta">
                  Test Meta Publishing
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/seed-data">
                  Seed Test Data
                </Link>
              </Button>
            </div>
          </div>
          <p className="text-foreground/80 mb-4">
            Monitoring system-owned master account credentials for <strong>Quick-Start tier</strong> users.
          </p>
          <div className="p-4 border-2 border-black bg-background">
            <p className="text-sm font-medium mb-2">🔄 Continuous Monitoring Active</p>
            <p className="text-sm text-foreground/70">
              Platform APIs are automatically checked every 60 seconds. Errors are displayed below when detected.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((platform) => {
            const cred = credentials.find(c => c.platform === platform);
            const health = getPlatformHealth(platform);
            const hasError = health && !health.isHealthy;

            return (
              <Card 
                key={platform} 
                className={`border-2 ${hasError ? 'border-red-500 bg-red-50/50' : 'border-black'}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5" />
                      <div>
                        <CardTitle className="capitalize text-xl">{platform}</CardTitle>
                        <CardDescription className="text-xs">
                          {cred?.account_name || "System Account"}
                        </CardDescription>
                      </div>
                    </div>
                    {health && (
                      health.isHealthy ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/70">Status:</span>
                      <Badge 
                        variant={cred?.status === "connected" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {cred?.status || "not configured"}
                      </Badge>
                    </div>

                    {cred && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground/70">Account ID:</span>
                        <span className="text-xs font-mono">{cred.platform_account_id}</span>
                      </div>
                    )}

                    {health && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground/70">Last Check:</span>
                        <span className="text-xs">{health.lastChecked.toLocaleTimeString()}</span>
                      </div>
                    )}

                    {hasError && health?.error && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
                        <p className="text-xs text-red-800 font-medium">⚠️ API Error</p>
                        <p className="text-xs text-red-700 mt-1">{health.error}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-4 border-2 border-black bg-background">
          <p className="text-sm font-medium mb-2">ℹ️ Note</p>
          <p className="text-sm text-foreground/70">
            Free tier has no publish capability. Pro/Elite/Agency users connect their own OAuth accounts (not these master credentials).
          </p>
        </div>
      </div>
    </div>
  );
}
