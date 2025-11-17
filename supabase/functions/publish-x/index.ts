import { supabaseClient } from "../_shared/supabase.ts";
import { getSystemCredentials } from "../_shared/credentials.ts";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate OAuth 1.0a signature for Twitter API v2
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  
  return signature;
}

// Generate OAuth authorization header
function generateOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    accessTokenSecret
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return (
    "OAuth " +
    Object.entries(signedOAuthParams)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, userId } = await req.json();

    console.log('Publishing to X for campaign:', campaignId);

    // Get system credentials for X
    const credentials = await getSystemCredentials('x');
    console.log('Retrieved system credentials for X');

    // Fetch campaign and ad variant
    const supabase = supabaseClient();
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, ad_variants(*)')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Get the X variant
    const xVariant = campaign.ad_variants.find((v: any) => v.variant_type === 'x');
    if (!xVariant) {
      throw new Error('No X ad variant found for this campaign');
    }

    // Construct tweet text (headline + body)
    const tweetText = xVariant.headline 
      ? `${xVariant.headline}\n\n${xVariant.body_copy}` 
      : xVariant.body_copy;

    console.log('Tweet text:', tweetText);

    // Twitter API v2 endpoint
    const url = 'https://api.x.com/2/tweets';
    const method = 'POST';

    // Parse credentials (assuming format: consumer_key:consumer_secret for access_token field)
    // and access token details stored separately
    const [consumerKey, consumerSecret] = credentials.accessToken.split(':');
    const [accessToken, accessTokenSecret] = (credentials.refreshToken || ':').split(':');

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      throw new Error('Invalid X credentials format. Expected consumer_key:consumer_secret in access_token and access_token:access_token_secret in refresh_token');
    }

    // Generate OAuth header
    const oauthHeader = generateOAuthHeader(
      method,
      url,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret
    );

    console.log('Sending tweet to Twitter API...');

    // Post tweet
    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: oauthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
    });

    const responseText = await response.text();
    console.log('Twitter API response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
    }

    const xResponse = JSON.parse(responseText);
    console.log('Tweet published successfully:', xResponse);

    // Update campaign with X IDs
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      throw updateError;
    }

    // Create campaign platform status record
    const { error: statusError } = await supabase
      .from('campaign_platform_status')
      .insert({
        campaign_id: campaignId,
        platform: 'x',
        platform_campaign_id: xResponse.data?.id || null,
        is_active: true,
        last_sync: new Date().toISOString()
      });

    if (statusError) {
      console.error('Error creating platform status:', statusError);
    }

    console.log('Campaign updated successfully with X data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        xIds: xResponse,
        tweetId: xResponse.data?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in publish-x:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'X publishing failed', details: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
