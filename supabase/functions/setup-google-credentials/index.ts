import { supabaseClient } from "../_shared/supabase.ts";
import { encrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Setting up Google master credentials");

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const developerToken = Deno.env.get("GOOGLE_DEVELOPER_TOKEN");
    const masterRefreshToken = Deno.env.get("GOOGLE_MASTER_REFRESH_TOKEN");
    const loginCustomerId = Deno.env.get("GOOGLE_LOGIN_CUSTOMER_ID");

    if (!clientId || !clientSecret || !developerToken || !masterRefreshToken || !loginCustomerId) {
      console.error("Missing Google credentials:", {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasDeveloperToken: !!developerToken,
        hasRefreshToken: !!masterRefreshToken,
        hasCustomerId: !!loginCustomerId
      });
      return new Response(
        JSON.stringify({ error: "Missing one or more GOOGLE_* environment variables" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = supabaseClient();

    // Encrypt the refresh token
    const encryptedRefresh = await encrypt(masterRefreshToken);
    console.log("Refresh token encrypted successfully");

    // Delete existing system Google credentials
    await supabase
      .from("platform_credentials")
      .delete()
      .eq("platform", "google")
      .eq("owner_type", "system");

    console.log("Deleted existing system credentials");

    // Insert new Google master credentials
    const { data, error } = await supabase
      .from("platform_credentials")
      .insert({
        platform: "google",
        owner_type: "system",
        owner_id: null,
        status: "connected",
        access_token: encryptedRefresh, // Store refresh token as access_token for compatibility
        refresh_token: encryptedRefresh,
        platform_account_id: loginCustomerId,
        account_name: "xiXoi Master Account",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert credentials:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save credentials", details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Google master credentials saved successfully:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Google master credentials initialized",
        credentialId: data.id,
        customerId: loginCustomerId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Setup error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
