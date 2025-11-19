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
    const { userId, count = 5 } = await req.json();
    console.log("Seeding test campaigns for userId:", userId, "count:", count);

    const supabase = supabaseClient();

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, plan, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const createdCampaigns = [];
    const variantTypes = ['static', 'video', 'ugc', 'meta', 'tiktok', 'google', 'linkedin'];
    
    // Test campaign templates
    const campaignTemplates = [
      {
        name: "E-commerce Product Launch",
        target: "Online shoppers aged 25-45",
        location: "United States",
        url: "https://example.com/product",
        budget: 25,
        description: "Launching a new smart home device with voice control and app integration"
      },
      {
        name: "Local Restaurant Promotion",
        target: "Foodies within 10 miles",
        location: "San Francisco, CA",
        url: "https://example.com/restaurant",
        budget: 15,
        description: "Authentic Italian restaurant offering farm-to-table dining experience"
      },
      {
        name: "SaaS Free Trial Campaign",
        target: "B2B decision makers",
        location: "United States, Canada",
        url: "https://example.com/saas",
        budget: 50,
        description: "Project management software with AI-powered task automation"
      },
      {
        name: "Fitness App Download",
        target: "Health-conscious millennials",
        location: "United States",
        url: "https://example.com/fitness-app",
        budget: 30,
        description: "Personal training app with customized workout plans and nutrition tracking"
      },
      {
        name: "Real Estate Open House",
        target: "Home buyers in market",
        location: "Austin, TX",
        url: "https://example.com/open-house",
        budget: 20,
        description: "Luxury 4BR/3BA home in downtown with modern amenities and rooftop deck"
      }
    ];

    for (let i = 0; i < Math.min(count, campaignTemplates.length); i++) {
      const template = campaignTemplates[i];
      const timestamp = new Date().toISOString();

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: userId,
          name: `[TEST] ${template.name} - ${timestamp.substring(0, 19)}`,
          status: "draft",
          daily_budget: template.budget,
          target_location: template.location,
          target_audience: template.target,
          landing_url: template.url,
          detected_product_type: i % 2 === 0 ? "product" : "service",
          auto_targeted: true,
        })
        .select()
        .single();

      if (campaignError || !campaign) {
        console.error(`Failed to create campaign ${i}:`, campaignError);
        continue;
      }

      console.log(`Created campaign: ${campaign.id}`);

      // Create test asset
      const { error: assetError } = await supabase
        .from("campaign_assets")
        .insert({
          campaign_id: campaign.id,
          asset_type: "image",
          asset_url: `https://via.placeholder.com/1200x628.png?text=${encodeURIComponent(template.name)}`,
        });

      if (assetError) {
        console.error(`Failed to create asset for campaign ${campaign.id}:`, assetError);
      }

      // Create variants for each type
      const variantsToCreate = [];
      
      for (const variantType of variantTypes) {
        // Platform-specific copy
        let headline = "";
        let bodyCopy = "";
        let ctaText = "";

        switch (variantType) {
          case 'static':
            headline = `${template.name}`;
            bodyCopy = template.description;
            ctaText = "Learn More";
            break;
          case 'video':
            headline = `Watch: ${template.name}`;
            bodyCopy = `${template.description} - See it in action!`;
            ctaText = "Watch Now";
            break;
          case 'ugc':
            headline = `Real customers love this!`;
            bodyCopy = `"${template.description}" - Verified Customer`;
            ctaText = "Try It Free";
            break;
          case 'meta':
            headline = template.name.substring(0, 40); // Meta 40 char headline
            bodyCopy = template.description.substring(0, 125); // Meta 125 char primary
            ctaText = "Shop Now";
            break;
          case 'tiktok':
            headline = `🔥 ${template.name}`;
            bodyCopy = template.description.substring(0, 100); // TikTok 100 char
            ctaText = "Get It Now";
            break;
          case 'google':
            headline = template.name.substring(0, 30); // Google 30 char headline
            bodyCopy = template.description.substring(0, 90); // Google 90 char description
            ctaText = "Learn More";
            break;
          case 'linkedin':
            headline = `Professional ${template.name}`;
            bodyCopy = template.description.substring(0, 150); // LinkedIn 150 char
            ctaText = "Discover More";
            break;
        }

        variantsToCreate.push({
          campaign_id: campaign.id,
          variant_type: variantType,
          headline,
          body_copy: bodyCopy,
          cta_text: ctaText,
          creative_url: `https://via.placeholder.com/1200x628.png?text=${encodeURIComponent(variantType.toUpperCase())}`,
          predicted_roas: Math.random() * 3 + 1, // Random ROAS between 1-4
          variant_set: i % 2 === 0 ? 'A' : 'B', // Alternate between A/B sets
        });
      }

      const { error: variantError } = await supabase
        .from("ad_variants")
        .insert(variantsToCreate);

      if (variantError) {
        console.error(`Failed to create variants for campaign ${campaign.id}:`, variantError);
      } else {
        console.log(`Created ${variantsToCreate.length} variants for campaign ${campaign.id}`);
      }

      createdCampaigns.push({
        id: campaign.id,
        name: campaign.name,
        variants: variantsToCreate.length,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully seeded ${createdCampaigns.length} test campaigns`,
        campaigns: createdCampaigns,
        totalVariants: createdCampaigns.length * variantTypes.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Seed data error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
