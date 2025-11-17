import { supabaseClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = supabaseClient();

    // Create test account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'facebook.test@xixoi.com',
      password: 'TestXixoi2024!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Meta Test Account'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Test account created:', authData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test account created successfully',
        email: 'facebook.test@xixoi.com',
        password: 'TestXixoi2024!',
        userId: authData.user.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
