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
    const supabase = supabaseClient();

    console.log("Testing Meta publish with master credentials...");

    // Get system Meta credentials
    const { data: cred, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("platform", "meta")
      .eq("owner_type", "system")
      .single();

    if (credError || !cred) {
      console.error("No Meta credentials found:", credError);
      return new Response(
        JSON.stringify({ 
          error: "No Meta master credentials configured. Please add them in Admin panel first." 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt token
    const accessToken = await decrypt(cred.access_token);
    const adAccountId = cred.platform_account_id; // Format: act_123456789 or just numbers
    const pageId = cred.account_name; // Temporarily using account_name for page_id

    if (!adAccountId) {
      return new Response(
        JSON.stringify({ error: "Ad Account ID not configured" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pageId) {
      return new Response(
        JSON.stringify({ error: "Page ID not configured" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accountIdFormatted = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const baseUrl = "https://graph.facebook.com/v23.0";

    console.log(`Testing with account: ${accountIdFormatted}, page: ${pageId}`);

    // Test 1: Verify account access
    const accountCheckResponse = await fetch(
      `${baseUrl}/${accountIdFormatted}?fields=id,name,account_status&access_token=${accessToken}`
    );
    
    const accountCheck = await accountCheckResponse.json();
    
    if (!accountCheckResponse.ok) {
      console.error("Account check failed:", accountCheck);
      return new Response(
        JSON.stringify({ 
          error: "Failed to access Meta ad account",
          details: accountCheck
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("✅ Account access verified:", accountCheck.name);

    // Test 2: Create a simple test campaign (PAUSED for safety)
    const testCampaignParams = new URLSearchParams({
      name: `xiXoi Test Campaign — ${new Date().toISOString().split('T')[0]} — DELETE ME`,
      objective: "OUTCOME_ENGAGEMENT",
      status: "PAUSED",
      special_ad_categories: "[]",
      access_token: accessToken
    });

    const campaignResponse = await fetch(
      `${baseUrl}/${accountIdFormatted}/campaigns`,
      {
        method: "POST",
        body: testCampaignParams
      }
    );

    const campaignData = await campaignResponse.json();

    if (!campaignResponse.ok) {
      console.error("Campaign creation failed:", campaignData);
      return new Response(
        JSON.stringify({
          error: "Failed to create test campaign",
          details: campaignData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("✅ Test campaign created:", campaignData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Meta master credentials working! Test campaign created (PAUSED).",
        account: accountCheck.name,
        account_id: accountIdFormatted,
        campaign_id: campaignData.id,
        instructions: "Check your Meta Ads Manager to see the test campaign. Safe to delete it."
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Test publish error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
