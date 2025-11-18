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
    console.log("Publishing to Meta - campaignId:", campaignId, "userId:", userId);

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
      credentials = await getCredentials(userId, "meta", tier);
      console.log("Retrieved Meta credentials successfully");
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
      console.error("Failed to get Meta credentials:", error);
      return new Response(
        JSON.stringify({ error: "Platform credentials unavailable" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = credentials.accessToken;

    // STUB RESPONSE (replace later with real Graph API calls)
    // For now, return mock IDs to show the flow works
    const result = {
      campaign_id: `mock_meta_${Date.now()}`,
      adset_id: `mock_meta_as_${Date.now()}`,
      creative_id: `mock_meta_cr_${Date.now()}`,
      status: "PENDING_REVIEW"
    };

    // Update campaign with published info
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        platforms: { meta: result },
        published_at: new Date().toISOString(),
        status: "published"
      })
      .eq("id", campaignId);

    if (updateError) {
      console.error("Error updating campaign:", updateError);
    }

    console.log("Meta publish successful:", result);
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Publish Meta error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
