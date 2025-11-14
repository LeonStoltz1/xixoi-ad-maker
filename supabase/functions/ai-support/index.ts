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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { subject, message } = await req.json();

    // Create ticket
    const { data: ticket } = await supabaseClient
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        message,
        status: 'open'
      })
      .select()
      .single();

    // Call AI for auto-response
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `You are xiXoi™ support AI. Help users with:
- How to reload ad spend: "Go to Dashboard → Add Ad Budget → Enter amount → Pay"
- How to remove watermark: "Upgrade to Pro ($99/mo) or pay $29 per campaign"
- How ads go live: "Ads launch in under 5 minutes after payment"
- Refund policy: "No refunds once ads are live"
- Contact support: "For complex issues, email support@xixoi.com"

Be friendly, concise, and helpful. If you can solve it, mark as resolved. If not, escalate.`
          },
          { role: 'user', content: `Subject: ${subject}\n\n${message}` }
        ]
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiAnswer = aiData.choices[0].message.content;

    // Check if AI can resolve
    const canResolve = !aiAnswer.toLowerCase().includes('escalate') && 
                       !aiAnswer.toLowerCase().includes('contact support');

    // Update ticket
    await supabaseClient
      .from('support_tickets')
      .update({
        ai_response: aiAnswer,
        status: canResolve ? 'ai_resolved' : 'escalated',
        resolved_at: canResolve ? new Date().toISOString() : null
      })
      .eq('id', ticket.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticket_id: ticket.id,
        ai_response: aiAnswer,
        status: canResolve ? 'resolved' : 'escalated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('AI support error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});