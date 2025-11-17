import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, candidateName, race, electionYear, adCopy } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Generate unique ad ID for verification URL
    const adId = crypto.randomUUID();
    const verifyUrl = `https://xixoi.com/verify/ad/${adId}`;

    // Generate signature hash for the ad
    const payload = `${candidateName}|${race}|${electionYear}|${adCopy}|${Date.now()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Generated signature:', signature.substring(0, 16) + '...');
    console.log('Verification URL:', verifyUrl);

    // Create visible watermark with QR code using AI image editing
    const watermarkPrompt = `Add a professional political ad verification watermark to this image with two elements:

1. BOTTOM-RIGHT CORNER: A semi-transparent badge (60% opacity, black background with white text) containing:
   - "xiXoi™ Verified Political Ad"
   - "Candidate: ${candidateName}"
   - "Election ${electionYear}"

2. BOTTOM-LEFT CORNER: A small, scannable QR code (approximately 80x80 pixels) with:
   - White background, black QR code pattern
   - The QR code should encode this URL: ${verifyUrl}
   - Make sure the QR code is clear and scannable

Make both elements professional and minimal, not too intrusive. The watermark should indicate this is a verified political advertisement.`;

    console.log('Calling Lovable AI for watermark generation...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: watermarkPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI watermark generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const watermarkedImageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!watermarkedImageBase64) {
      throw new Error('No watermarked image returned from AI');
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = watermarkedImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload watermarked image to Supabase storage
    const fileName = `political-watermark-${signature.substring(0, 12)}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('campaign-assets')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload watermarked image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('campaign-assets')
      .getPublicUrl(fileName);

    console.log('Successfully watermarked and uploaded:', publicUrl);

    return new Response(
      JSON.stringify({
        watermarkUrl: publicUrl,
        signatureBase58: signature,
        verifyUrl: verifyUrl,
        timestamp: Date.now()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in sign-political-ad:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
