import { supabaseClient } from "../_shared/supabase.ts";
import { decrypt } from "../_shared/encryption.ts";

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

    const { data: account, error: accountError } = await supabase
      .from("ad_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", "linkedin")
      .single();

    if (accountError || !account) {
      console.error("No LinkedIn account found:", accountError);
      return new Response(JSON.stringify({ error: "No LinkedIn Ads account connected" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = await decrypt(account.access_token);

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
