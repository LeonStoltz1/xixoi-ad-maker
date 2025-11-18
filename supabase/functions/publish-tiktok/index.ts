import { supabaseClient } from "../_shared/supabase.ts";
import { getCredentials } from "../_shared/credentials.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, userId } = await req.json();
    console.log("Publishing to TikTok - campaignId:", campaignId, "userId:", userId);

    const supabase = supabaseClient();

    // Fetch user tier
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "PROFILE_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tier = profile.plan;

    // Get credentials (hybrid routing: master OR user)
    let credentials;
    try {
      credentials = await getCredentials(userId, "tiktok", tier);
      console.log("Retrieved TikTok credentials successfully");
    } catch (error: any) {
      if (error.message.includes("OAUTH_REQUIRED")) {
        return new Response(
          JSON.stringify({
            error: "OAUTH_REQUIRED",
            message: error.message,
            connectUrl: "/connect-platforms"
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error("Failed to get TikTok credentials:", error);
      return new Response(
        JSON.stringify({ error: "Platform credentials unavailable" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = credentials.accessToken;

    // STUB RESPONSE (replace later with real TikTok Marketing API calls)
    const result = {
      tiktok_campaign_id: `tt_${Date.now()}`,
      tiktok_adgroup_id: `tt_ag_${Date.now()}`,
      tiktok_ad_id: `tt_ad_${Date.now()}`,
      status: "PENDING"
    };

    // Update campaign with published info
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        platforms: { tiktok: result },
        published_at: new Date().toISOString(),
        status: "published"
      })
      .eq("id", campaignId);

    if (updateError) {
      console.error("Error updating campaign:", updateError);
    }

    console.log("TikTok publish successful:", result);
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Publish TikTok error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
