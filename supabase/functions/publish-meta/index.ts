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
    console.log("Publishing to Meta - campaignId:", campaignId, "userId:", userId);

    const supabase = supabaseClient();

    // Get system credentials for Meta (no longer user-specific)
    let credentials;
    try {
      credentials = await getSystemCredentials("meta");
      console.log("Retrieved Meta system credentials successfully");
    } catch (error) {
      console.error("Failed to get Meta system credentials:", error);
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
