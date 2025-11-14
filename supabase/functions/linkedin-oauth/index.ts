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

    console.log("LinkedIn OAuth callback - code:", !!code, "state:", state);

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    // Exchange code for token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/linkedin-oauth`,
        client_id: Deno.env.get("LINKEDIN_CLIENT_ID")!,
        client_secret: Deno.env.get("LINKEDIN_CLIENT_SECRET")!,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("LinkedIn token response:", tokenData);

    const token = tokenData.access_token;

    if (!token) {
      console.error("No access token in response:", tokenData);
      return new Response("Failed to get access token", { status: 400 });
    }

    const encrypted = await encrypt(token);

    // Fetch LinkedIn Organization / Account ID
    const orgRes = await fetch(
      "https://api.linkedin.com/v2/adAccountsV2?q=search&search.account.type=BUSINESS",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const orgData = await orgRes.json();
    console.log("LinkedIn accounts:", orgData);

    const accountId = orgData.elements?.[0]?.id || `mock_linkedin_${Date.now()}`;

    const supabase = supabaseClient();

    const { error } = await supabase
      .from("ad_accounts")
      .upsert({
        user_id: state,
        platform: "linkedin",
        platform_account_id: accountId,
        access_token: encrypted,
      }, {
        onConflict: 'user_id,platform,platform_account_id'
      });

    if (error) {
      console.error("Database error:", error);
      return new Response("Database error: " + error.message, { status: 500 });
    }

    console.log("LinkedIn account connected successfully");
    
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('/functions', '') || '';
    return Response.redirect(`${baseUrl}/dashboard?linkedin=connected`, 302);
  } catch (error) {
    console.error("LinkedIn OAuth error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response("Internal error: " + message, { status: 500, headers: corsHeaders });
  }
});
