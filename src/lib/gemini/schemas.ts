/**
 * JSON Schemas for Gemini structured outputs
 * Used with tool calling for type-safe AI responses
 */

// Decision types for the Gemini Conductor
export type DecisionType = 
  | 'budget_shift'
  | 'creative_rotation'
  | 'pause_campaign'
  | 'resume_campaign'
  | 'fatigue_detection'
  | 'audience_expansion'
  | 'bid_adjustment';

export interface OptimizationDecision {
  decision_type: DecisionType;
  campaign_id: string;
  confidence: number; // 0-100
  auto_execute: boolean;
  reason: string;
  payload: Record<string, unknown>;
}

export interface BudgetShiftDecision {
  campaign_id: string;
  current_budget: number;
  recommended_budget: number;
  shift_percentage: number;
  confidence: number;
  auto_execute: boolean;
  reason: string;
}

export interface CreativeRotationDecision {
  campaign_id: string;
  current_creative_id: string;
  recommended_creative_id: string;
  confidence: number;
  auto_execute: boolean;
  reason: string;
  performance_comparison: {
    current_ctr: number;
    predicted_ctr: number;
  };
}

export interface FatigueDetection {
  campaign_id: string;
  creative_id: string;
  fatigue_score: number; // 0-100, higher = more fatigued
  days_running: number;
  frequency: number;
  ctr_decline_percent: number;
  recommendation: 'rotate' | 'refresh' | 'pause' | 'continue';
  confidence: number;
}

export interface DailyReport {
  date: string;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  average_ctr: number;
  average_cpc: number;
  average_roas: number;
  top_performers: Array<{
    campaign_id: string;
    campaign_name: string;
    roas: number;
  }>;
  underperformers: Array<{
    campaign_id: string;
    campaign_name: string;
    issue: string;
  }>;
  ai_recommendations: string[];
}

export interface CompetitorRecommendation {
  competitor_brand: string;
  insight: string;
  opportunity: string;
  suggested_action: string;
  confidence: number;
}

// Schema definitions for Gemini tool calling
export const OPTIMIZATION_DECISIONS_SCHEMA = {
  name: 'optimization_decisions',
  description: 'Generate optimization decisions for ad campaigns based on performance data',
  parameters: {
    type: 'object',
    properties: {
      decisions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            decision_type: {
              type: 'string',
              enum: ['budget_shift', 'creative_rotation', 'pause_campaign', 'resume_campaign', 'fatigue_detection', 'audience_expansion', 'bid_adjustment']
            },
            campaign_id: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            auto_execute: { type: 'boolean' },
            reason: { type: 'string' },
            payload: { type: 'object' }
          },
          required: ['decision_type', 'campaign_id', 'confidence', 'auto_execute', 'reason']
        }
      },
      summary: { type: 'string' }
    },
    required: ['decisions', 'summary']
  }
};

export const BUDGET_SHIFT_SCHEMA = {
  name: 'budget_shift_decision',
  description: 'Recommend budget adjustments for campaigns',
  parameters: {
    type: 'object',
    properties: {
      campaign_id: { type: 'string' },
      current_budget: { type: 'number' },
      recommended_budget: { type: 'number' },
      shift_percentage: { type: 'number' },
      confidence: { type: 'number', minimum: 0, maximum: 100 },
      auto_execute: { type: 'boolean' },
      reason: { type: 'string' }
    },
    required: ['campaign_id', 'current_budget', 'recommended_budget', 'shift_percentage', 'confidence', 'auto_execute', 'reason']
  }
};

export const FATIGUE_DETECTION_SCHEMA = {
  name: 'fatigue_detection',
  description: 'Detect creative fatigue in campaigns',
  parameters: {
    type: 'object',
    properties: {
      detections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string' },
            creative_id: { type: 'string' },
            fatigue_score: { type: 'number', minimum: 0, maximum: 100 },
            days_running: { type: 'number' },
            frequency: { type: 'number' },
            ctr_decline_percent: { type: 'number' },
            recommendation: { type: 'string', enum: ['rotate', 'refresh', 'pause', 'continue'] },
            confidence: { type: 'number', minimum: 0, maximum: 100 }
          },
          required: ['campaign_id', 'fatigue_score', 'recommendation', 'confidence']
        }
      }
    },
    required: ['detections']
  }
};

export const DAILY_REPORT_SCHEMA = {
  name: 'daily_report',
  description: 'Generate a daily performance report',
  parameters: {
    type: 'object',
    properties: {
      date: { type: 'string' },
      total_spend: { type: 'number' },
      total_impressions: { type: 'number' },
      total_clicks: { type: 'number' },
      total_conversions: { type: 'number' },
      average_ctr: { type: 'number' },
      average_cpc: { type: 'number' },
      average_roas: { type: 'number' },
      top_performers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string' },
            campaign_name: { type: 'string' },
            roas: { type: 'number' }
          }
        }
      },
      underperformers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string' },
            campaign_name: { type: 'string' },
            issue: { type: 'string' }
          }
        }
      },
      ai_recommendations: { type: 'array', items: { type: 'string' } }
    },
    required: ['date', 'total_spend', 'ai_recommendations']
  }
};

export const WEEKLY_REFLECTION_SCHEMA = {
  name: 'weekly_reflection',
  description: 'Generate a weekly self-reflection on AI decision quality',
  parameters: {
    type: 'object',
    properties: {
      what_worked: { type: 'string' },
      what_failed: { type: 'string' },
      improvements: { type: 'string' },
      prompt_rewrites: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            prompt_name: { type: 'string' },
            original_snippet: { type: 'string' },
            suggested_rewrite: { type: 'string' },
            expected_improvement: { type: 'string' }
          }
        }
      },
      metrics_summary: {
        type: 'object',
        properties: {
          total_decisions: { type: 'number' },
          auto_executed: { type: 'number' },
          successful_outcomes: { type: 'number' },
          average_confidence: { type: 'number' }
        }
      }
    },
    required: ['what_worked', 'what_failed', 'improvements']
  }
};
