import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function GoogleConnect() {
  const navigate = useNavigate();
  const redirect = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth`;

  const connectGoogle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    const state = user.id;

    const scope = "https://www.googleapis.com/auth/adwords";

    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
        import.meta.env.VITE_GOOGLE_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(redirect)}&response_type=code` +
      `&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Connect Google Ads</h1>
      <p className="text-muted-foreground mb-6">
        Connect your Google Ads account to publish campaigns directly from xiXoi.
      </p>
      <Button onClick={connectGoogle} size="lg">
        Connect Google Ads Account
      </Button>
    </div>
  );
}
