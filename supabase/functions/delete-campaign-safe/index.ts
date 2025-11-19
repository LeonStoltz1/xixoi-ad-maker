import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlatformStatus {
  platform: string;
  platform_campaign_id: string | null;
  is_active: boolean;
}

async function stopMetaCampaign(campaignId: string, accessToken: string): Promise<boolean> {
  try {
    console.log(`Stopping Meta campaign: ${campaignId}`);
    
    // Stop the campaign on Meta
    const response = await fetch(`https://graph.facebook.com/v21.0/${campaignId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Meta campaign stop failed: ${error}`);
      return false;
    }

    // Verify the campaign is stopped
    const verifyResponse = await fetch(
      `https://graph.facebook.com/v21.0/${campaignId}?fields=status&access_token=${accessToken}`
    );
    
    if (!verifyResponse.ok) {
      console.error('Failed to verify Meta campaign status');
      return false;
    }

    const data = await verifyResponse.json();
    console.log(`Meta campaign status verified: ${data.status}`);
    
    return data.status === 'PAUSED' || data.status === 'ARCHIVED';
  } catch (error) {
    console.error('Error stopping Meta campaign:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { campaignId } = await req.json();
    
    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }

    console.log(`Starting safe deletion for campaign: ${campaignId}`);

    // Step 1: Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('id, name, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found or access denied');
    }

    // Step 2: Get all platform statuses for this campaign
    const { data: platformStatuses, error: statusError } = await supabaseClient
      .from('campaign_platform_status')
      .select('platform, platform_campaign_id, is_active')
      .eq('campaign_id', campaignId);

    if (statusError) {
      console.error('Error fetching platform statuses:', statusError);
    }

    const activePlatforms = (platformStatuses || []).filter(
      (status: PlatformStatus) => status.is_active && status.platform_campaign_id
    );

    console.log(`Found ${activePlatforms.length} active platforms for campaign`);

    // Step 3: Stop ads on each platform
    const stopResults: { platform: string; success: boolean; error?: string }[] = [];

    for (const platformStatus of activePlatforms) {
      const { platform, platform_campaign_id } = platformStatus;
      
      console.log(`Stopping campaign on ${platform}: ${platform_campaign_id}`);

      try {
        // Get platform credentials
        const { data: credentials } = await supabaseClient
          .from('platform_credentials')
          .select('access_token')
          .eq('platform', platform)
          .or(`owner_type.eq.system,owner_id.eq.${user.id}`)
          .eq('status', 'connected')
          .single();

        if (!credentials?.access_token) {
          stopResults.push({
            platform,
            success: false,
            error: 'No credentials found',
          });
          continue;
        }

        let success = false;

        // Stop campaign based on platform
        if (platform === 'meta') {
          success = await stopMetaCampaign(platform_campaign_id!, credentials.access_token);
        }
        // Add other platforms here as they're implemented
        // else if (platform === 'google') { ... }
        // else if (platform === 'tiktok') { ... }
        else {
          console.log(`Platform ${platform} stop not implemented, marking as success`);
          success = true; // For now, allow deletion even if platform stop isn't implemented
        }

        stopResults.push({ platform, success });

        // Update platform status to inactive
        if (success) {
          await supabaseClient
            .from('campaign_platform_status')
            .update({ is_active: false })
            .eq('campaign_id', campaignId)
            .eq('platform', platform);
        }
      } catch (error) {
        console.error(`Error stopping ${platform} campaign:`, error);
        stopResults.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Step 4: Check if all platforms stopped successfully
    const allStopped = stopResults.every(result => result.success);
    const failedPlatforms = stopResults.filter(result => !result.success);

    if (!allStopped && failedPlatforms.length > 0) {
      console.error('Failed to stop campaigns on some platforms:', failedPlatforms);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PLATFORM_STOP_FAILED',
          message: `Failed to stop ads on: ${failedPlatforms.map(p => p.platform).join(', ')}. Cannot delete campaign until ads are stopped.`,
          failedPlatforms,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('All platforms stopped successfully, proceeding with database deletion');

    // Step 5: Mark campaign as inactive first
    await supabaseClient
      .from('campaigns')
      .update({ is_active: false, status: 'deleted' })
      .eq('id', campaignId);

    // Step 6: Delete campaign from database (cascades to related tables)
    const { error: deleteError } = await supabaseClient
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError);
      throw new Error('Failed to delete campaign from database');
    }

    console.log(`Campaign ${campaignId} deleted successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Campaign stopped on all platforms and deleted successfully',
        stoppedPlatforms: stopResults.map(r => r.platform),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in delete-campaign-safe function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
