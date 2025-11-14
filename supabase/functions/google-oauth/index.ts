import { supabaseClient } from "../_shared/supabase.ts";
import { encrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    console.log("Google OAuth callback - code:", !!code, "state:", state);

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    // Exchange code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-oauth`,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenRes.json();
    console.log("Google token response:", tokenData);

    if (!tokenData.access_token) {
      console.error("No access token in response:", tokenData);
      return new Response("Failed to get access token", { status: 400 });
    }

    const { access_token, refresh_token } = tokenData;

    // For now, use a mock customer ID. In production, fetch from Google Ads API
    const customerId = "mock_customer_" + Date.now();

    const encryptedToken = await encrypt(access_token);
    const encryptedRefresh = refresh_token ? await encrypt(refresh_token) : null;

    const supabase = supabaseClient();

    const { error } = await supabase
      .from("ad_accounts")
      .upsert({
        user_id: state,
        platform: "google",
        platform_account_id: customerId,
        access_token: encryptedToken,
        refresh_token: encryptedRefresh,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      }, {
        onConflict: 'user_id,platform,platform_account_id'
      });

    if (error) {
      console.error("Database error:", error);
      return new Response("Database error: " + error.message, { status: 500 });
    }

    console.log("Google account connected successfully");
    
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('/functions', '') || '';
    return Response.redirect(`${baseUrl}/dashboard?google=connected`, 302);
  } catch (error) {
    console.error("Google OAuth error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response("Internal error: " + message, { status: 500, headers: corsHeaders });
  }
});
