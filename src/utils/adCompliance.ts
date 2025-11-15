// Ad Compliance Rules for 2025 - All Platforms
// Based on Special Ad Categories and platform policies

export type AdCategory = 'standard' | 'housing' | 'employment' | 'credit' | 'health' | 'political' | 'prohibited';

export interface ComplianceIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  platforms: string[];
}

// Discriminatory words that trigger violations in sensitive categories
const DISCRIMINATORY_WORDS = [
  // Age-related
  'young', 'old', 'elderly', 'senior', 'mature', 'millennial', 'gen z', 'boomer',
  'recent grad', 'retiree', 'retirement',
  
  // Family status
  'family-oriented', 'perfect for families', 'ideal for couples', 'singles',
  'newlyweds', 'bachelor', 'bachelorette', 'kids', 'children-friendly',
  
  // Gender-related
  'him', 'her', 'his', 'hers', 'men', 'women', 'male', 'female', 'guys', 'ladies',
  
  // Religion/ethnicity (implicit)
  'christian', 'muslim', 'jewish', 'church', 'temple', 'mosque',
  
  // Economic status
  'low-income', 'high-income', 'wealthy', 'affluent', 'luxury buyers',
  'first-time buyers', 'investors only',
  
  // Disability
  'able-bodied', 'no disabilities', 'active', 'fit', 'healthy'
];

// Required elements for housing/real estate ads
const HOUSING_REQUIREMENTS = {
  realtor_name: 'Licensed realtor or agent name',
  brokerage: 'Brokerage or company name',
  eho: 'Equal Housing Opportunity statement or logo'
};

export function detectAdCategory(content: string, productType?: string): AdCategory {
  const lowerContent = content.toLowerCase();
  
  // Housing/Real Estate
  if (
    productType === 'real-estate' ||
    lowerContent.includes('property') ||
    lowerContent.includes('house') ||
    lowerContent.includes('apartment') ||
    lowerContent.includes('condo') ||
    lowerContent.includes('home') ||
    lowerContent.includes('realtor') ||
    lowerContent.includes('real estate')
  ) {
    return 'housing';
  }
  
  // Employment
  if (
    lowerContent.includes('hiring') ||
    lowerContent.includes('job') ||
    lowerContent.includes('career') ||
    lowerContent.includes('apply now') ||
    lowerContent.includes('join our team')
  ) {
    return 'employment';
  }
  
  // Credit/Financial
  if (
    lowerContent.includes('loan') ||
    lowerContent.includes('credit') ||
    lowerContent.includes('mortgage') ||
    lowerContent.includes('financing') ||
    lowerContent.includes('apr')
  ) {
    return 'credit';
  }
  
  // Health
  if (
    lowerContent.includes('weight loss') ||
    lowerContent.includes('medical') ||
    lowerContent.includes('doctor') ||
    lowerContent.includes('clinic')
  ) {
    return 'health';
  }
  
  // Political
  if (
    lowerContent.includes('vote') ||
    lowerContent.includes('election') ||
    lowerContent.includes('candidate') ||
    lowerContent.includes('campaign')
  ) {
    return 'political';
  }
  
  return 'standard';
}

export function checkHousingCompliance(adContent: {
  headline?: string;
  bodyCopy: string;
  cta?: string;
  contactInfo?: {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
  };
}): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const fullText = `${adContent.headline || ''} ${adContent.bodyCopy} ${adContent.cta || ''}`.toLowerCase();
  
  // Check for discriminatory language
  const foundDiscriminatory = DISCRIMINATORY_WORDS.filter(word => 
    fullText.includes(word.toLowerCase())
  );
  
  if (foundDiscriminatory.length > 0) {
    issues.push({
      severity: 'error',
      field: 'body_copy',
      message: `Discriminatory language detected: "${foundDiscriminatory.join('", "')}" violates Fair Housing Act. Remove these words as they imply preference based on protected characteristics.`,
      platforms: ['meta', 'google', 'tiktok', 'linkedin']
    });
  }
  
  // Check for required elements
  const hasRealtorName = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(adContent.bodyCopy) || 
                        adContent.contactInfo?.name;
  
  if (!hasRealtorName) {
    issues.push({
      severity: 'error',
      field: 'body_copy',
      message: 'Missing realtor name. Fair Housing requires licensed agent identification.',
      platforms: ['meta', 'google', 'tiktok', 'linkedin']
    });
  }
  
  // Check for brokerage
  const hasBrokerage = fullText.includes('realty') || 
                       fullText.includes('real estate') ||
                       fullText.includes('properties') ||
                       adContent.contactInfo?.company;
  
  if (!hasBrokerage) {
    issues.push({
      severity: 'error',
      field: 'body_copy',
      message: 'Missing brokerage name. Include your licensed brokerage or company.',
      platforms: ['meta', 'google', 'tiktok', 'linkedin']
    });
  }
  
  // Check for Equal Housing Opportunity
  const hasEHO = fullText.includes('equal housing') || 
                 fullText.includes('eho') ||
                 fullText.includes('equal opportunity');
  
  if (!hasEHO) {
    issues.push({
      severity: 'warning',
      field: 'body_copy',
      message: 'Consider adding "Equal Housing Opportunity" or EHO logo to comply with Fair Housing requirements.',
      platforms: ['meta', 'google', 'tiktok', 'linkedin']
    });
  }
  
  // Check for contact info in body (should be in CTA instead)
  const hasEmailInBody = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(adContent.bodyCopy);
  const hasPhoneInBody = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(adContent.bodyCopy);
  
  if (hasEmailInBody) {
    issues.push({
      severity: 'warning',
      field: 'body_copy',
      message: 'Email in body copy may trigger rejections on Google. Consider moving to CTA button or landing page.',
      platforms: ['google']
    });
  }
  
  if (hasPhoneInBody && fullText.length < 100) {
    issues.push({
      severity: 'info',
      field: 'body_copy',
      message: 'Phone number takes valuable character space. Consider using "Call Now" CTA button instead.',
      platforms: ['meta', 'tiktok']
    });
  }
  
  return issues;
}

export function checkEmploymentCompliance(adContent: { bodyCopy: string }): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const fullText = adContent.bodyCopy.toLowerCase();
  
  const employmentViolations = [
    'young', 'old', 'energetic', 'recent grad', 'experienced professional',
    'digital native', 'tech-savvy', 'retired', 'college student'
  ];
  
  const found = employmentViolations.filter(word => fullText.includes(word));
  
  if (found.length > 0) {
    issues.push({
      severity: 'error',
      field: 'body_copy',
      message: `Employment discrimination detected: "${found.join('", "')}". Violates EEOC guidelines. Focus on job requirements, not candidate characteristics.`,
      platforms: ['meta', 'google', 'linkedin']
    });
  }
  
  return issues;
}

export function checkCreditCompliance(adContent: { bodyCopy: string }): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const fullText = adContent.bodyCopy.toLowerCase();
  
  if (!fullText.includes('terms') && !fullText.includes('conditions')) {
    issues.push({
      severity: 'warning',
      field: 'body_copy',
      message: 'Credit/loan ads should reference terms and conditions. Consider adding disclosure.',
      platforms: ['meta', 'google']
    });
  }
  
  if (fullText.includes('guaranteed approval') || fullText.includes('no credit check')) {
    issues.push({
      severity: 'error',
      field: 'body_copy',
      message: 'Misleading credit claims ("guaranteed approval") violate financial advertising rules.',
      platforms: ['meta', 'google', 'linkedin']
    });
  }
  
  return issues;
}

export function getPlatformCharacterLimits() {
  return {
    meta: { headline: 40, body: 125, cta: 25 },
    tiktok: { headline: 100, body: 100, cta: 20 },
    google: { headline: 30, body: 90, cta: 15 },
    linkedin: { headline: 70, body: 150, cta: 25 }
  };
}

export function getComplianceGuide(category: AdCategory): string[] {
  switch (category) {
    case 'housing':
      return [
        '✅ Include: Realtor name, Brokerage, Equal Housing Opportunity',
        '❌ Avoid: Age, gender, family status, income references',
        '✅ Targeting: 15-mile radius, broad interests only',
        '⚠️ Move phone/email to CTA button, not body text'
      ];
    case 'employment':
      return [
        '✅ Focus on: Job requirements, skills, experience',
        '❌ Avoid: Age, gender, career stage implications',
        '❌ Don\'t say: "Young team", "Recent grads", "Energetic"',
        '✅ Say instead: "Seeking candidates with X skills"'
      ];
    case 'credit':
      return [
        '✅ Include: Terms, conditions, APR if applicable',
        '❌ Avoid: "Guaranteed approval", "No credit check"',
        '⚠️ Requires: Legal disclosures and certifications',
        '✅ Focus on: Benefits, rates, eligibility criteria'
      ];
    case 'health':
      return [
        '✅ Be specific: Actual services, credentials',
        '❌ Avoid: Unproven health claims, before/after photos',
        '⚠️ May require: Medical licensing verification',
        '✅ Focus on: Professional services, not miracle cures'
      ];
    case 'political':
      return [
        '⚠️ Requires: Government ID verification',
        '✅ Must include: "Paid for by..." disclaimer',
        '⚠️ Strict: Region eligibility, transparency rules',
        '📋 Review: All political ads are publicly archived'
      ];
    default:
      return [
        '✅ Standard targeting available',
        '✅ Age, gender, interests allowed',
        '✅ Full lookalike and retargeting',
        '⚠️ Still follow platform content policies'
      ];
  }
}
