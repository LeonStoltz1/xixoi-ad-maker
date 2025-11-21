import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum concurrent Quick-Start publishes to protect master account
const MAX_CONCURRENT_PUBLISHES = 15;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check how many publishes are currently in progress
    const { count: activeCount } = await supabaseClient
      .from('quick_start_publish_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'publishing');

    console.log(`Currently ${activeCount || 0} Quick-Start publishes in progress`);

    // Only process if under the safety limit
    const availableSlots = MAX_CONCURRENT_PUBLISHES - (activeCount || 0);
    if (availableSlots <= 0) {
      console.log('⚠️ Max concurrent publishes reached, waiting...');
      return new Response(
        JSON.stringify({ message: 'At capacity, try again shortly' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get queued items (only process available slots)
    const { data: queueItems, error: fetchError } = await supabaseClient
      .from('quick_start_publish_queue')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(Math.min(availableSlots, 5)); // Process max 5 at a time

    if (fetchError) throw fetchError;

    console.log(`Processing ${queueItems?.length || 0} Quick-Start publish requests`);

    // Process each queue item with jitter
    for (const item of queueItems || []) {
      try {
        // Mark as publishing
        await supabaseClient
          .from('quick_start_publish_queue')
          .update({ 
            status: 'publishing', 
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Get campaign and user data
        const { data: campaign } = await supabaseClient
          .from('campaigns')
          .select('*, profiles!inner(*)')
          .eq('id', item.campaign_id)
          .single();

        if (!campaign) {
          throw new Error('Campaign not found');
        }

        // Call appropriate publish function
        let functionName = '';
        switch (item.platform) {
          case 'meta':
            functionName = 'publish-meta';
            break;
          case 'google':
            functionName = 'publish-google';
            break;
          case 'tiktok':
            functionName = 'publish-tiktok';
            break;
          case 'linkedin':
            functionName = 'publish-linkedin';
            break;
          case 'x':
            functionName = 'publish-x';
            break;
          default:
            throw new Error(`Unknown platform: ${item.platform}`);
        }

        // Publish the ad
        const { data: publishResult, error: publishError } = await supabaseClient.functions.invoke(
          functionName,
          { 
            body: { 
              campaignId: item.campaign_id,
              userId: item.user_id
            }
          }
        );

        if (publishError) {
          throw publishError;
        }

        // Mark as live
        await supabaseClient
          .from('quick_start_publish_queue')
          .update({ 
            status: 'live',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        console.log(`✅ Published campaign ${item.campaign_id} to ${item.platform}`);

        // Random jitter (10-30 seconds) between publishes to look human
        const jitterMs = 10000 + Math.random() * 20000;
        await new Promise(resolve => setTimeout(resolve, jitterMs));

      } catch (error) {
        console.error(`❌ Failed to publish ${item.id}:`, error);
        
        // Retry logic
        const newRetryCount = (item.retry_count || 0) + 1;
        const maxRetries = 3;

        if (newRetryCount < maxRetries) {
          // Requeue for retry
          await supabaseClient
            .from('quick_start_publish_queue')
            .update({ 
              status: 'queued',
              retry_count: newRetryCount,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
        } else {
          // Mark as failed after max retries
          await supabaseClient
            .from('quick_start_publish_queue')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Max retries exceeded',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
        }
      }
    }

    // Update queue positions for remaining items
    await supabaseClient.rpc('update_queue_positions');

    return new Response(
      JSON.stringify({ 
        processed: queueItems?.length || 0,
        message: 'Publish queue processing complete'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Publish queue processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});