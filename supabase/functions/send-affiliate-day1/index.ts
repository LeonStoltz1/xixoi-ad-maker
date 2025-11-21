import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@4.0.0';
import { supabaseClient } from '../_shared/supabase.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Day1EmailRequest {
  affiliateId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { affiliateId }: Day1EmailRequest = await req.json();
    console.log('Sending Day 1 email for affiliate:', affiliateId);

    const supabase = supabaseClient();

    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('id', affiliateId)
      .single();

    if (affiliateError || !affiliate) {
      throw new Error(`Affiliate not found: ${affiliateError?.message}`);
    }

    const profile = affiliate.profiles as any;
    const affiliateName = profile?.full_name || 'there';
    const email = profile?.email;

    if (!email) {
      throw new Error('Affiliate email not found');
    }

    const referralLink = `https://xixoi.com?ref=${affiliate.code}`;
    const dashboardUrl = 'https://xixoi.com/affiliates';

    // Build HTML email directly (React Email requires complex Deno setup)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
            <h1 style="color: #000; font-size: 32px; font-weight: bold; margin: 0 0 24px 0;">🎉 Welcome to xiXoi Affiliates!</h1>
            
            <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 16px 0;">Hey ${affiliateName},</p>
            
            <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 24px 0;">
              You're now part of the most profitable affiliate program in AI ads. 
              Here's everything you need to start earning <strong>50% recurring commissions for 12 months</strong>.
            </p>

            <div style="background: #f4f4f4; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e0e0e0;">
              <p style="color: #666; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">Your Referral Link:</p>
              <a href="${referralLink}" style="color: #000; font-size: 14px; font-family: monospace; word-break: break-all;">${referralLink}</a>
              <p style="color: #666; font-size: 14px; font-weight: bold; margin: 12px 0 0 0;">Your Code: <strong>${affiliate.code}</strong></p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">

            <h2 style="color: #000; font-size: 24px; font-weight: bold; margin: 0 0 16px 0;">🚀 The "First $500" Challenge</h2>
            <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 16px 0;">
              Over the next 7 days, we'll send you everything you need to earn your first $500:
            </p>
            
            <ul style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 24px 0; padding-left: 20px;">
              <li><strong>Day 1 (Today):</strong> Your link + first scripts</li>
              <li><strong>Day 2:</strong> 3 viral hooks that convert</li>
              <li><strong>Day 3:</strong> Faceless content kit (no camera needed)</li>
              <li><strong>Day 4:</strong> Turn 1 video into 12 posts</li>
              <li><strong>Day 5:</strong> How to get 10 signups/week</li>
              <li><strong>Day 6:</strong> Advanced tactics (duets, trends)</li>
              <li><strong>Day 7:</strong> Challenge completion bonus!</li>
            </ul>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">

            <h2 style="color: #000; font-size: 24px; font-weight: bold; margin: 0 0 16px 0;">📋 Your First 3 Scripts</h2>
            
            <div style="background: #fafafa; border-left: 4px solid #000; padding: 16px; margin: 16px 0;">
              <p style="color: #000; font-size: 16px; font-weight: bold; margin: 0 0 12px 0;">Script #1: "The Tool No One Knows About"</p>
              <p style="color: #333; font-size: 14px; line-height: 22px; margin: 0; font-style: italic;">
                "You're leaving money on the table if you aren't using this... I found this AI tool called xiXoi that creates full ads for small businesses in 60 seconds. Copy, image, targeting—everything. I became an affiliate and they're paying 50% recurring commissions for 12 months for every paid user. Click my link and see it yourself."
              </p>
            </div>

            <div style="background: #fafafa; border-left: 4px solid #000; padding: 16px; margin: 16px 0;">
              <p style="color: #000; font-size: 16px; font-weight: bold; margin: 0 0 12px 0;">Script #2: "Watch Me Make Money"</p>
              <p style="color: #333; font-size: 14px; line-height: 22px; margin: 0; font-style: italic;">
                "Watch me make passive income using AI... I promote xiXoi—it's an AI ad creator. Every time someone signs up, I get paid 50% for 12 months. I don't need clients. Just post videos, tutorials, or reviews. Use my link to test the tool for free."
              </p>
            </div>

            <div style="background: #fafafa; border-left: 4px solid #000; padding: 16px; margin: 16px 0;">
              <p style="color: #000; font-size: 16px; font-weight: bold; margin: 0 0 12px 0;">Script #3: "Agency Hack"</p>
              <p style="color: #333; font-size: 14px; line-height: 22px; margin: 0; font-style: italic;">
                "I replaced my ad agency with this... [Show xiXoi generating an ad on screen] I became an affiliate because the tool sells itself. Link in bio."
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">

            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardUrl}" style="background-color: #000; border-radius: 8px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 16px 32px; display: inline-block;">
                View Your Dashboard
              </a>
              <p style="color: #333; font-size: 16px; text-align: center; margin-top: 16px;">
                Track clicks, signups, and earnings in real-time
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">

            <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 16px 0;">
              Questions? Reply to this email or visit your <a href="${dashboardUrl}" style="color: #000; text-decoration: underline;">affiliate dashboard</a>.
            </p>

            <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 16px 0;">
              <strong>xiXoi™</strong> - Paid Advertising for Every Human<br>
              A product of STOLTZ ONE LLC
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'xiXoi Affiliates <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Welcome to xiXoi Affiliates - Your First $500 Challenge Starts Now!',
      html,
    });

    if (emailError) {
      throw emailError;
    }

    // Mark Day 1 as sent
    await supabase
      .from('affiliate_onboarding_progress')
      .upsert({
        affiliate_id: affiliateId,
        day_number: 1,
        email_sent_at: new Date().toISOString(),
      });

    console.log('Day 1 email sent successfully to:', email);

    return new Response(
      JSON.stringify({ success: true, email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending Day 1 email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
