import { useEffect } from "react";
import { BRAND } from "@/lib/seo/canonical";

interface PageMetaProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
}

/**
 * Component to set page meta tags dynamically
 */
export function PageMeta({ title, description, canonicalPath, ogImage }: PageMetaProps) {
  useEffect(() => {
    // Set document title
    document.title = `${title} | ${BRAND.alternateName}`;

    // Set or update meta tags
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard meta
    setMeta("description", description);

    // Open Graph
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", `${BRAND.url}${canonicalPath}`, true);
    setMeta("og:type", "website", true);
    if (ogImage) {
      setMeta("og:image", ogImage, true);
    }

    // Twitter
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${BRAND.url}${canonicalPath}`;

    return () => {
      // Cleanup is optional since we're just updating existing tags
    };
  }, [title, description, canonicalPath, ogImage]);

  return null;
}
