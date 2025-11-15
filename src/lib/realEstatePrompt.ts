import type { RealEstateDetails } from "@/types/realEstate";

export function buildRealEstateFeatureSummary(details: RealEstateDetails): string {
  const parts: string[] = [];

  const locationLine = [details.neighborhood, details.city, details.stateOrRegion]
    .filter(Boolean)
    .join(", ");

  const header = [details.propertyType || "Property", locationLine].filter(Boolean).join(" — ");

  if (header) parts.push(header);

  const specBits: string[] = [];
  if (details.bedrooms != null) specBits.push(`${details.bedrooms}BR`);
  if (details.bathrooms != null) specBits.push(`${details.bathrooms}BA`);
  if (details.squareFeet != null) specBits.push(`${details.squareFeet}sqft`);
  if (details.price) specBits.push(details.price);

  if (specBits.length) {
    parts.push(specBits.join(" • "));
  }

  if (details.keyFeatures?.length) {
    parts.push(details.keyFeatures.join(" • "));
  }

  if (details.nearbyHighlights?.length) {
    parts.push(`Near: ${details.nearbyHighlights.join(", ")}`);
  }

  return parts.join(" • ");
}

export function buildHousingFooter(details: RealEstateDetails): string {
  const bits: string[] = [];

  bits.push(`Listed by ${details.realtorName}, ${details.brokerageName}`);
  if (details.includeEHO !== false) {
    bits.push("Equal Housing Opportunity.");
  }

  return bits.join(". ");
}
