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
    const code = url.searchParams.get("auth_code");
    const state = url.searchParams.get("state");

    console.log("TikTok OAuth callback - code:", !!code, "state:", state);

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    const tokenRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_code: code,
        app_id: Deno.env.get("TIKTOK_CLIENT_ID"),
        secret: Deno.env.get("TIKTOK_CLIENT_SECRET"),
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("TikTok token response:", tokenData);

    const token = tokenData?.data?.access_token;

    if (!token) {
      console.error("No token in response:", tokenData);
      return new Response("Failed to get access token", { status: 400 });
    }

    const encrypted = await encrypt(token);

    // Fetch advertiser account ID
    const accountsRes = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/",
      {
        method: "GET",
        headers: {
          "Access-Token": token,
          "Content-Type": "application/json"
        }
      }
    );

    const accountsData = await accountsRes.json();
    console.log("TikTok advertiser accounts:", accountsData);

    const advertiserId = accountsData?.data?.list?.[0]?.advertiser_id || `mock_tiktok_${Date.now()}`;

    const supabase = supabaseClient();

    const { error } = await supabase
      .from("ad_accounts")
      .upsert({
        user_id: state,
        platform: "tiktok",
        platform_account_id: advertiserId,
        access_token: encrypted
      }, {
        onConflict: 'user_id,platform,platform_account_id'
      });

    if (error) {
      console.error("Database error:", error);
      return new Response("Database error: " + error.message, { status: 500 });
    }

    console.log("TikTok account connected successfully");
    
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('/functions', '') || '';
    return Response.redirect(`${baseUrl}/dashboard?tiktok=connected`, 302);
  } catch (error) {
    console.error("TikTok OAuth error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response("Internal error: " + message, { status: 500, headers: corsHeaders });
  }
});
