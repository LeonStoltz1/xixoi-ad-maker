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

      if (!res.ok) {
        throw new Error("Failed to publish campaign");
      }

      const result = await res.json();
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
    </Dialog>
  );
}
