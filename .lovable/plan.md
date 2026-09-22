# AI Credit Audit (read-only findings)

## 1. Every AI/LLM path in the code

All AI traffic goes to one endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`, model `google/gemini-2.5-flash` (shared wrapper `supabase/functions/_shared/gemini.ts`, lines 6, 58, 137).

Functions that call it directly or through the wrapper:

| Function | Consumes credits when |
|---|---|
| generate-ad-variants | user creates/queues variants |
| generate-campaign-variants | user action |
| generate-targeting | user action / queue job |
| rewrite-ad-copy | user action / queue job |
| suggest-ad-content, suggest-campaign-name | user typing in campaign form |
| generate-image-from-description | user URL/description import |
| generate-affiliate-banner | user clicks banner customize/download |
| moderate-ad-content | user submits ad for review |
| analyze-performance | user opens AI Performance Analysis |
| ai-support | user submits a support ticket |
| ai-onboarding | user runs onboarding |
| gemini-conductor | invoked only by `useConductor` hook (currently exported but not mounted in any page) |
| gemini-price-tests, gemini-profit-safety | user buttons on Profit Dashboard |
| generate-political-ad, sign-political-ad | archived political flow |

## 2. Scheduled/background jobs (21 active pg_cron jobs)

| Job | Schedule | Calls AI? |
|---|---|---|
| process-ai-queue-every-10s (id 8) | every 10 seconds | only if `ai_generation_queue` has rows |
| process-ai-queue-minute (id 17) | every minute | same (duplicate of id 8) |
| process-publish-queue-every-15s (9) / -minute (18) | 15s / 1min | no AI |
| release-expired-leases (10, 19) | 1min / 2min | no |
| check-performance-alerts (20) | every 6h | no AI call in that file |
| check-mutation-alerts-daily (21) | daily 06:00 | no AI call in that file |
| payouts, affiliate tiers/bonuses/leaderboard, stripe verify, batch funding, affiliate emails (1,3,4,5,6,7,11,12,13,14,15,16) | various | no AI |

No cron job invokes `gemini-conductor`, `mutate-creatives`, `rank-creatives`, `analyze-performance`, or any generator directly.

## 3. Does anything consume AI credits while idle?

**No.** With an empty AI queue, every scheduled job does database/Stripe/email work only. `process-ai-queue` leases 0 jobs and exits (`supabase/functions/process-ai-queue/index.ts` lines 20-36), so no gateway call occurs.

Residual (non-zero-risk) items, all conditional on real user work, not idle time:
- **Two duplicate pairs of queue cron jobs** (ids 8+17, 9+18). Harmless for credits, but a queued job can be picked up twice within a minute if a lease expires — wasted invocations, not idle spend.
- `useQueueManager` invokes `process-ai-queue` only right after a user enqueues a job (line 82) — not on mount, no polling.
- Anything already sitting `pending`/`processing` in `ai_generation_queue` **will** be processed on the next 10-second tick even with nobody on the site. I could not verify current queue contents: the database pooler was unavailable during this audit (project waking). Worth re-checking.

Published state: the app is live at `xixoi.com` (published) and the same backend instance serves preview and production, so preview activity hits the same credit pool.

## 4. Safest way to make idle AI credit use exactly zero (no behaviour lost)

Recommended, in order — none applied:

1. **Verify the AI queue is drained**: count rows in `ai_generation_queue` by status; any stale `pending`/`processing` rows are the only thing that can spend credits with zero users. Mark stale ones `failed`/`cancelled` rather than leaving them leasable.
2. **Drop the duplicate cron jobs** (ids 17 and 18), keeping the 10s/15s ones. Eliminates double-processing without changing user-visible latency.
3. **Optional hard switch**: add an `ai_enabled` flag in a settings table that `process-ai-queue` reads first and exits when false. Gives you a one-row kill switch for all background AI while leaving user-triggered calls untouched.
4. **Optional spend ceiling**: set a workspace AI Gateway credit limit so any unexpected loop is capped regardless of code.

If you want the truly-zero-idle guarantee without touching code, options 1 + 2 are sufficient: after that, credits only move when a signed-in user clicks something.
