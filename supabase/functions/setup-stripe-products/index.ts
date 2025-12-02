import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Stripe product setup...');

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const products = [];

    // Product 0: xiXoi™ Quick-Start ($49/month)
    console.log('Creating Product 0: Quick-Start...');
    const product0 = await stripe.products.create({
      name: 'xiXoi™ Quick-Start',
      description: '$300/week spend cap, 5% service fee, no political ads, master account publishing',
    });
    const price0 = await stripe.prices.create({
      product: product0.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    products.push({
      name: product0.name,
      price_id: price0.id,
      amount: '$49.00/month',
      type: 'subscription',
      secret_name: 'STRIPE_PRICE_QUICKSTART'
    });
    console.log('✅ Product 0 created:', price0.id);

    // Product 1: xiXoi™ Publish Pro - Per Ad Set ($29 one-time)
    console.log('Creating Product 1: Per Ad Set...');
    const product1 = await stripe.products.create({
      name: 'xiXoi™ Publish Pro - Per Ad Set',
      description: 'Remove "Powered By xiXoi™" watermark from one ad campaign',
    });
    const price1 = await stripe.prices.create({
      product: product1.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
    });
    products.push({
      name: product1.name,
      price_id: price1.id,
      amount: '$29.00',
      type: 'one-time',
      secret_name: 'STRIPE_PRICE_BRANDING_REMOVAL'
    });
    console.log('✅ Product 1 created:', price1.id);

    // Product 2: xiXoi™ Publish Pro - Unlimited ($99/month)
    console.log('Creating Product 2: Pro Unlimited...');
    const product2 = await stripe.products.create({
      name: 'xiXoi™ Publish Pro - Unlimited',
      description: 'Unlimited watermark-free ads with 4 AI variants per upload',
    });
    const price2 = await stripe.prices.create({
      product: product2.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    products.push({
      name: product2.name,
      price_id: price2.id,
      amount: '$99.00/month',
      type: 'subscription',
      secret_name: 'STRIPE_PRICE_PRO_UNLIMITED'
    });
    console.log('✅ Product 2 created:', price2.id);

    // Product 3: xiXoi™ Scale Elite ($199/month)
    console.log('Creating Product 3: Scale Elite...');
    const product3 = await stripe.products.create({
      name: 'xiXoi™ Scale Elite',
      description: 'Advanced automation, AI optimizer, auto-pause/increase, custom avatars, affiliate dashboard',
    });
    const price3 = await stripe.prices.create({
      product: product3.id,
      unit_amount: 19900, // $199.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    products.push({
      name: product3.name,
      price_id: price3.id,
      amount: '$199.00/month',
      type: 'subscription',
      secret_name: 'STRIPE_PRICE_ELITE'
    });
    console.log('✅ Product 3 created:', price3.id);

    // Product 4: xiXoi™ Agency White-Label ($999/month)
    console.log('Creating Product 4: Agency White-Label...');
    const product4 = await stripe.products.create({
      name: 'xiXoi™ Agency White-Label',
      description: 'Full white-label platform with team seats, client billing, API access, unlimited variants',
    });
    const price4 = await stripe.prices.create({
      product: product4.id,
      unit_amount: 99900, // $999.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    products.push({
      name: product4.name,
      price_id: price4.id,
      amount: '$999.00/month',
      type: 'subscription',
      secret_name: 'STRIPE_PRICE_AGENCY'
    });
    console.log('✅ Product 4 created:', price4.id);

    console.log('All products created successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All Stripe products created successfully!',
        products,
        next_steps: [
          'Copy the price_id values above',
          'Add them as secrets in Lovable using the secret_name provided',
          'STRIPE_PRICE_QUICKSTART: ' + price0.id,
          'STRIPE_PRICE_BRANDING_REMOVAL: ' + price1.id,
          'STRIPE_PRICE_PRO_UNLIMITED: ' + price2.id,
          'STRIPE_PRICE_ELITE: ' + price3.id,
          'STRIPE_PRICE_AGENCY: ' + price4.id
        ]
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error creating Stripe products:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.type || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
