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

    // Atomically lease up to 5 jobs (no race conditions)
    const { data: leasedJobs, error: leaseError } = await supabaseClient
      .rpc('lease_ai_jobs', { batch_size: 5 });

    if (leaseError) throw leaseError;

    console.log(`Leased ${leasedJobs?.length || 0} AI generation jobs`);

    if (!leasedJobs || leasedJobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No jobs ready to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each leased job (no setTimeout - fast execution)
    const results = await Promise.allSettled(
      leasedJobs.map(async (job: any) => {
        try {
          // Route to appropriate edge function
          let functionName = '';
          switch (job.request_type) {
            case 'variants':
              functionName = 'generate-ad-variants';
              break;
            case 'targeting':
              functionName = 'generate-targeting';
              break;
            case 'copy_rewrite':
              functionName = 'rewrite-ad-copy';
              break;
            default:
              throw new Error(`Unknown request type: ${job.request_type}`);
          }

          // Call the edge function
          const { data: result, error: functionError } = await supabaseClient.functions.invoke(
            functionName,
            { body: job.request_payload }
          );

          if (functionError) throw functionError;

          // Mark as completed
          await supabaseClient
            .from('ai_generation_queue')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
              lease_id: null,
              lease_expires_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);

          console.log(`✅ Completed AI job ${job.id}`);
          return { id: job.id, success: true };

        } catch (error) {
          console.error(`❌ Failed AI job ${job.id}:`, error);
          
          // Mark as failed
          await supabaseClient
            .from('ai_generation_queue')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              completed_at: new Date().toISOString(),
              lease_id: null,
              lease_expires_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);

          return { id: job.id, success: false, error: error instanceof Error ? error.message : 'Unknown' };
        }
      })
    );

    // Update queue positions for remaining jobs
    await supabaseClient.rpc('update_queue_positions');

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;

    return new Response(
      JSON.stringify({ 
        processed: leasedJobs.length,
        successful,
        failed,
        message: 'AI queue processing complete'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI queue processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});