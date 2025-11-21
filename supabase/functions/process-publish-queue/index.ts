import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, release any expired leases (recovery)
    await supabaseClient.rpc('release_expired_leases');

    // Atomically lease up to 3 jobs (conservative for Meta master account safety)
    const { data: leasedJobs, error: leaseError } = await supabaseClient
      .rpc('lease_publish_jobs', { batch_size: 3 });

    if (leaseError) throw leaseError;

    console.log(`Leased ${leasedJobs?.length || 0} Quick-Start publish jobs`);

    if (!leasedJobs || leasedJobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No jobs ready to publish' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each leased job sequentially (preserve jitter via next_attempt_at)
    const results = [];
    for (const job of leasedJobs as any[]) {
      try {
        // Get campaign data
        const { data: campaign } = await supabaseClient
          .from('campaigns')
          .select('*, profiles!inner(*)')
          .eq('id', job.campaign_id)
          .single();

        if (!campaign) {
          throw new Error('Campaign not found');
        }

        // Route to appropriate publish function
        let functionName = '';
        switch (job.platform) {
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
            throw new Error(`Unknown platform: ${job.platform}`);
        }

        // Publish the ad
        const { data: publishResult, error: publishError } = await supabaseClient.functions.invoke(
          functionName,
          { 
            body: { 
              campaignId: job.campaign_id,
              userId: job.user_id
            }
          }
        );

        if (publishError) throw publishError;

        // Mark as live
        await supabaseClient
          .from('quick_start_publish_queue')
          .update({ 
            status: 'live',
            completed_at: new Date().toISOString(),
            lease_id: null,
            lease_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.log(`✅ Published campaign ${job.campaign_id} to ${job.platform}`);
        results.push({ id: job.id, success: true });

      } catch (error) {
        console.error(`❌ Failed to publish ${job.id}:`, error);
        
        // Retry logic
        const newRetryCount = (job.retry_count || 0) + 1;
        const maxRetries = 3;

        if (newRetryCount < maxRetries) {
          // Calculate exponential backoff: 30s, 2min, 5min
          const backoffSeconds = Math.min(30 * Math.pow(2, newRetryCount), 300);
          const nextAttempt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

          // Requeue with backoff
          await supabaseClient
            .from('quick_start_publish_queue')
            .update({ 
              status: 'queued',
              retry_count: newRetryCount,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              lease_id: null,
              lease_expires_at: null,
              next_attempt_at: nextAttempt,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);

          console.log(`🔄 Requeued ${job.id} for retry ${newRetryCount}/${maxRetries} in ${backoffSeconds}s`);
        } else {
          // Mark as failed after max retries
          await supabaseClient
            .from('quick_start_publish_queue')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Max retries exceeded',
              completed_at: new Date().toISOString(),
              lease_id: null,
              lease_expires_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
        }

        results.push({ id: job.id, success: false, error: error instanceof Error ? error.message : 'Unknown' });
      }
    }

    // Update queue positions for remaining jobs
    await supabaseClient.rpc('update_queue_positions');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        processed: leasedJobs.length,
        successful,
        failed,
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