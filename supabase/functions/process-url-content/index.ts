import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function resolveUrl(imgUrl: string, baseUrl: string): string {
  try {
    if (imgUrl.startsWith('//')) return 'https:' + imgUrl;
    if (imgUrl.startsWith('/')) return new URL(baseUrl).origin + imgUrl;
    if (!imgUrl.startsWith('http')) return new URL(imgUrl, baseUrl).href;
    return imgUrl;
  } catch {
    return imgUrl;
  }
}

function shouldIncludeImage(url: string): boolean {
  const lowUrl = url.toLowerCase();
  const excludePatterns = ['favicon', 'icon', 'logo', 'pixel', 'tracking', 'spacer', 'blank', 'transparent', 'spinner', 'loader', 'badge', '1x1', 'analytics', 'beacon'];
  for (const pattern of excludePatterns) {
    if (lowUrl.includes(pattern)) return false;
  }
  if (url.startsWith('data:') && url.length < 500) return false;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; xiXoi/1.0)', 'Accept': 'text/html' },
    });

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const html = await response.text();
    const images: string[] = [];

    // Extract OG images (highest priority)
    const ogMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogMatch) {
      const imgUrl = resolveUrl(ogMatch[1], url);
      if (shouldIncludeImage(imgUrl)) images.push(imgUrl);
    }

    // Extract Twitter images
    const twitterMatch = html.match(/<meta[^>]+(?:property|name)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (twitterMatch) {
      const imgUrl = resolveUrl(twitterMatch[1], url);
      if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) images.push(imgUrl);
    }

    // Extract regular img tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null && images.length < 15) {
      const imgUrl = resolveUrl(match[1], url);
      if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    // Extract data-src (lazy loading)
    const dataSrcRegex = /<img[^>]+data-src=["']([^"']+)["']/gi;
    while ((match = dataSrcRegex.exec(html)) !== null && images.length < 15) {
      const imgUrl = resolveUrl(match[1], url);
      if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    // Validate first 10 images with HEAD requests
    const validatedImages: string[] = [];
    for (const img of images.slice(0, 10)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const headRes = await fetch(img, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        if (headRes.ok) validatedImages.push(img);
      } catch {
        // Skip invalid images
      }
      if (validatedImages.length >= 5) break;
    }

    // Extract text content
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    const content = [title, description].filter(Boolean).join('. ').slice(0, 500);

    console.log('Found', validatedImages.length, 'valid images');

    return new Response(
      JSON.stringify({ images: validatedImages, content, title }),
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
