import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Fetched HTML length:', html.length);

    // Extract images from HTML
    const images: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      let imgUrl = match[1];
      
      // Convert relative URLs to absolute
      if (imgUrl.startsWith('//')) {
        imgUrl = 'https:' + imgUrl;
      } else if (imgUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imgUrl = urlObj.origin + imgUrl;
      } else if (!imgUrl.startsWith('http')) {
        const urlObj = new URL(url);
        imgUrl = new URL(imgUrl, urlObj.href).href;
      }

      // Filter out tiny images, icons, and common tracking pixels
      if (
        !imgUrl.includes('favicon') &&
        !imgUrl.includes('icon') &&
        !imgUrl.includes('logo') &&
        !imgUrl.includes('pixel') &&
        !imgUrl.includes('tracking') &&
        !imgUrl.match(/\d+x\d+/) // Skip images with dimensions in filename
      ) {
        images.push(imgUrl);
      }
    }

    // Also check for Open Graph images (usually the best quality)
    const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    while ((match = ogImageRegex.exec(html)) !== null) {
      images.unshift(match[1]); // Add OG images to the front
    }

    // Remove duplicates
    const uniqueImages = [...new Set(images)];
    console.log('Found images:', uniqueImages.length);

    // Extract text content (title, description, headings, paragraphs)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract main content (remove script, style, and nav tags)
    let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleanHtml = cleanHtml.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    cleanHtml = cleanHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    cleanHtml = cleanHtml.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

    // Extract headings and paragraphs
    const headings: string[] = [];
    const h1Regex = /<h1[^>]*>([^<]+)<\/h1>/gi;
    const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
    
    while ((match = h1Regex.exec(cleanHtml)) !== null) {
      headings.push(match[1].trim());
    }
    while ((match = h2Regex.exec(cleanHtml)) !== null) {
      headings.push(match[1].trim());
    }

    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([^<]+)<\/p>/gi;
    while ((match = pRegex.exec(cleanHtml)) !== null) {
      const text = match[1].trim();
      if (text.length > 50) { // Only substantial paragraphs
        paragraphs.push(text);
      }
    }

    // Combine extracted content
    let content = '';
    if (title) content += title + '. ';
    if (description) content += description + ' ';
    if (headings.length > 0) content += headings.slice(0, 3).join('. ') + '. ';
    if (paragraphs.length > 0) content += paragraphs.slice(0, 3).join(' ');

    // Limit content to 1000 chars
    content = content.slice(0, 1000).trim();

    console.log('Extracted content length:', content.length);
    console.log('Title:', title);

    return new Response(
      JSON.stringify({
        images: uniqueImages.slice(0, 12), // Limit to 12 images
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