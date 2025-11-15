import { z } from "zod";

export const PoliticalCandidateSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  party: z.string().optional(),
  race: z.string().min(2, "Office/race is required").max(200),
  electionYear: z.coerce.number().min(2024).max(2050),
  website: z.string().url().optional().or(z.literal("")),
  fecId: z.string().optional(),
  address: z.string().min(10, "Complete address is required").max(500),
  officeSought: z.string().min(2, "Office sought is required").max(200),
  walletAddress: z.string().optional(),
});

export type PoliticalCandidateFormValues = z.infer<typeof PoliticalCandidateSchema>;

export const PoliticalAdGenerationSchema = z.object({
  policyFocus: z.enum([
    'economy',
    'healthcare',
    'education',
    'environment',
    'security',
    'immigration',
    'infrastructure',
    'other'
  ]),
  tone: z.enum([
    'professional',
    'persuasive',
    'hopeful',
    'strong',
    'urgent',
    'friendly'
  ]),
  platform: z.enum(['meta', 'google', 'tiktok', 'linkedin', 'x']),
  customMessage: z.string().max(500).optional(),
});

export type PoliticalAdGenerationFormValues = z.infer<typeof PoliticalAdGenerationSchema>;
