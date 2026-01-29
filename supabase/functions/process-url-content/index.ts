import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple MD5 hash for cache key
async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (24 hour expiry)
    const urlHash = await hashUrl(url);
    const { data: cached } = await supabase
      .from('url_extractions_cache')
      .select('*')
      .eq('url_hash', urlHash)
      .single();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge < CACHE_TTL) {
        console.log('Cache hit for:', url);
        return new Response(
          JSON.stringify({ 
            images: cached.images, 
            content: cached.content, 
            title: cached.title,
            cached: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Cache expired, delete it
        await supabase.from('url_extractions_cache').delete().eq('url_hash', urlHash);
      }
    }

    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; xiXoi/1.0)', 'Accept': 'text/html' },
    });

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const html = await response.text();
    const images: string[] = [];
    const baseOrigin = new URL(url).origin;

    // Helper to resolve URLs
    const resolve = (src: string): string => {
      if (src.startsWith('//')) return 'https:' + src;
      if (src.startsWith('/')) return baseOrigin + src;
      if (!src.startsWith('http')) return baseOrigin + '/' + src;
      return src;
    };

    // Extract OG image (highest priority)
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) images.push(resolve(ogMatch[1]));

    // Extract Twitter image
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch?.[1] && !images.includes(resolve(twMatch[1]))) images.push(resolve(twMatch[1]));

    // Extract img src attributes
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const m of imgMatches) {
      if (images.length >= 8) break;
      const src = resolve(m[1]);
      const lower = src.toLowerCase();
      // Skip icons, trackers, tiny images
      if (lower.includes('favicon') || lower.includes('icon') || lower.includes('logo') ||
          lower.includes('pixel') || lower.includes('tracking') || lower.includes('1x1') ||
          lower.includes('spacer') || lower.includes('blank') || lower.includes('spinner')) continue;
      if (!images.includes(src)) images.push(src);
    }

    // Extract title and description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    
    const title = titleMatch?.[1]?.trim() || '';
    const description = descMatch?.[1]?.trim() || '';
    const content = [title, description].filter(Boolean).join('. ').slice(0, 500);

    const finalImages = images.slice(0, 5);

    // Store in cache
    try {
      await supabase
        .from('url_extractions_cache')
        .upsert({
          url_hash: urlHash,
          url,
          images: finalImages,
          content,
          title,
          created_at: new Date().toISOString()
        }, { onConflict: 'url_hash' });
      console.log('Cached extraction for:', url);
    } catch (cacheError) {
      console.warn('Cache write failed:', cacheError);
    }

    console.log('Found', finalImages.length, 'images');

    return new Response(
      JSON.stringify({ images: finalImages, content, title }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to process URL' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
