import { supabaseClient } from "../_shared/supabase.ts";
import { getSystemCredentials } from "../_shared/credentials.ts";

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

    console.log('Publishing to X for campaign:', campaignId);

    // Get system credentials for X
    const credentials = await getSystemCredentials('x');
    console.log('Retrieved system credentials for X');

    // STUB: Replace with actual X (Twitter) API publishing logic
    // This is a placeholder that simulates X campaign creation
    const xResponse = {
      tweet_id: `x_tweet_${Date.now()}`,
      status: 'PENDING',
      platform: 'x'
    };

    console.log('X publishing response (STUBBED):', xResponse);

    // Update campaign with X IDs
    const supabase = supabaseClient();
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      throw updateError;
    }

    console.log('Campaign updated successfully with X data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        xIds: xResponse 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in publish-x:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'X publishing failed', details: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
