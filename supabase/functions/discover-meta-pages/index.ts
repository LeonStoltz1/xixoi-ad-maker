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

    console.log("Discovering Meta pages...");

    // Get system Meta credentials
    const { data: cred, error: credError } = await supabase
      .from("platform_credentials")
      .select("access_token, platform_account_id")
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

    const accessToken = cred.access_token;

    console.log("Fetching pages from Meta Graph API...");

    // Fetch all pages the system user has access to
    const pagesUrl = `https://graph.facebook.com/v23.0/me/accounts?access_token=${encodeURIComponent(accessToken)}&fields=id,name,category,tasks&limit=100`;
    
    const response = await fetch(pagesUrl);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Meta API error:", data.error || data);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: data.error?.message || "Failed to fetch pages from Meta",
          details: data.error
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pages = (data.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category || "Unknown",
      tasks: p.tasks || [],
      canCreateContent: p.tasks?.includes("CREATE_CONTENT") || false,
    }));

    console.log(`✅ Found ${pages.length} pages`);

    return new Response(
      JSON.stringify({
        success: true,
        pages,
        count: pages.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Discover pages error:", error);
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
