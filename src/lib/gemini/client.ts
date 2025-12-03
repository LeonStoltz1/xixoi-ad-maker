/**
 * Gemini AI Client Types for xiXoi
 * Shared types used by both edge functions and frontend
 */

export interface GeminiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeminiOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface GeminiSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// Re-export for backwards compatibility
export type { GeminiMessage as Message };
