import type { ComplianceIssue } from '@/types/political';

const RESTRICTED_KEYWORDS = [
  // Misinformation triggers
  'proven fact',
  'definitely will',
  'guaranteed',
  'rigged',
  'stolen election',
  'fake votes',
  
  // Hate speech patterns
  'illegals',
  'invasion',
  'radical',
  'extremist',
  
  // Protected class targeting
  'young voters',
  'elderly',
  'minorities',
  'women voters',
  'men only',
];

const REQUIRED_DISCLAIMERS = [
  'paid for by',
  'approved by',
];

export function checkPoliticalCompliance(adCopy: string, candidateName?: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const lowerCopy = adCopy.toLowerCase();

  // Check for restricted keywords
  for (const keyword of RESTRICTED_KEYWORDS) {
    if (lowerCopy.includes(keyword.toLowerCase())) {
      issues.push({
        type: 'restricted_language',
        severity: 'error',
        message: `Contains restricted political language: "${keyword}"`,
        details: 'Political ads must avoid inflammatory, misleading, or demographic targeting language.',
      });
    }
  }

  // Check for required disclaimers
  const hasDisclaimer = REQUIRED_DISCLAIMERS.some(disclaimer => 
    lowerCopy.includes(disclaimer)
  );

  if (!hasDisclaimer) {
    issues.push({
      type: 'missing_disclaimer',
      severity: 'warning',
      message: 'Missing required "Paid for by" disclaimer',
      details: 'FEC regulations require political ads to include funding disclosure.',
    });
  }

  // Check for unsubstantiated claims
  if (lowerCopy.includes('will') && lowerCopy.includes('%')) {
    issues.push({
      type: 'unverified_claim',
      severity: 'warning',
      message: 'Contains specific promises or statistics',
      details: 'Political claims should be verifiable and sourced.',
    });
  }

  // Check for attack language without attribution
  if ((lowerCopy.includes('opponent') || lowerCopy.includes('against')) && 
      !lowerCopy.includes('source:') && !lowerCopy.includes('according to')) {
    issues.push({
      type: 'unattributed_attack',
      severity: 'warning',
      message: 'Contains attack language without source attribution',
      details: 'Negative claims should cite credible sources.',
    });
  }

  // Check character length for platform limits
  if (adCopy.length > 280) {
    issues.push({
      type: 'length_warning',
      severity: 'warning',
      message: 'Ad copy exceeds 280 characters',
      details: 'Some platforms may truncate or reject longer political ads.',
    });
  }

  return issues;
}

export function generatePoliticalDisclaimer(
  candidateName: string,
  race: string,
  includeUrl: boolean = false,
  verificationUrl?: string
): string {
  let disclaimer = `Paid for by ${candidateName} for ${race}`;
  
  if (includeUrl && verificationUrl) {
    disclaimer += ` | Verified by xiXoi | ${verificationUrl}`;
  } else {
    disclaimer += ` | Verified by xiXoi`;
  }
  
  return disclaimer;
}

export function buildPoliticalPrompt(
  candidateName: string,
  race: string,
  electionYear: number,
  policyFocus: string,
  tone: string,
  platform: string,
  characterLimit: number
): string {
  return `You are generating political advertising copy for ${candidateName}, running for ${race} in ${electionYear}.

CRITICAL COMPLIANCE RULES:
1. NO misinformation or unverified claims
2. NO demographic targeting (age, race, gender, religion)
3. NO inflammatory or hateful language
4. NO absolute promises without qualifiers
5. MUST focus on policy and vision
6. MUST be factual and verifiable
7. MUST comply with FEC regulations
8. MUST include call-to-action (Vote, Donate, Volunteer, Learn More)

Policy Focus: ${policyFocus}
Tone: ${tone}
Target Platform: ${platform}
Character Limit: ${characterLimit} characters (excluding disclaimer)

Generate 3 ad variations:
1. Short headline (50-80 characters)
2. Medium copy (120-200 characters)  
3. Long persuasive version (${characterLimit - 100} characters)

Each variation should:
- Focus on ${policyFocus}
- Use ${tone} tone
- Include clear call-to-action
- Be platform-appropriate for ${platform}
- Avoid ALL restricted language
- Be inspiring but factual

Return ONLY the ad copy variations, no explanations.`;
}
