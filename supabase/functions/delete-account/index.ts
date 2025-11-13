import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting account deletion for user: ${user.id}`);

    // First, get all campaign IDs for this user
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', user.id);

    const campaignIds = campaigns?.map(c => c.id) || [];

    // Delete user data in order (respecting foreign key constraints)
    // 1. Delete ad variants (references campaigns)
    if (campaignIds.length > 0) {
      const { error: variantsError } = await supabase
        .from('ad_variants')
        .delete()
        .in('campaign_id', campaignIds);

      if (variantsError) {
        console.error('Error deleting ad variants:', variantsError);
      }

      // 2. Delete campaign assets (references campaigns)
      const { error: assetsError } = await supabase
        .from('campaign_assets')
        .delete()
        .in('campaign_id', campaignIds);

      if (assetsError) {
        console.error('Error deleting campaign assets:', assetsError);
      }

      // 3. Delete campaign channels (references campaigns)
      const { error: channelsError } = await supabase
        .from('campaign_channels')
        .delete()
        .in('campaign_id', campaignIds);

      if (channelsError) {
        console.error('Error deleting campaign channels:', channelsError);
      }
    }

    // 4. Delete campaigns
    const { error: campaignsError } = await supabase
      .from('campaigns')
      .delete()
      .eq('user_id', user.id);

    if (campaignsError) {
      console.error('Error deleting campaigns:', campaignsError);
    }

    // 5. Delete payment transactions
    const { error: transactionsError } = await supabase
      .from('payment_transactions')
      .delete()
      .eq('user_id', user.id);

    if (transactionsError) {
      console.error('Error deleting payment transactions:', transactionsError);
    }

    // 6. Delete subscriptions
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError);
    }

    // 7. Delete stripe customer record
    const { error: stripeCustomerError } = await supabase
      .from('stripe_customers')
      .delete()
      .eq('user_id', user.id);

    if (stripeCustomerError) {
      console.error('Error deleting stripe customer:', stripeCustomerError);
    }

    // 8. Delete ad spend tracking (keep for 7 years per compliance - mark as deleted instead)
    // Note: Not deleting ad_spend_tracking to comply with tax/accounting retention requirements

    // 9. Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // 10. Delete storage files from campaign-assets bucket
    const { data: storageFiles, error: listError } = await supabase
      .storage
      .from('campaign-assets')
      .list(user.id);

    if (!listError && storageFiles && storageFiles.length > 0) {
      const filePaths = storageFiles.map(file => `${user.id}/${file.name}`);
      const { error: storageError } = await supabase
        .storage
        .from('campaign-assets')
        .remove(filePaths);

      if (storageError) {
        console.error('Error deleting storage files:', storageError);
      }
    }

    // 11. Finally, delete the auth user (this cascades to anything with ON DELETE CASCADE)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Account deletion completed for user: ${user.id}`);

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
