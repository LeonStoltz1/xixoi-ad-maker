export interface PoliticalCandidate {
  id: string;
  userId: string;
  fullName: string;
  party: string | null;
  race: string | null;
  electionYear: number | null;
  website: string | null;
  fecId: string | null;
  address: string | null;
  officeSought: string | null;
  idDocumentFrontUrl: string | null;
  idDocumentBackUrl: string | null;
  selfieUrl: string | null;
  walletAddress: string | null;
  approved: boolean;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PoliticalAd {
  id: string;
  userId: string;
  candidateId: string | null;
  campaignId: string | null;
  adCopy: string;
  imageUrl: string | null;
  platform: string;
  watermarkUrl: string | null;
  signatureBase58: string | null;
  policyFocus: string | null;
  tone: string | null;
  published: boolean;
  publishedAt: string | null;
  complianceChecked: boolean;
  complianceIssues: ComplianceIssue[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceIssue {
  type: string;
  severity: 'error' | 'warning';
  message: string;
  details?: string;
}

export type PolicyFocus = 
  | 'economy'
  | 'healthcare'
  | 'education'
  | 'environment'
  | 'security'
  | 'immigration'
  | 'infrastructure'
  | 'other';

export type PoliticalTone = 
  | 'professional'
  | 'persuasive'
  | 'hopeful'
  | 'strong'
  | 'urgent'
  | 'friendly';
