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
    const supabase = supabaseClient();
    
    // Parse request body safely - only if Content-Type indicates JSON
    let userId = "system";
    let tier = "quickstart";
    
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        userId = body.userId ?? "system";
        tier = body.tier ?? "quickstart";
      } catch (err) {
        console.warn("JSON parsing failed:", err);
      }
    }

    console.log("Testing Meta connection - userId:", userId, "tier:", tier);

    // Get credentials using hybrid routing (system for Quick-Start, user OAuth for Pro+)
    let credentials;
    try {
      credentials = await getCredentials(userId || "system", "meta", tier || "quickstart");
      console.log("Retrieved Meta credentials successfully");
    } catch (error: any) {
      console.error("Failed to get Meta credentials:", error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message || "Failed to retrieve Meta credentials"
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = credentials.accessToken;
    let adAccountId = credentials.accountId || "";

    if (!adAccountId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Ad Account ID not configured for Meta" 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure account ID has act_ prefix for Meta API
    if (!adAccountId.startsWith('act_')) {
      adAccountId = `act_${adAccountId}`;
    }

    console.log(`Testing connection to account: ${adAccountId}`);

    // Simple lightweight GET to verify credentials work
    const testUrl = `https://graph.facebook.com/v23.0/${adAccountId}?fields=id,name,account_status&access_token=${encodeURIComponent(accessToken)}`;
    
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
