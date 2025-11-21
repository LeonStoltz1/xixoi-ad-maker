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

    // Get pending queue items (limit concurrent processing to 6-10)
    const { data: queueItems, error: fetchError } = await supabaseClient
      .from('ai_generation_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;

    console.log(`Processing ${queueItems?.length || 0} AI generation requests`);

    // Process each queue item
    for (const item of queueItems || []) {
      try {
        // Mark as processing
        await supabaseClient
          .from('ai_generation_queue')
          .update({ 
            status: 'processing', 
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Route to appropriate edge function based on request_type
        let functionName = '';
        switch (item.request_type) {
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
            throw new Error(`Unknown request type: ${item.request_type}`);
        }

        // Call the edge function
        const { data: result, error: functionError } = await supabaseClient.functions.invoke(
          functionName,
          { body: item.request_payload }
        );

        if (functionError) {
          throw functionError;
        }

        // Mark as completed
        await supabaseClient
          .from('ai_generation_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        console.log(`✅ Completed queue item ${item.id}`);

        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed queue item ${item.id}:`, error);
        
        // Mark as failed
        await supabaseClient
          .from('ai_generation_queue')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    }

    // Update queue positions for remaining items
    await supabaseClient.rpc('update_queue_positions');

    return new Response(
      JSON.stringify({ 
        processed: queueItems?.length || 0,
        message: 'Queue processing complete'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Queue processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});