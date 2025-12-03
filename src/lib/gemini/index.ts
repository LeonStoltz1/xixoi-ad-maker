/**
 * Gemini AI Module for xiXoi
 * Central export for all Gemini-related functionality
 */

export type { GeminiMessage, GeminiOptions, GeminiResponse, GeminiSchema } from './client';

export {
  OPTIMIZATION_DECISIONS_SCHEMA,
  BUDGET_SHIFT_SCHEMA,
  FATIGUE_DETECTION_SCHEMA,
  DAILY_REPORT_SCHEMA,
  WEEKLY_REFLECTION_SCHEMA
} from './schemas';

export type {
  DecisionType,
  OptimizationDecision,
  BudgetShiftDecision,
  CreativeRotationDecision,
  FatigueDetection,
  DailyReport,
  CompetitorRecommendation
} from './schemas';

export {
  buildCreativeContext,
  buildCompetitorContext,
  buildBrandContext,
  buildCampaignContext,
  buildFullContext
} from './context-builder';

export type {
  CreativeContext,
  CompetitorContext,
  BrandContext,
  CampaignContext
} from './context-builder';

// Re-export conductor hook
export { useConductor } from '@/hooks/useConductor';
