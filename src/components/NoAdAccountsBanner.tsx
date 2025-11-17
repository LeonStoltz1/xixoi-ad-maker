import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function NoAdAccountsBanner() {
  return (
    <Alert className="border-foreground bg-background">
      <Info className="h-4 w-4" />
      <AlertTitle>No Setup Required</AlertTitle>
      <AlertDescription>
        xiXoi™ handles all ad platform accounts for you. You don't need to connect Meta, TikTok, 
        Google, LinkedIn, or X accounts. We run your campaigns through our verified partner accounts 
        - just upload your ad and we'll publish it across all platforms you select.
      </AlertDescription>
    </Alert>
  );
}
