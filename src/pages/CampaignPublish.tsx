import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PublishModal } from "@/components/PublishModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CampaignPublish() {
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">Campaign not found</h1>
      </div>
    );
  }

  const platforms = [
    { id: "meta", name: "Meta (Facebook)" },
    { id: "google", name: "Google Ads" },
    { id: "tiktok", name: "TikTok Ads" },
    { id: "linkedin", name: "LinkedIn Ads" }
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-2">Publish Campaign</h1>
      <p className="text-muted-foreground mb-8">
        Choose which platforms to publish your campaign to
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <Card key={platform.id}>
            <CardHeader>
              <CardTitle>{platform.name}</CardTitle>
              <CardDescription>
                Publish your campaign to {platform.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setOpen(platform.id)}>
                Publish to {platform.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {open && (
        <PublishModal
          platform={open}
          campaignId={id}
          open={!!open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
