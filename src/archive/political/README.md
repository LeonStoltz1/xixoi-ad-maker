# Archived: Political Ads Feature

This folder contains archived code for the Political Ads feature. This feature is **not currently active** and has been archived for future development.

## Status
- **Archived Date**: December 2025
- **Reason**: Feature deferred for later launch
- **Routes**: All political routes are commented out in `App.tsx`

## Contents
- `GeneratePoliticalAd.tsx` - AI political ad generation page
- `PoliticalDashboard.tsx` - Political campaign management dashboard
- `VerifyAd.tsx` - Political ad verification page
- `VerifyCandidate.tsx` - Candidate identity verification page

## Related Files (Not Archived)
- `src/contexts/PoliticalContext.tsx` - Still exists but mostly inactive
- `src/types/political.ts` - Type definitions
- `src/schema/political.ts` - Zod schemas
- `supabase/functions/generate-political-ad/` - Edge function (deployed but unused)

## To Re-enable
1. Uncomment political routes in `App.tsx`
2. Move files from `src/archive/political/` back to `src/pages/political/`
3. Update imports in `App.tsx`
4. Ensure FEC compliance checks are complete before launch
