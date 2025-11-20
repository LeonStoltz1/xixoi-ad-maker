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
    const { campaignId, userId } = await req.json();
    console.log("Publishing to Meta - campaignId:", campaignId, "userId:", userId);

    const supabase = supabaseClient();

    // Fetch user tier
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "PROFILE_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tier = profile.plan;

    // Get credentials (hybrid routing: master OR user)
    let credentials;
    try {
      credentials = await getCredentials(userId, "meta", tier);
      console.log("Retrieved Meta credentials successfully");
    } catch (error: any) {
      if (error.message.includes("OAUTH_REQUIRED")) {
        return new Response(
          JSON.stringify({
            error: "OAUTH_REQUIRED",
            message: error.message,
            connectUrl: "/connect-platforms"
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error("Failed to get Meta credentials:", error);
      return new Response(
        JSON.stringify({ error: "Platform credentials unavailable" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = credentials.accessToken;
    let adAccountId = credentials.accountId || "";
    
    if (!adAccountId) {
      return new Response(
        JSON.stringify({ error: "No ad account ID configured for Meta" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure account ID has act_ prefix for Meta API
    if (!adAccountId.startsWith('act_')) {
      adAccountId = `act_${adAccountId}`;
    }
    
    console.log("Using Meta ad account:", adAccountId);

    // Fetch campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*, campaign_assets(*)")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Validate platform selections to prevent fund mismanagement
    const metaSubPlatforms = campaign.meta_sub_platforms || { facebook: true, instagram: true };
    
    if (!metaSubPlatforms.facebook && !metaSubPlatforms.instagram) {
      console.error("PLATFORM_ERROR: No Meta sub-platforms selected for campaign", campaignId);
      return new Response(
        JSON.stringify({ 
          error: "PLATFORM_ERROR", 
          message: "No Meta platforms selected. Cannot publish ads without platform selection." 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Campaign ${campaignId} platform selections:`, metaSubPlatforms);

    // Fetch ad variant (first one for now)
    const { data: variant } = await supabase
      .from("ad_variants")
      .select("*")
      .eq("campaign_id", campaignId)
      .limit(1)
      .single();

    if (!variant) {
      return new Response(
        JSON.stringify({ error: "No ad variant found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = "https://graph.facebook.com/v23.0";

    // Step 1: Create Campaign
    const campaignParams = new URLSearchParams({
      name: campaign.name,
      objective: "OUTCOME_ENGAGEMENT", // Can be customized based on campaign.primary_goal
      status: "PAUSED", // Start paused for safety
      special_ad_categories: "[]",
      is_adset_budget_sharing_enabled: "false", // Required when using ad set-level budgets
      access_token: token
    });

    const campaignResponse = await fetch(
      `${baseUrl}/${adAccountId}/campaigns`,
      {
        method: "POST",
        body: campaignParams
      }
    );

    const campaignData = await campaignResponse.json();
    
    if (!campaignResponse.ok) {
      console.error("Meta campaign creation failed:", campaignData);
      return new Response(
        JSON.stringify({ error: "Failed to create Meta campaign", details: campaignData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metaCampaignId = campaignData.id;
    console.log("Created Meta campaign:", metaCampaignId);

    // Step 2: Create Ad Set (with targeting and budget)
    const dailyBudget = campaign.daily_budget ? Math.round(campaign.daily_budget * 100) : 2000; // Convert to cents, minimum $20
    
    // Build platform-specific placements based on user selection
    const publisher_platforms: string[] = [];
    const facebook_positions: string[] = [];
    const instagram_positions: string[] = [];
    
    // CRITICAL: Only add platforms that the user explicitly selected
    if (metaSubPlatforms.facebook) {
      publisher_platforms.push('facebook');
      facebook_positions.push('feed', 'right_hand_column', 'marketplace');
    }
    if (metaSubPlatforms.instagram) {
      publisher_platforms.push('instagram');
      instagram_positions.push('stream', 'story');
    }

    const adSetParams = new URLSearchParams({
      name: `${campaign.name} - AdSet`,
      campaign_id: metaCampaignId,
      daily_budget: dailyBudget.toString(),
      billing_event: "IMPRESSIONS",
      optimization_goal: "REACH",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      status: "PAUSED",
      targeting: JSON.stringify({
        geo_locations: { countries: ["US"] }, // Default, should be from campaign.target_location
        age_min: 18,
        age_max: 65,
        publisher_platforms, // CRITICAL: Enforce user's platform selection
        facebook_positions: facebook_positions.length > 0 ? facebook_positions : undefined,
        instagram_positions: instagram_positions.length > 0 ? instagram_positions : undefined,
      }),
      access_token: token
    });

    const adSetResponse = await fetch(
      `${baseUrl}/${adAccountId}/adsets`,
      {
        method: "POST",
        body: adSetParams
      }
    );

    const adSetData = await adSetResponse.json();
    
    if (!adSetResponse.ok) {
      console.error("Meta ad set creation failed:", adSetData);
      return new Response(
        JSON.stringify({ error: "Failed to create Meta ad set", details: adSetData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adSetId = adSetData.id;
    console.log("Created Meta ad set:", adSetId);

    // Step 3: Create Ad Creative
    const creativeAsset = campaign.campaign_assets?.find((a: any) => 
      a.asset_type === "image" || a.asset_type === "video"
    );

    // Load page ID from credentials
    const pageId = credentials.pageId;
    if (!pageId) {
      console.error("META_PAGE_ID_MISSING: No page_id found in credentials");
      return new Response(
        JSON.stringify({ 
          error: "META_PAGE_ID_MISSING", 
          message: "A valid Facebook Page ID is required to publish creatives. Please add it in Admin → Platform Credentials." 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Using Meta Page ID:", pageId);

    // Build platform-specific placements based on user selection
    const placements: string[] = [];
    if (metaSubPlatforms.facebook) {
      placements.push('facebook');
    }
    if (metaSubPlatforms.instagram) {
      placements.push('instagram');
    }
    
    console.log(`CRITICAL: Enforcing user platform selections - only publishing to: ${placements.join(', ')}`);

    const creativeParams = new URLSearchParams({
      name: `${campaign.name} - Creative`,
      object_story_spec: JSON.stringify({
        page_id: pageId, // Use real Facebook Page ID from credentials
        link_data: {
          link: campaign.landing_url || "https://xixoi.com",
          message: variant.body_copy || campaign.name,
          name: variant.headline || campaign.name,
          call_to_action: {
            type: "LEARN_MORE"
          },
          image_url: creativeAsset?.asset_url || ""
        }
      }),
      degrees_of_freedom_spec: JSON.stringify({
        creative_features_spec: {
          standard_enhancements: {
            enroll_status: "OPT_OUT"
          }
        }
      }),
      access_token: token
    });

    const creativeResponse = await fetch(
      `${baseUrl}/${adAccountId}/adcreatives`,
      {
        method: "POST",
        body: creativeParams
      }
    );

    const creativeData = await creativeResponse.json();
    
    if (!creativeResponse.ok) {
      console.error("Meta creative creation failed:", creativeData);
      return new Response(
        JSON.stringify({ error: "Failed to create Meta creative", details: creativeData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creativeId = creativeData.id;
    console.log("Created Meta creative:", creativeId);

    // Step 4: Create Ad
    const adParams = new URLSearchParams({
      name: campaign.name,
      adset_id: adSetId,
      creative: JSON.stringify({ creative_id: creativeId }),
      status: "PAUSED",
      access_token: token
    });

    const adResponse = await fetch(
      `${baseUrl}/${adAccountId}/ads`,
      {
        method: "POST",
        body: adParams
      }
    );

    const adData = await adResponse.json();
    
    if (!adResponse.ok) {
      console.error("Meta ad creation failed:", adData);
      return new Response(
        JSON.stringify({ error: "Failed to create Meta ad", details: adData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adId = adData.id;
    console.log("Created Meta ad:", adId);
    
    // CRITICAL SUCCESS LOG: Confirm which platforms ads were published to
    const publishedPlatforms = [];
    if (metaSubPlatforms.facebook) publishedPlatforms.push('Facebook');
    if (metaSubPlatforms.instagram) publishedPlatforms.push('Instagram');
    console.log(`✅ FUND SAFETY CONFIRMED: Ad published ONLY to user-selected platforms: ${publishedPlatforms.join(', ')}`);

    const result = {
      campaign_id: metaCampaignId,
      adset_id: adSetId,
      creative_id: creativeId,
      ad_id: adId,
      status: "PAUSED",
      published_platforms: metaSubPlatforms // Include in response for transparency
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
