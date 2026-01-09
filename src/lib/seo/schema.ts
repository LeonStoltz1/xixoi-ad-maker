/**
 * Schema.org JSON-LD helpers for CAE
 */

import { BRAND, CANONICAL_DEFINITION, SOCIAL_LINKS } from "./canonical";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Build Organization JSON-LD
 */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    alternateName: BRAND.alternateName,
    url: BRAND.url,
    logo: BRAND.logo,
    description: CANONICAL_DEFINITION,
    foundingDate: BRAND.foundingDate,
    sameAs: Object.values(SOCIAL_LINKS),
    parentOrganization: {
      "@type": "Organization",
      name: BRAND.legalName,
      address: {
        "@type": "PostalAddress",
        addressCountry: "US",
        addressRegion: "Georgia",
      },
    },
  };
}

/**
 * Build WebSite JSON-LD
 */
export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    alternateName: BRAND.alternateName,
    url: BRAND.url,
    description: CANONICAL_DEFINITION,
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
    },
  };
}

/**
 * Build SoftwareApplication JSON-LD
 */
export function buildSoftwareApplicationJsonLd(options?: { 
  url?: string; 
  areaServed?: string | string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    alternateName: BRAND.alternateName,
    description: CANONICAL_DEFINITION,
    url: options?.url || BRAND.url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "49",
      priceCurrency: "USD",
    },
    ...(options?.areaServed && { areaServed: options.areaServed }),
  };
}

/**
 * Build BreadcrumbList JSON-LD
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BRAND.url}${item.url}`,
    })),
  };
}

/**
 * Build FAQPage JSON-LD
 */
export function buildFaqJsonLd(faqItems: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Build WebPage JSON-LD
 */
export function buildWebPageJsonLd(options: {
  url: string;
  title: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.title,
    url: options.url.startsWith("http") ? options.url : `${BRAND.url}${options.url}`,
    description: options.description || CANONICAL_DEFINITION,
    isPartOf: {
      "@type": "WebSite",
      name: BRAND.name,
      url: BRAND.url,
    },
  };
}
