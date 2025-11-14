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
    console.log("Publishing to TikTok - campaignId:", campaignId, "userId:", userId);

    const supabase = supabaseClient();

    const { data: account, error: accountError } = await supabase
      .from("ad_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", "tiktok")
      .single();

    if (accountError || !account) {
      console.error("No TikTok account found:", accountError);
      return new Response(JSON.stringify({ error: "No TikTok Ads account connected" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = await decrypt(account.access_token);

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
