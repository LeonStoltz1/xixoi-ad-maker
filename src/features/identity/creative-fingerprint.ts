/**
 * Creative Fingerprint
 * Generates unique fingerprints for ad creatives to enable similarity matching
 */

import { extractTone, ToneAnalysisResult } from './tone-extractor';

export interface CreativeFingerprint {
  id: string;
  textHash: string;
  toneSignature: string;
  structureSignature: string;
  features: CreativeFeatures;
  embedding?: number[];
}

export interface CreativeFeatures {
  wordCount: number;
  sentenceCount: number;
  avgWordLength: number;
  avgSentenceLength: number;
  questionCount: number;
  exclamationCount: number;
  numberCount: number;
  emojiCount: number;
  capsRatio: number;
  hasPrice: boolean;
  hasCTA: boolean;
  hasUrgency: boolean;
  hasSocialProof: boolean;
  hookType: string;
  ctaType: string;
}

const CTA_PATTERNS = [
  { pattern: /shop\s+now/i, type: 'shop' },
  { pattern: /buy\s+now/i, type: 'buy' },
  { pattern: /learn\s+more/i, type: 'learn' },
  { pattern: /get\s+started/i, type: 'start' },
  { pattern: /sign\s+up/i, type: 'signup' },
  { pattern: /try\s+(it\s+)?free/i, type: 'trial' },
  { pattern: /claim\s+(your)?/i, type: 'claim' },
  { pattern: /download/i, type: 'download' },
  { pattern: /subscribe/i, type: 'subscribe' },
  { pattern: /book\s+(a\s+)?/i, type: 'book' },
];

const URGENCY_PATTERNS = [
  /limited\s+time/i,
  /hurry/i,
  /don't\s+miss/i,
  /ending\s+soon/i,
  /last\s+chance/i,
  /today\s+only/i,
  /while\s+supplies\s+last/i,
  /act\s+now/i,
  /expires/i,
];

const SOCIAL_PROOF_PATTERNS = [
  /\d+[k+]?\s*(customers|users|people)/i,
  /trusted\s+by/i,
  /rated\s+\d/i,
  /★|⭐/,
  /reviews?/i,
  /testimonial/i,
  /as\s+seen\s+(on|in)/i,
  /featured\s+in/i,
];

const HOOK_TYPES = {
  question: /^[^.!]*\?/,
  howTo: /^how\s+to/i,
  number: /^\d+\s+/,
  secret: /(secret|revealed|hidden|unlock)/i,
  announcement: /^(new|introducing|announcing)/i,
  problem: /^(tired|struggling|frustrated|sick)/i,
  benefit: /^(get|achieve|discover|transform)/i,
};

export function generateFingerprint(
  headline: string,
  body: string,
  cta?: string
): CreativeFingerprint {
  const fullText = `${headline} ${body} ${cta || ''}`;
  const features = extractFeatures(headline, body, cta);
  const toneResult = extractTone(fullText);

  return {
    id: generateId(),
    textHash: simpleHash(fullText),
    toneSignature: generateToneSignature(toneResult),
    structureSignature: generateStructureSignature(features),
    features,
  };
}

function extractFeatures(
  headline: string,
  body: string,
  cta?: string
): CreativeFeatures {
  const fullText = `${headline} ${body}`;
  const words = fullText.split(/\s+/).filter(w => w.length > 0);
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim());

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length,
    avgSentenceLength: words.length / Math.max(sentences.length, 1),
    questionCount: (fullText.match(/\?/g) || []).length,
    exclamationCount: (fullText.match(/!/g) || []).length,
    numberCount: (fullText.match(/\d+/g) || []).length,
    emojiCount: (fullText.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length,
    capsRatio: (fullText.match(/[A-Z]/g) || []).length / fullText.length,
    hasPrice: /\$\d+|\d+%\s*off/i.test(fullText),
    hasCTA: CTA_PATTERNS.some(p => p.pattern.test(fullText)),
    hasUrgency: URGENCY_PATTERNS.some(p => p.test(fullText)),
    hasSocialProof: SOCIAL_PROOF_PATTERNS.some(p => p.test(fullText)),
    hookType: detectHookType(headline),
    ctaType: detectCTAType(cta || body),
  };
}

function detectHookType(headline: string): string {
  for (const [type, pattern] of Object.entries(HOOK_TYPES)) {
    if (pattern.test(headline)) return type;
  }
  return 'statement';
}

function detectCTAType(text: string): string {
  for (const { pattern, type } of CTA_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return 'generic';
}

function generateToneSignature(tone: ToneAnalysisResult): string {
  return [
    tone.tone.primary,
    tone.tone.intensity,
    ...tone.tone.emotionalRange.slice(0, 2),
  ].join('-');
}

function generateStructureSignature(features: CreativeFeatures): string {
  return [
    features.wordCount < 20 ? 'short' : features.wordCount < 50 ? 'medium' : 'long',
    features.hasPrice ? 'priced' : 'unpriced',
    features.hasUrgency ? 'urgent' : 'evergreen',
    features.hookType,
    features.ctaType,
  ].join('-');
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateId(): string {
  return `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function compareFingerprints(fp1: CreativeFingerprint, fp2: CreativeFingerprint): number {
  let similarity = 0;

  // Compare tone signatures (40% weight)
  if (fp1.toneSignature === fp2.toneSignature) {
    similarity += 40;
  } else {
    const tone1Parts = fp1.toneSignature.split('-');
    const tone2Parts = fp2.toneSignature.split('-');
    const toneOverlap = tone1Parts.filter(p => tone2Parts.includes(p)).length;
    similarity += (toneOverlap / tone1Parts.length) * 40;
  }

  // Compare structure signatures (30% weight)
  if (fp1.structureSignature === fp2.structureSignature) {
    similarity += 30;
  } else {
    const struct1Parts = fp1.structureSignature.split('-');
    const struct2Parts = fp2.structureSignature.split('-');
    const structOverlap = struct1Parts.filter(p => struct2Parts.includes(p)).length;
    similarity += (structOverlap / struct1Parts.length) * 30;
  }

  // Compare features (30% weight)
  const featureSimilarity = compareFeatures(fp1.features, fp2.features);
  similarity += featureSimilarity * 0.3;

  return Math.round(similarity);
}

function compareFeatures(f1: CreativeFeatures, f2: CreativeFeatures): number {
  let score = 0;
  let checks = 0;

  // Word count similarity
  const wordDiff = Math.abs(f1.wordCount - f2.wordCount) / Math.max(f1.wordCount, f2.wordCount);
  score += (1 - wordDiff) * 100;
  checks++;

  // Boolean feature matches
  if (f1.hasPrice === f2.hasPrice) score += 100;
  checks++;
  if (f1.hasCTA === f2.hasCTA) score += 100;
  checks++;
  if (f1.hasUrgency === f2.hasUrgency) score += 100;
  checks++;
  if (f1.hasSocialProof === f2.hasSocialProof) score += 100;
  checks++;

  // Hook and CTA type matches
  if (f1.hookType === f2.hookType) score += 100;
  checks++;
  if (f1.ctaType === f2.ctaType) score += 100;
  checks++;

  return score / checks;
}

export function findSimilarCreatives(
  target: CreativeFingerprint,
  library: CreativeFingerprint[],
  threshold: number = 60
): Array<{ fingerprint: CreativeFingerprint; similarity: number }> {
  return library
    .map(fp => ({
      fingerprint: fp,
      similarity: compareFingerprints(target, fp),
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}
