# xiXoi V2 Architecture Plan

## Overview

This document outlines the recommended architecture for xiXoi V2, transforming the current flat structure into a feature-based, scalable architecture.

## Current State Assessment

### Problems Identified
1. **Flat component structure** - 70+ components in single folder
2. **Mixed concerns** - Business logic mixed with UI components
3. **N+1 query patterns** - Dashboard was making N*3 queries per campaign (FIXED)
4. **Dead code** - Political mode, example files (ARCHIVED/REMOVED)
5. **Large edge functions** - stripe-webhook was 815 lines (REFACTORED)

### Recent Fixes Applied
- ✅ Affiliates RLS tightened
- ✅ Stripe publishable key moved to env var
- ✅ Quickstart plan badge fixed (both Header.tsx and UnifiedHeader.tsx)
- ✅ Stripe webhook refactored into modular handlers
- ✅ Political flow archived to `src/archive/political/`
- ✅ TierGateExample.tsx removed
- ✅ Dashboard N+1 queries reduced from N*3 to 2 queries

---

## Proposed V2 Directory Structure

```
src/
├── app/                          # App-level configuration
│   ├── App.tsx                   # Root app component
│   ├── routes.tsx                # Route definitions
│   └── providers.tsx             # Context providers wrapper
│
├── features/                     # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── pages/
│   │   │   └── AuthPage.tsx
│   │   └── index.ts              # Barrel export
│   │
│   ├── campaigns/
│   │   ├── components/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── CampaignForm.tsx
│   │   │   ├── CampaignList.tsx
│   │   │   └── TargetingControls.tsx
│   │   ├── hooks/
│   │   │   ├── useCampaigns.ts
│   │   │   └── useCampaignPerformance.ts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CreateCampaign.tsx
│   │   │   ├── EditCampaign.tsx
│   │   │   └── CampaignAnalytics.tsx
│   │   ├── utils/
│   │   │   └── campaignPerformance.ts
│   │   └── index.ts
│   │
│   ├── billing/
│   │   ├── components/
│   │   │   ├── PricingCard.tsx
│   │   │   ├── UpgradeModal.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   └── BudgetWidget.tsx
│   │   ├── hooks/
│   │   │   ├── useStripeCheckout.ts
│   │   │   └── useWallet.ts
│   │   ├── pages/
│   │   │   ├── Pricing.tsx
│   │   │   ├── Wallet.tsx
│   │   │   └── PaymentSuccess.tsx
│   │   └── index.ts
│   │
│   ├── affiliates/
│   │   ├── components/
│   │   │   ├── AffiliateCard.tsx
│   │   │   ├── EarningsCalculator.tsx
│   │   │   ├── BannerGallery.tsx
│   │   │   └── Leaderboard.tsx
│   │   ├── hooks/
│   │   │   └── useAffiliate.ts
│   │   ├── pages/
│   │   │   ├── AffiliatesPage.tsx
│   │   │   ├── InfluencersLanding.tsx
│   │   │   └── LeaderboardPage.tsx
│   │   └── index.ts
│   │
│   ├── admin/
│   │   ├── components/
│   │   │   └── CredentialsForm.tsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── PlatformCredentials.tsx
│   │   │   └── TierTesting.tsx
│   │   └── index.ts
│   │
│   └── realtor/
│       ├── components/
│       │   └── RealtorIdentification.tsx
│       ├── context/
│       │   └── RealtorContext.tsx
│       └── index.ts
│
├── shared/                       # Shared utilities
│   ├── components/
│   │   ├── ui/                   # shadcn components (unchanged)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── BackButton.tsx
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useGeolocation.ts
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── format.ts
│   │   ├── stripe.ts
│   │   └── plan-config.ts
│   │
│   └── types/
│       └── index.ts
│
├── integrations/                 # External integrations
│   └── supabase/
│       ├── client.ts
│       └── types.ts
│
└── archive/                      # Archived/disabled features
    └── political/
        ├── README.md
        └── [archived files]
```

---

## Migration Plan

### Phase 1: Create Structure (Low Risk)
1. Create `src/features/` directory
2. Create `src/shared/` directory
3. Create barrel exports (`index.ts`) for each feature

### Phase 2: Move Shared Components (Medium Risk)
1. Move `src/components/ui/` → `src/shared/components/ui/`
2. Move `src/components/layout/` → `src/shared/components/layout/`
3. Update import aliases in `tsconfig.json`
4. Update all imports (use find-replace)

### Phase 3: Move Features One-by-One (Medium Risk)
Order of migration (safest to riskiest):

1. **admin/** - Low usage, easy to test
2. **affiliates/** - Self-contained feature
3. **realtor/** - Context + few components
4. **billing/** - More complex, but isolated
5. **auth/** - Critical path, test thoroughly
6. **campaigns/** - Most complex, migrate last

### Phase 4: Update Routing
1. Create `src/app/routes.tsx` with all route definitions
2. Update `App.tsx` to use routes file
3. Add lazy loading for feature modules

### Phase 5: Cleanup
1. Delete empty old directories
2. Update documentation
3. Run full test pass

---

## File Migration Map

| Current Path | New Path |
|-------------|----------|
| `src/pages/Auth.tsx` | `src/features/auth/pages/AuthPage.tsx` |
| `src/pages/Dashboard.tsx` | `src/features/campaigns/pages/Dashboard.tsx` |
| `src/pages/CreateCampaign.tsx` | `src/features/campaigns/pages/CreateCampaign.tsx` |
| `src/pages/Affiliates.tsx` | `src/features/affiliates/pages/AffiliatesPage.tsx` |
| `src/pages/Influencers.tsx` | `src/features/affiliates/pages/InfluencersLanding.tsx` |
| `src/components/EnhancedCampaignCard.tsx` | `src/features/campaigns/components/CampaignCard.tsx` |
| `src/components/Pricing.tsx` | `src/features/billing/components/Pricing.tsx` |
| `src/components/FreeUpgradeModal.tsx` | `src/features/billing/components/UpgradeModal.tsx` |
| `src/hooks/useStripeCheckout.ts` | `src/features/billing/hooks/useStripeCheckout.ts` |
| `src/hooks/useAffiliate.ts` | `src/features/affiliates/hooks/useAffiliate.ts` |
| `src/contexts/RealtorContext.tsx` | `src/features/realtor/context/RealtorContext.tsx` |
| `src/utils/campaignPerformance.ts` | `src/features/campaigns/utils/campaignPerformance.ts` |

---

## Import Alias Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking imports | Use automated find-replace, test each feature |
| Route changes | Keep exact same URL paths |
| Context access | Ensure providers wrap entire app |
| Build failures | Migrate one feature at a time, commit after each |

---

## Critical Architecture Upgrades for V2

### 1. Feature Flags System
Add a feature flags table and hook to enable/disable features without deployment.

### 2. Error Boundary per Feature
Each feature should have its own error boundary to prevent cascading failures.

### 3. Lazy Loading
Implement React.lazy() for feature modules to reduce initial bundle size.

### 4. E2E Tests
Add Playwright tests for critical paths:
- Sign up → Create campaign → Pay → Publish
- Affiliate signup → Share link → Track conversion

### 5. API Layer Abstraction
Create a unified API layer that wraps Supabase calls for easier mocking and testing.

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Structure | 1 hour | None |
| Phase 2: Shared | 2-3 hours | Phase 1 |
| Phase 3: Features | 4-6 hours | Phase 2 |
| Phase 4: Routing | 1-2 hours | Phase 3 |
| Phase 5: Cleanup | 1 hour | Phase 4 |

**Total: ~10-13 hours**

---

## Next Steps

1. Review this plan with stakeholders
2. Create feature branch: `xixoi/v2-architecture`
3. Execute Phase 1 (structure creation)
4. Iterate through remaining phases
5. QA pass before merge to main
