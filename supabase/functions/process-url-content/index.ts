import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate image accessibility with HEAD request
async function validateImage(url: string): Promise<{ valid: boolean; url: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; xiXoi/1.0; +https://xixoi.com)',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return { valid: false, url };
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.startsWith('image/')) {
      return { valid: true, url };
    }
    
    // Accept if no content-type but URL looks like an image
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) {
      return { valid: true, url };
    }
    
    return { valid: false, url };
  } catch {
    return { valid: false, url };
  }
}

// Extract best URL from srcset attribute
function extractFromSrcset(srcset: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const parts = srcset.split(',');
  
  for (const part of parts) {
    const [url] = part.trim().split(/\s+/);
    if (url) {
      urls.push(resolveUrl(url, baseUrl));
    }
  }
  
  return urls;
}

// Resolve relative URLs to absolute
function resolveUrl(imgUrl: string, baseUrl: string): string {
  try {
    if (imgUrl.startsWith('//')) {
      return 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      return urlObj.origin + imgUrl;
    } else if (!imgUrl.startsWith('http')) {
      return new URL(imgUrl, baseUrl).href;
    }
    return imgUrl;
  } catch {
    return imgUrl;
  }
}

// Filter out unwanted images
function shouldIncludeImage(url: string): boolean {
  const lowUrl = url.toLowerCase();
  const excludePatterns = [
    'favicon', 'icon', 'logo', 'pixel', 'tracking', 'spacer',
    'blank', 'transparent', 'spinner', 'loader', 'badge',
    '1x1', '2x2', 'analytics', 'beacon', 'ad-', 'ads-'
  ];
  
  for (const pattern of excludePatterns) {
    if (lowUrl.includes(pattern)) return false;
  }
  
  // Skip data URIs that are tiny
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
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching content from URL:', url);

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; xiXoi/1.0; +https://xixoi.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Fetched HTML length:', html.length);

    const images: string[] = [];
    let match;

    // 1. Extract Open Graph images (highest priority - usually best quality)
    const ogImageRegex = /<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    while ((match = ogImageRegex.exec(html)) !== null) {
      const imgUrl = resolveUrl(match[1], url);
      if (shouldIncludeImage(imgUrl)) {
        images.push(imgUrl);
      }
    }
    
    // Also check reversed attribute order
    const ogImageRegex2 = /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/gi;
    while ((match = ogImageRegex2.exec(html)) !== null) {
      const imgUrl = resolveUrl(match[1], url);
      if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    // 2. Extract Twitter Card images
    const twitterImageRegex = /<meta[^>]+(?:property|name)=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi;
    while ((match = twitterImageRegex.exec(html)) !== null) {
      const imgUrl = resolveUrl(match[1], url);
      if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    // 3. Extract JSON-LD product images
    const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonData = JSON.parse(match[1]);
        const extractJsonImages = (obj: any): void => {
          if (!obj || typeof obj !== 'object') return;
          
          // Check for image property
          if (obj.image) {
            const imgUrls = Array.isArray(obj.image) ? obj.image : [obj.image];
            for (const img of imgUrls) {
              const imgUrl = typeof img === 'string' ? img : img?.url || img?.contentUrl;
              if (imgUrl && shouldIncludeImage(imgUrl)) {
                const resolved = resolveUrl(imgUrl, url);
                if (!images.includes(resolved)) {
                  images.push(resolved);
                }
              }
            }
          }
          
          // Recurse into arrays and objects
          if (Array.isArray(obj)) {
            obj.forEach(extractJsonImages);
          } else {
            Object.values(obj).forEach(extractJsonImages);
          }
        };
        extractJsonImages(jsonData);
      } catch {
        // Invalid JSON, skip
      }
    }

    // 4. Extract from <picture> elements with srcset
    const pictureRegex = /<picture[^>]*>([\s\S]*?)<\/picture>/gi;
    while ((match = pictureRegex.exec(html)) !== null) {
      const pictureContent = match[1];
      
      // Extract from <source> elements
      const sourceRegex = /<source[^>]+srcset=["']([^"']+)["']/gi;
      let sourceMatch;
      while ((sourceMatch = sourceRegex.exec(pictureContent)) !== null) {
        const srcsetUrls = extractFromSrcset(sourceMatch[1], url);
        for (const imgUrl of srcsetUrls) {
          if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
            images.push(imgUrl);
          }
        }
      }
      
      // Extract from <img> inside picture
      const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(pictureContent);
      if (imgMatch) {
        const imgUrl = resolveUrl(imgMatch[1], url);
        if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
          images.push(imgUrl);
        }
      }
    }

    // 5. Extract from <img> tags with srcset
    const imgSrcsetRegex = /<img[^>]+srcset=["']([^"']+)["'][^>]*>/gi;
    while ((match = imgSrcsetRegex.exec(html)) !== null) {
      const srcsetUrls = extractFromSrcset(match[1], url);
      for (const imgUrl of srcsetUrls) {
        if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
          images.push(imgUrl);
        }
      }
    }

    // 6. Extract regular <img> tags with src
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      const imgUrl = resolveUrl(match[1], url);
      if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    // 7. Extract data-src (lazy loading)
    const dataSrcRegex = /<img[^>]+data-src=["']([^"']+)["']/gi;
    while ((match = dataSrcRegex.exec(html)) !== null) {
      const imgUrl = resolveUrl(match[1], url);
      if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    // 8. Extract data-lazy-src (another lazy loading pattern)
    const dataLazySrcRegex = /<[^>]+data-lazy-src=["']([^"']+)["']/gi;
    while ((match = dataLazySrcRegex.exec(html)) !== null) {
      const imgUrl = resolveUrl(match[1], url);
      if (shouldIncludeImage(imgUrl) && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    console.log('Found images before validation:', images.length);

    // Validate images in parallel (limit to first 20 for performance)
    const imagesToValidate = images.slice(0, 20);
    const validationResults = await Promise.all(
      imagesToValidate.map(img => validateImage(img))
    );
    
    const validatedImages = validationResults
      .filter(result => result.valid)
      .map(result => result.url);

    console.log('Valid images after validation:', validatedImages.length);

    // Extract text content
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract main content (remove script, style, nav, etc.)
    let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleanHtml = cleanHtml.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    cleanHtml = cleanHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    cleanHtml = cleanHtml.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    cleanHtml = cleanHtml.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

    // Extract headings
    const headings: string[] = [];
    const h1Regex = /<h1[^>]*>([^<]+)<\/h1>/gi;
    const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
    
    while ((match = h1Regex.exec(cleanHtml)) !== null) {
      headings.push(match[1].trim());
    }
    while ((match = h2Regex.exec(cleanHtml)) !== null) {
      headings.push(match[1].trim());
    }

    // Extract paragraphs
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([^<]+)<\/p>/gi;
    while ((match = pRegex.exec(cleanHtml)) !== null) {
      const text = match[1].trim();
      if (text.length > 50) {
        paragraphs.push(text);
      }
    }

    // Combine extracted content
    let content = '';
    if (title) content += title + '. ';
    if (description) content += description + ' ';
    if (headings.length > 0) content += headings.slice(0, 3).join('. ') + '. ';
    if (paragraphs.length > 0) content += paragraphs.slice(0, 3).join(' ');

    content = content.slice(0, 1000).trim();

    console.log('Extracted content length:', content.length);
    console.log('Title:', title);

    return new Response(
      JSON.stringify({
        images: validatedImages.slice(0, 12),
        content,
        title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing URL:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process URL' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
