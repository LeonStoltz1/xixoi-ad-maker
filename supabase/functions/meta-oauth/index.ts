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

    console.log("Meta OAuth callback - code:", !!code, "state:", state);

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    // Exchange code for token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${
        Deno.env.get("META_APP_ID")
      }&client_secret=${
        Deno.env.get("META_APP_SECRET")
      }&code=${code}&redirect_uri=${
        Deno.env.get("SUPABASE_URL")
      }/functions/v1/meta-oauth`
    );

    const tokenData = await tokenRes.json();
    console.log("Meta token response:", tokenData);

    if (!tokenData.access_token) {
      console.error("No access token in response:", tokenData);
      return new Response("Failed to get access token", { status: 400 });
    }

    const access_token = tokenData.access_token;

    // Fetch ad accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v20.0/me/adaccounts?access_token=${access_token}`
    );
    const accountsData = await accountsRes.json();
    console.log("Meta ad accounts:", accountsData);

    const firstAccount = accountsData.data?.[0]?.id;

    if (!firstAccount) {
      console.error("No ad accounts found");
      return new Response("No ad accounts found", { status: 400 });
    }

    const encrypted = await encrypt(access_token);

    const supabase = supabaseClient();

    const { error } = await supabase
      .from("ad_accounts")
      .upsert({
        user_id: state,
        platform: "meta",
        platform_account_id: firstAccount,
        access_token: encrypted,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        onConflict: 'user_id,platform,platform_account_id'
      });

    if (error) {
      console.error("Database error:", error);
      return new Response("Database error: " + error.message, { status: 500 });
    }

    console.log("Meta account connected successfully");
    
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('/functions', '') || '';
    return Response.redirect(`${baseUrl}/dashboard?meta=connected`, 302);
  } catch (error) {
    console.error("Meta OAuth error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response("Internal error: " + message, { status: 500, headers: corsHeaders });
  }
});
