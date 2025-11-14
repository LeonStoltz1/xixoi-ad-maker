import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LinkedInConnect() {
  const navigate = useNavigate();
  const redirect = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-oauth`;

  const connectLinkedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    const state = user.id;

    const scope = [
      "r_ads",
      "rw_ads",
      "r_campaigns",
      "rw_campaigns",
      "r_organization",
      "r_organization_social"
    ].join(" ");

    window.location.href =
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${
        import.meta.env.VITE_LINKEDIN_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(scope)}` +
      `&state=${state}`;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Connect LinkedIn Ads</h1>
      <p className="text-muted-foreground mb-6">
        Connect your LinkedIn Ads account to publish campaigns directly from xiXoi.
      </p>
      <Button onClick={connectLinkedIn} size="lg">
        Connect LinkedIn Ads Account
      </Button>
    </div>
  );
}
