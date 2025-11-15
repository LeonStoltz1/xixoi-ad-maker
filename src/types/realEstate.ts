export interface RealEstateDetails {
  propertyType: string;
  city: string;
  stateOrRegion: string;
  neighborhood?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  keyFeatures?: string[];
  nearbyHighlights?: string[];
  realtorName: string;
  brokerageName: string;
  includeEHO?: boolean;
}

export type Platform = "meta" | "google" | "tiktok" | "linkedin" | "x";
