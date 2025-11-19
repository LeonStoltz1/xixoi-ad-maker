import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read Meta credentials from secrets
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');
    const metaAdAccountId = Deno.env.get('META_AD_ACCOUNT_ID');

    if (!metaAccessToken || !metaAdAccountId) {
      throw new Error('META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be configured as secrets');
    }

    console.log('Encrypting Meta access token...');
    const encryptedToken = await encrypt(metaAccessToken);

    console.log('Storing Meta credentials in database...');
    const { data, error } = await supabase
      .from('platform_credentials')
      .upsert({
        platform: 'meta',
        platform_account_id: metaAdAccountId,
        access_token: encryptedToken,
        owner_type: 'system',
        status: 'connected',
        account_name: 'xiXoi Master Account'
      }, {
        onConflict: 'platform,owner_type,owner_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Meta credentials successfully stored');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Meta master credentials initialized successfully',
        credential: {
          platform: data.platform,
          account_id: data.platform_account_id,
          status: data.status
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Setup error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to setup credentials', details: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
