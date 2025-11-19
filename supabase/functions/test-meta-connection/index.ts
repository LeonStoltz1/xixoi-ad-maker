import { supabaseClient } from "../_shared/supabase.ts";

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

    console.log("Testing Meta connection with master credentials...");

    // Get system Meta credentials - SELECT ALL NEEDED COLUMNS
    const { data: cred, error: credError } = await supabase
      .from("platform_credentials")
      .select("access_token, platform_account_id, account_name")
      .eq("platform", "meta")
      .eq("owner_type", "system")
      .maybeSingle();

    if (credError || !cred) {
      console.error("No Meta credentials found:", credError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "No Meta master credentials configured. Please add them in Admin panel first." 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use plaintext token
    const accessToken = cred.access_token;
    const adAccountId = cred.platform_account_id;

    if (!adAccountId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Ad Account ID not configured in platform_credentials" 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format account ID with act_ prefix if needed
    const accountIdFormatted = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    console.log(`Testing connection to account: ${accountIdFormatted}`);

    // Simple lightweight GET to verify credentials work
    const testUrl = `https://graph.facebook.com/v23.0/${accountIdFormatted}?fields=id,name,account_status&access_token=${encodeURIComponent(accessToken)}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error("Meta API error:", data);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: data.error?.message || "Failed to connect to Meta account",
          details: data.error
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("✅ Meta connection successful:", data.name);

    return new Response(
      JSON.stringify({
        success: true,
        account_id: data.id,
        account_name: data.name,
        account_status: data.account_status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Test connection error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
