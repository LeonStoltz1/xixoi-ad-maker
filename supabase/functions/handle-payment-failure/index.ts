import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, reloadId, failureReason } = await req.json();

    console.log('Payment failure detected:', { userId, reloadId, failureReason });

    // Update reload record
    if (reloadId) {
      await supabase
        .from('ad_budget_reloads')
        .update({
          payment_status: 'failed',
          failure_reason: failureReason,
          retry_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reloadId);
    }

    // Get all active campaigns for user
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (campaignsError) {
      console.error('Failed to fetch campaigns:', campaignsError);
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No active campaigns to pause');
      return new Response(
        JSON.stringify({ success: true, message: 'No active campaigns' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Pausing ${campaigns.length} active campaigns due to payment failure`);

    // Pause all active campaigns
    const pauseResults = [];
    for (const campaign of campaigns) {
      try {
        // Update campaign to paused
        await supabase
          .from('campaigns')
          .update({
            is_active: false,
            paused_at: new Date().toISOString(),
            paused_reason: 'Payment failure - automatic pause',
            payment_failures: (campaign.payment_failures || 0) + 1,
          })
          .eq('id', campaign.id);

        // Get platform statuses and pause them
        const { data: platformStatuses } = await supabase
          .from('campaign_platform_status')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('is_active', true);

        if (platformStatuses) {
          for (const platformStatus of platformStatuses) {
            try {
              // Pause on platform
              await pausePlatformCampaign(
                platformStatus.platform,
                platformStatus.platform_campaign_id
              );

              // Update status
              await supabase
                .from('campaign_platform_status')
                .update({
                  is_active: false,
                  last_sync: new Date().toISOString(),
                })
                .eq('id', platformStatus.id);
            } catch (error) {
              console.error(`Failed to pause ${platformStatus.platform}:`, error);
            }
          }
        }

        pauseResults.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          success: true,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to pause campaign ${campaign.id}:`, error);
        pauseResults.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Send notification email to user
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profile?.email) {
      console.log(`Sending payment failure notification to: ${profile.email}`);
      // TODO: Implement email notification
      // await sendPaymentFailureEmail(profile.email, pauseResults.length);
    }

    console.log('Payment failure handling complete:', {
      userId,
      campaignsPaused: pauseResults.filter(r => r.success).length,
      failures: pauseResults.filter(r => !r.success).length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All campaigns paused due to payment failure',
        results: pauseResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in handle-payment-failure:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function pausePlatformCampaign(
  platform: string,
  platformCampaignId: string | null
): Promise<void> {
  if (!platformCampaignId) {
    console.log(`No platform campaign ID for ${platform}, skipping`);
    return;
  }

  console.log(`Emergency pausing ${platform} campaign:`, platformCampaignId);

  // TODO: Implement actual platform API calls
  // These MUST be implemented for production use
  switch (platform) {
    case 'meta':
      // await pauseMetaCampaign(platformCampaignId);
      break;
    case 'tiktok':
      // await pauseTikTokCampaign(platformCampaignId);
      break;
    case 'google':
      // await pauseGoogleCampaign(platformCampaignId);
      break;
    case 'linkedin':
      // await pauseLinkedInCampaign(platformCampaignId);
      break;
    case 'x':
      // await pauseXCampaign(platformCampaignId);
      break;
  }
}
