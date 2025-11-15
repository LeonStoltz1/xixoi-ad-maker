import { z } from "zod";

export const RealEstateDetailsSchema = z.object({
  propertyType: z.string().min(2, "Property type is required."),
  city: z.string().min(1, "City is required."),
  stateOrRegion: z.string().min(1, "State/Region is required."),
  neighborhood: z.string().optional(),
  price: z.string().optional(),
  bedrooms: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : Number(val))),
  bathrooms: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : Number(val))),
  squareFeet: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : Number(val))),
  keyFeatures: z.string().optional(),
  nearbyHighlights: z.string().optional(),
  realtorName: z.string().min(2, "Realtor name is required."),
  brokerageName: z.string().min(2, "Brokerage name is required."),
  includeEHO: z.boolean().default(true),
});

export type RealEstateDetailsFormValues = z.infer<typeof RealEstateDetailsSchema>;
