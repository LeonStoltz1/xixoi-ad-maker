/**
 * Tone Extractor
 * Analyzes text content to extract tone and style characteristics
 */

export interface ToneProfile {
  primary: string;
  secondary: string[];
  intensity: 'subtle' | 'moderate' | 'strong';
  emotionalRange: string[];
}

export interface StyleCharacteristics {
  sentenceLength: 'short' | 'medium' | 'long';
  vocabularyLevel: 'simple' | 'moderate' | 'sophisticated';
  punctuationStyle: 'minimal' | 'standard' | 'expressive';
  rhetorical: string[];
}

export interface ToneAnalysisResult {
  tone: ToneProfile;
  style: StyleCharacteristics;
  keywords: string[];
  recommendations: string[];
}

const TONE_KEYWORDS = {
  professional: ['professional', 'expert', 'industry', 'solution', 'optimize', 'efficient'],
  friendly: ['hey', 'love', 'awesome', 'great', 'enjoy', 'fun', 'happy'],
  urgent: ['now', 'hurry', 'limited', 'today', 'fast', 'quick', 'instantly'],
  luxurious: ['premium', 'exclusive', 'luxury', 'elite', 'sophisticated', 'refined'],
  trustworthy: ['proven', 'trusted', 'reliable', 'guaranteed', 'certified', 'verified'],
  innovative: ['new', 'revolutionary', 'cutting-edge', 'breakthrough', 'innovative', 'advanced'],
  empathetic: ['understand', 'feel', 'struggle', 'help', 'support', 'care'],
  bold: ['bold', 'powerful', 'unstoppable', 'dominate', 'crush', 'win'],
};

const EMOTIONAL_KEYWORDS = {
  excitement: ['amazing', 'incredible', 'wow', 'exciting', 'thrilling'],
  trust: ['safe', 'secure', 'reliable', 'honest', 'transparent'],
  fear: ['risk', 'danger', 'miss', 'lose', 'fail'],
  curiosity: ['discover', 'secret', 'reveal', 'hidden', 'unlock'],
  aspiration: ['dream', 'goal', 'achieve', 'success', 'transform'],
};

export function extractTone(text: string): ToneAnalysisResult {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());

  // Analyze tone
  const toneScores: Record<string, number> = {};
  Object.entries(TONE_KEYWORDS).forEach(([tone, keywords]) => {
    toneScores[tone] = keywords.filter(kw => lowerText.includes(kw)).length;
  });

  const sortedTones = Object.entries(toneScores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  const primaryTone = sortedTones[0]?.[0] || 'neutral';
  const secondaryTones = sortedTones.slice(1, 3).map(([tone]) => tone);

  // Analyze emotions
  const emotions: string[] = [];
  Object.entries(EMOTIONAL_KEYWORDS).forEach(([emotion, keywords]) => {
    if (keywords.some(kw => lowerText.includes(kw))) {
      emotions.push(emotion);
    }
  });

  // Analyze style
  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;

  const sentenceLength: 'short' | 'medium' | 'long' = 
    avgSentenceLength < 10 ? 'short' : avgSentenceLength < 20 ? 'medium' : 'long';

  const punctuationStyle: 'minimal' | 'standard' | 'expressive' =
    exclamationCount > 2 ? 'expressive' : exclamationCount === 0 && questionCount === 0 ? 'minimal' : 'standard';

  // Extract rhetorical devices
  const rhetorical: string[] = [];
  if (questionCount > 0) rhetorical.push('rhetorical-questions');
  if (/\d+/.test(text)) rhetorical.push('statistics');
  if (text.includes('"') || text.includes("'")) rhetorical.push('quotes');
  if (/(\w+)\s+\1/.test(lowerText)) rhetorical.push('repetition');

  // Calculate intensity
  const intensity: 'subtle' | 'moderate' | 'strong' =
    exclamationCount > 3 || sortedTones[0]?.[1] > 3 ? 'strong' :
    exclamationCount > 0 || sortedTones[0]?.[1] > 1 ? 'moderate' : 'subtle';

  // Generate recommendations
  const recommendations = generateRecommendations(primaryTone, emotions, sentenceLength);

  return {
    tone: {
      primary: primaryTone,
      secondary: secondaryTones,
      intensity,
      emotionalRange: emotions,
    },
    style: {
      sentenceLength,
      vocabularyLevel: detectVocabularyLevel(words),
      punctuationStyle,
      rhetorical,
    },
    keywords: extractKeyPhrases(text),
    recommendations,
  };
}

function detectVocabularyLevel(words: string[]): 'simple' | 'moderate' | 'sophisticated' {
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  
  if (avgWordLength < 5) return 'simple';
  if (avgWordLength < 7) return 'moderate';
  return 'sophisticated';
}

function extractKeyPhrases(text: string): string[] {
  // Simple keyword extraction - in production, use NLP
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4);

  const wordFreq: Record<string, number> = {};
  words.forEach(w => {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  });

  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function generateRecommendations(
  tone: string,
  emotions: string[],
  sentenceLength: string
): string[] {
  const recs: string[] = [];

  if (sentenceLength === 'long') {
    recs.push('Consider shorter sentences for better ad readability');
  }

  if (!emotions.includes('curiosity')) {
    recs.push('Add curiosity-driven hooks to increase engagement');
  }

  if (tone === 'neutral') {
    recs.push('Develop a stronger brand voice to stand out');
  }

  if (!emotions.includes('aspiration')) {
    recs.push('Include aspirational messaging to connect with audience goals');
  }

  return recs;
}

export function compareTones(tone1: ToneAnalysisResult, tone2: ToneAnalysisResult): number {
  let similarity = 0;

  // Compare primary tones
  if (tone1.tone.primary === tone2.tone.primary) similarity += 40;

  // Compare secondary tones overlap
  const secondaryOverlap = tone1.tone.secondary.filter(t => 
    tone2.tone.secondary.includes(t)
  ).length;
  similarity += secondaryOverlap * 10;

  // Compare emotional range overlap
  const emotionOverlap = tone1.tone.emotionalRange.filter(e =>
    tone2.tone.emotionalRange.includes(e)
  ).length;
  similarity += emotionOverlap * 10;

  // Compare style characteristics
  if (tone1.style.sentenceLength === tone2.style.sentenceLength) similarity += 10;
  if (tone1.style.vocabularyLevel === tone2.style.vocabularyLevel) similarity += 10;

  return Math.min(similarity, 100);
}
