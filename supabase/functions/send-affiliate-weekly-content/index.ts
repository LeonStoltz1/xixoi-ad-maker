import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { supabaseClient } from '../_shared/supabase.ts';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { WeeklyContentEmail } from './_templates/weekly-content.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    // Calculate last week's date range
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEnd = now;

    // Fetch top-performing content from last week
    const { data: topContent, error: contentError } = await supabase
      .from('affiliate_content_swipes')
      .select('*')
      .gte('week_start', weekStart.toISOString())
      .lte('week_end', weekEnd.toISOString())
      .order('performance_score', { ascending: false })
      .limit(10);

    if (contentError) {
      console.error('Error fetching content:', contentError);
      throw contentError;
    }

    // Separate hooks and scripts
    const topHooks = (topContent || [])
      .filter(c => c.content_type === 'hook')
      .slice(0, 3);
    
    const topScripts = (topContent || [])
      .filter(c => c.content_type === 'script')
      .slice(0, 3);

    // Fetch all active affiliates
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('id, code, profiles(email, full_name)')
      .eq('affiliate_tier', 'active')
      .or('affiliate_tier.eq.power,affiliate_tier.eq.super');

    if (affiliatesError) {
      console.error('Error fetching affiliates:', affiliatesError);
      throw affiliatesError;
    }

    // Send email to each affiliate
    const emailPromises = (affiliates || []).map(async (affiliate: any) => {
      const email = affiliate.profiles?.email;
      const name = affiliate.profiles?.full_name || 'there';

      if (!email) return null;

      const html = await renderAsync(
        React.createElement(WeeklyContentEmail, {
          affiliateName: name,
          weekStart: weekStart.toLocaleDateString(),
          weekEnd: weekEnd.toLocaleDateString(),
          topHooks,
          topScripts,
        })
      );

      return resend.emails.send({
        from: 'xiXoi Affiliate Program <affiliates@xixoi.com>',
        to: [email],
        subject: '📦 Your Weekly Content Swipe Pack',
        html,
      });
    });

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailPromises.length,
        topHooks: topHooks.length,
        topScripts: topScripts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending weekly content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
