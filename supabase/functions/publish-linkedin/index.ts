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
    console.log("Publishing to LinkedIn - campaignId:", campaignId, "userId:", userId);

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
      credentials = await getCredentials(userId, "linkedin", tier);
      console.log("Retrieved LinkedIn credentials successfully");
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
      console.error("Failed to get LinkedIn credentials:", error);
      return new Response(
        JSON.stringify({ error: "Platform credentials unavailable" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = credentials.accessToken;

    // STUB RESPONSE (replace later with real LinkedIn Marketing API calls)
    const result = {
      linkedin_campaign_group_id: `li_cg_${Date.now()}`,
      linkedin_campaign_id: `li_c_${Date.now()}`,
      linkedin_creative_id: `li_creative_${Date.now()}`,
      status: "PAUSED"
    };

    // Update campaign with published info
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        platforms: { linkedin: result },
        published_at: new Date().toISOString(),
        status: "published"
      })
      .eq("id", campaignId);

    if (updateError) {
      console.error("Error updating campaign:", updateError);
    }

    console.log("LinkedIn publish successful:", result);
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Publish LinkedIn error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
