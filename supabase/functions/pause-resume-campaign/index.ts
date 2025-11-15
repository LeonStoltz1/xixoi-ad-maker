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

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { campaignId, action, reason } = await req.json();

    if (!campaignId || !['pause', 'resume'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Provide campaignId and action (pause/resume)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${action} campaign request:`, { campaignId, user: user.id, reason });

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found or unauthorized:', campaignError);
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isPausing = action === 'pause';

    // Update campaign status
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        is_active: !isPausing,
        paused_at: isPausing ? new Date().toISOString() : null,
        paused_reason: isPausing ? reason : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign:', updateError);
      throw updateError;
    }

    // Get platform statuses
    const { data: platformStatuses } = await supabase
      .from('campaign_platform_status')
      .select('*')
      .eq('campaign_id', campaignId);

    // Update platform campaigns
    const results = [];
    if (platformStatuses) {
      for (const platformStatus of platformStatuses) {
        try {
          const result = await updatePlatformCampaign(
            platformStatus.platform,
            platformStatus.platform_campaign_id,
            isPausing
          );

          await supabase
            .from('campaign_platform_status')
            .update({
              is_active: !isPausing,
              last_sync: new Date().toISOString(),
              sync_error: result.error || null,
            })
            .eq('id', platformStatus.id);

          results.push({
            platform: platformStatus.platform,
            success: result.success,
            error: result.error,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to update ${platformStatus.platform}:`, error);
          results.push({
            platform: platformStatus.platform,
            success: false,
            error: errorMessage,
          });
        }
      }
    }

    console.log(`Campaign ${action}d successfully:`, {
      campaignId,
      platformResults: results,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Campaign ${action}d successfully`,
        platformResults: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in pause-resume-campaign:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updatePlatformCampaign(
  platform: string,
  platformCampaignId: string | null,
  pause: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!platformCampaignId) {
    return { success: false, error: 'No platform campaign ID' };
  }

  // TODO: Implement actual platform API calls
  // For now, we'll simulate success
  console.log(`${pause ? 'Pausing' : 'Resuming'} ${platform} campaign:`, platformCampaignId);

  switch (platform) {
    case 'meta':
      // Meta API call would go here
      // await pauseMetaCampaign(platformCampaignId, pause);
      return { success: true };
    
    case 'tiktok':
      // TikTok API call would go here
      return { success: true };
    
    case 'google':
      // Google Ads API call would go here
      return { success: true };
    
    case 'linkedin':
      // LinkedIn API call would go here
      return { success: true };
    
    case 'x':
      // X (Twitter) API call would go here
      return { success: true };
    
    default:
      return { success: false, error: 'Unknown platform' };
  }
}
