import { supabaseClient } from "../_shared/supabase.ts";
import { decrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  
  if (!res.ok || !json.access_token) {
    console.error("Token refresh error:", json);
    throw new Error(json.error_description || "Failed to get access token");
  }

  return json.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Testing Google API connection");

    const supabase = supabaseClient();

    // Get system Google credentials
    const { data: cred, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("platform", "google")
      .eq("owner_type", "system")
      .single();

    if (credError || !cred) {
      console.error("No system credentials found:", credError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No Google system credentials configured" 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Found system credentials, decrypting refresh token");

    // Decrypt the refresh token
    const refreshToken = await decrypt(cred.refresh_token);
    
    console.log("Getting fresh access token");
    
    // Get fresh access token
    const accessToken = await getAccessToken(refreshToken);
    
    console.log("Access token obtained, testing Google Ads API");

    const developerToken = Deno.env.get("GOOGLE_DEVELOPER_TOKEN")!;
    const customerId = cred.platform_account_id;

    // Test API call - get customer info
    const url = `https://googleads.googleapis.com/v16/customers/${customerId}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": customerId,
      },
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("Google Ads API error:", json);
      return new Response(
        JSON.stringify({
          success: false,
          error: json.error?.message || "API call failed",
          details: json
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Google API test successful:", json);

    return new Response(
      JSON.stringify({
        success: true,
        customerId: json.resourceName || customerId,
        message: "Google Ads API connection verified"
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Test error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
