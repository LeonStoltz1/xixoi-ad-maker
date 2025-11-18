import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PublishModalProps {
  campaignId: string;
  platform: string;
  open: boolean;
  onClose: () => void;
}

export function PublishModal({ campaignId, platform, open, onClose }: PublishModalProps) {
  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const publish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to publish");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-${platform}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ campaignId, userId: user.id })
        }
      );

      const result = await res.json();

      if (!res.ok || result.error) {
        if (result.error === "OAUTH_REQUIRED") {
          setShowConnectModal(true);
          return;
        }
        throw new Error(result.error || "Failed to publish campaign");
      }
      console.log("Publish result:", result);
      
      toast.success(`Campaign published to ${platform}!`);
      onClose();
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(`Failed to publish to ${platform}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish to {platform}</DialogTitle>
          <DialogDescription>
            This will publish your campaign to {platform}. Make sure your ad account is connected.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={publish} disabled={loading}>
            {loading ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-background p-6 max-w-md w-full mx-4 border-2 border-border">
            <h2 className="text-xl font-bold mb-2">Connect Your Ad Account</h2>
            <p className="text-sm text-muted-foreground mb-4">
              To publish from your Pro/Agency tier, you need to connect your {platform.toUpperCase()} account first.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConnectModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => (window.location.href = "/connect-platforms")}
                className="flex-1"
              >
                Connect Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
