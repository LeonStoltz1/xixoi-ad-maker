import type { Platform } from "@/types/realEstate";

export interface PlatformRuleConfig {
  id: Platform;
  label: string;
  recommendedPrimaryChars: number;
  hardPrimaryChars?: number;
  truncatesAggressively: boolean;
  showHousingFooterInBody: boolean;
  uiHint: string;
}

export const PLATFORM_RULES: Record<Platform, PlatformRuleConfig> = {
  meta: {
    id: "meta",
    label: "Meta (Facebook / Instagram)",
    recommendedPrimaryChars: 125,
    hardPrimaryChars: 250,
    truncatesAggressively: true,
    showHousingFooterInBody: true,
    uiHint: "Aim for ~125 chars; clear primary text.",
  },
  google: {
    id: "google",
    label: "Google Ads",
    recommendedPrimaryChars: 90,
    hardPrimaryChars: 90,
    truncatesAggressively: true,
    showHousingFooterInBody: false,
    uiHint: "Short, punchy text for headlines/descriptions.",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    recommendedPrimaryChars: 100,
    hardPrimaryChars: 150,
    truncatesAggressively: true,
    showHousingFooterInBody: true,
    uiHint: "Hooky, scroll-stopping, mobile-first.",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    recommendedPrimaryChars: 150,
    hardPrimaryChars: 300,
    truncatesAggressively: false,
    showHousingFooterInBody: true,
    uiHint: "Professional tone; lead with value.",
  },
  x: {
    id: "x",
    label: "X (Twitter)",
    recommendedPrimaryChars: 240,
    hardPrimaryChars: 280,
    truncatesAggressively: true,
    showHousingFooterInBody: true,
    uiHint: "Single concise post; no fluff.",
  },
};

export function getPlatformRules(platform: Platform): PlatformRuleConfig {
  return PLATFORM_RULES[platform];
}
