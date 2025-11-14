import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending batch items by platform
    const platforms = ['meta', 'tiktok', 'google'] as const;
    const minimums: Record<string, number> = { meta: 50, tiktok: 20, google: 50 };
    
    for (const platform of platforms) {
      const { data: pending } = await supabaseClient
        .from('batch_funding_queue')
        .select('*')
        .eq('platform', platform)
        .eq('status', 'pending');

      if (!pending || pending.length === 0) continue;

      // Calculate total
      const total = pending.reduce((sum, item) => sum + parseFloat(item.amount), 0);

      // If total meets minimum, batch fund
      if (total >= minimums[platform]) {
        const batchId = crypto.randomUUID();

        // Update all items to batched
        await supabaseClient
          .from('batch_funding_queue')
          .update({ status: 'batched', batch_id: batchId, processed_at: new Date().toISOString() })
          .in('id', pending.map(p => p.id));

        // Fund each campaign
        for (const item of pending) {
          await fundCampaign(supabaseClient, item);
        }

        console.log(`Batched ${pending.length} ${platform} campaigns for $${total}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Batch processing complete' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Batch funding error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fundCampaign(supabase: any, item: any) {
  // Deduct from wallet
  const { data: wallet } = await supabase
    .from('ad_wallets')
    .select('*')
    .eq('user_id', item.user_id)
    .single();

  if (!wallet || wallet.balance < parseFloat(item.amount)) {
    await supabase
      .from('batch_funding_queue')
      .update({ status: 'failed' })
      .eq('id', item.id);
    return;
  }

  // Update wallet balance
  await supabase
    .from('ad_wallets')
    .update({
      balance: wallet.balance - parseFloat(item.amount),
      total_spent: wallet.total_spent + parseFloat(item.amount)
    })
    .eq('id', wallet.id);

  // Log transaction
  await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      user_id: item.user_id,
      type: 'batch_fund',
      amount: -parseFloat(item.amount),
      campaign_id: item.campaign_id,
      description: `Batch funded ${item.platform} campaign`
    });

  // Update queue status
  await supabase
    .from('batch_funding_queue')
    .update({ status: 'funded' })
    .eq('id', item.id);
}