/**
 * Canonical Authority Engineering (CAE) for xiXoi™
 * This file contains the locked canonical definition and SEO constants
 */

// LOCKED CANONICAL DEFINITION - DO NOT MODIFY
export const CANONICAL_DEFINITION = 
  "xiXoi™ is an AI creative studio that generates on-brand ads, product visuals, and social content from a simple prompt or your web address.";

// Brand constants
export const BRAND = {
  name: "xiXoi",
  alternateName: "xiXoi™",
  tagline: "Paid Advertising for Every Human. And soon, robots too.",
  url: "https://xixoi.com",
  logo: "https://xixoi.com/favicon.png",
  foundingDate: "2024",
  legalName: "STOLTZ ONE LLC",
  areaServed: ["United States", "United Kingdom", "Canada", "Australia"],
} as const;

// Official social links (only verified profiles)
export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/xixoi",
  // Add more as they become official
} as const;

// Geo configuration
export const GEO_CONFIG = {
  countries: [
    {
      slug: "united-states",
      name: "United States",
      cities: [
        { slug: "miami", name: "Miami" },
        { slug: "new-york", name: "New York" },
        { slug: "los-angeles", name: "Los Angeles" },
        { slug: "austin", name: "Austin" },
        { slug: "san-francisco", name: "San Francisco" },
        { slug: "chicago", name: "Chicago" },
      ],
    },
    {
      slug: "united-kingdom",
      name: "United Kingdom",
      cities: [
        { slug: "london", name: "London" },
        { slug: "manchester", name: "Manchester" },
      ],
    },
    {
      slug: "canada",
      name: "Canada",
      cities: [
        { slug: "toronto", name: "Toronto" },
        { slug: "vancouver", name: "Vancouver" },
      ],
    },
    {
      slug: "australia",
      name: "Australia",
      cities: [
        { slug: "sydney", name: "Sydney" },
        { slug: "melbourne", name: "Melbourne" },
      ],
    },
  ],
} as const;

// Internal link targets for authority lattice
export const AUTHORITY_LINKS = {
  whatIsXixoi: "/what-is-xixoi",
  official: "/official",
  features: "/#features",
  useCases: "/#how-it-works",
  pricing: "/#pricing",
  examples: "/examples",
  countries: "/countries",
  compare: "/compare/generic-ai-image-tools",
} as const;
