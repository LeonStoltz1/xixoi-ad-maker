import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = supabaseClient();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get current usage and limits from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('political_ads_used, political_ads_limit, political_tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch profile');
    }

    // Check if user has political tier
    if (!profile.political_tier) {
      return new Response(
        JSON.stringify({ 
          error: 'Political tier required',
          message: 'Upgrade to Political Mode ($99/month) to create political ads'
        }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const currentUsage = profile.political_ads_used || 0;
    const monthlyLimit = profile.political_ads_limit || 100;

    // Check if quota exceeded
    if (currentUsage >= monthlyLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Quota exceeded',
          message: `You've reached your monthly limit of ${monthlyLimit} political ads. Your quota resets at the start of next month.`,
          usage: currentUsage,
          limit: monthlyLimit
        }), 
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Increment usage counter
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        political_ads_used: currentUsage + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update usage counter');
    }

    console.log(`Incremented political ad usage for user ${user.id}: ${currentUsage + 1}/${monthlyLimit}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        usage: currentUsage + 1,
        limit: monthlyLimit,
        remaining: monthlyLimit - (currentUsage + 1)
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in increment-political-usage:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
