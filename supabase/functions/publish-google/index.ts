import { supabaseClient } from "../_shared/supabase.ts";
import { getSystemCredentials } from "../_shared/credentials.ts";

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
    console.log("Publishing to Google - campaignId:", campaignId, "userId:", userId);

    const supabase = supabaseClient();

    // Get system credentials for Google (no longer user-specific)
    let credentials;
    try {
      credentials = await getSystemCredentials("google");
      console.log("Retrieved Google system credentials successfully");
    } catch (error) {
      console.error("Failed to get Google system credentials:", error);
      return new Response(
        JSON.stringify({ error: "Platform credentials unavailable" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = credentials.accessToken;

    // STUB RESPONSE (replace later with real Google Ads API calls)
    const result = {
      campaign_id: `mock_google_${Date.now()}`,
      ad_group_id: `mock_google_ag_${Date.now()}`,
      ad_id: `mock_google_ad_${Date.now()}`,
      status: "ENABLED"
    };

    // Update campaign with published info
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        platforms: { google: result },
        published_at: new Date().toISOString(),
        status: "published"
      })
      .eq("id", campaignId);

    if (updateError) {
      console.error("Error updating campaign:", updateError);
    }

    console.log("Google publish successful:", result);
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Publish Google error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
