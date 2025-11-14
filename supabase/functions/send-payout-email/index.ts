import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

interface PayoutEmailData {
  email: string;
  affiliateCode: string;
  amount: number;
  month: string;
  totalEarned: number;
  referralCount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, affiliateCode, amount, month, totalEarned, referralCount }: PayoutEmailData = await req.json();

    console.log('Sending payout email to:', email);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Monthly Payout from xiXoi™</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">xiXoi™</h1>
                      <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">Affiliate Program</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #18181b; font-size: 24px; font-weight: bold;">
                        🎉 Your Monthly Payout is Here!
                      </h2>
                      
                      <p style="margin: 0 0 20px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Hi <strong>${affiliateCode}</strong>,
                      </p>

                      <p style="margin: 0 0 30px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Great news! Your monthly affiliate payout for <strong>${month}</strong> has been processed and is on its way to your bank account.
                      </p>

                      <!-- Payout Details -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5; border-radius: 8px; margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 30px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 0 0 15px 0;">
                                  <p style="margin: 0; color: #71717a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">This Month's Payout</p>
                                  <p style="margin: 5px 0 0 0; color: #18181b; font-size: 32px; font-weight: bold;">$${amount.toFixed(2)}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 15px 0; border-top: 1px solid #e4e4e7;">
                                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                      <td style="width: 50%; padding: 0;">
                                        <p style="margin: 0; color: #71717a; font-size: 14px;">Active Referrals</p>
                                        <p style="margin: 5px 0 0 0; color: #18181b; font-size: 20px; font-weight: 600;">${referralCount}</p>
                                      </td>
                                      <td style="width: 50%; padding: 0; text-align: right;">
                                        <p style="margin: 0; color: #71717a; font-size: 14px;">Total Earned</p>
                                        <p style="margin: 5px 0 0 0; color: #18181b; font-size: 20px; font-weight: 600;">$${totalEarned.toFixed(2)}</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 20px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Funds should arrive in your bank account within <strong>3-5 business days</strong>.
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td style="border-radius: 6px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                            <a href="https://xixoi.com/affiliates" style="border: 0; color: #ffffff; padding: 14px 28px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 16px;">
                              View Dashboard
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        Keep up the great work! The more referrals you bring, the more you earn. Share your unique link and watch your passive income grow.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #71717a; font-size: 14px;">
                        Questions? Email us at <a href="mailto:support@xixoi.com" style="color: #6366f1; text-decoration: none;">support@xixoi.com</a>
                      </p>
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                        © ${new Date().getFullYear()} xiXoi™. All rights reserved.<br>
                        A product of STOLTZ ONE LLC
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'xiXoi Affiliate Program <payouts@xixoi.com>',
      to: [email],
      subject: `💰 Your $${amount.toFixed(2)} Payout from xiXoi™ - ${month}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending payout email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
