# Scale Elite 5% Ad Spend Billing

## Overview

Scale Elite plan ($199/month) includes an additional 5% fee on all ad spend across platforms. This document explains how the billing system works.

## How It Works

### 1. Ad Spend Tracking

When campaigns run on Meta, TikTok, Google, or LinkedIn, the platform tracks actual ad spend in the `ad_spend_tracking` table.

**Recording Ad Spend:**
```typescript
// Call this endpoint when you receive ad spend data from platform APIs
await supabase.functions.invoke('record-ad-spend', {
  body: {
    campaign_id: 'uuid-of-campaign',
    platform: 'meta', // 'meta' | 'tiktok' | 'google' | 'linkedin'
    amount: 150.50, // Amount in dollars
    currency: 'usd',
    spend_date: '2025-11-13' // Optional, defaults to today
  }
});
```

### 2. Monthly Billing Process

The `bill-ad-spend-percentage` edge function should be triggered monthly (e.g., via cron job or manual trigger) to:

1. Find all users on the "elite" plan
2. Calculate total unbilled ad spend for the previous month
3. Calculate 5% fee
4. Create and charge Stripe invoice
5. Mark ad spend records as billed

**Trigger Billing Manually:**
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/bill-ad-spend-percentage
```

**Set Up Automated Monthly Billing:**
You can use GitHub Actions, Supabase scheduled functions, or external cron services to trigger this monthly.

### 3. Integration with Ad Platforms

To track actual ad spend, you need to:

1. **Meta (Facebook/Instagram):** Use Insights API to fetch daily spend
2. **TikTok:** Use Reporting API to get campaign spend
3. **Google Ads:** Use Google Ads API to query cost data
4. **LinkedIn:** Use Campaign Insights API

Each platform should call `record-ad-spend` when new spend data is available.

## Database Schema

### `ad_spend_tracking` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who owns the campaign |
| campaign_id | UUID | Campaign reference (nullable) |
| platform | TEXT | 'meta', 'tiktok', 'google', or 'linkedin' |
| amount | NUMERIC | Ad spend amount in dollars |
| currency | TEXT | Currency code (default: 'usd') |
| spend_date | DATE | Date of ad spend |
| billing_period_start | DATE | Start of billing period |
| billing_period_end | DATE | End of billing period |
| billed | BOOLEAN | Whether this has been invoiced |
| stripe_invoice_id | TEXT | Stripe invoice ID after billing |

## Example Flow

1. **User launches campaign** → Campaign goes live on Meta
2. **Daily/Weekly sync** → Your system fetches ad spend from Meta API
3. **Record spend** → Call `record-ad-spend` with amount
4. **End of month** → `bill-ad-spend-percentage` runs automatically
5. **Invoice created** → Stripe charges customer the 5% fee
6. **Records marked** → Ad spend records updated with invoice ID

## Minimum Fee

The system enforces a minimum fee of $0.50. If the 5% calculation is less than $0.50, no invoice is created for that period.

## Testing

1. Create a test user with plan = 'elite'
2. Record some test ad spend using `record-ad-spend`
3. Trigger `bill-ad-spend-percentage` manually
4. Check Stripe dashboard for created invoices

## Implementation Checklist

- [x] Database table created (`ad_spend_tracking`)
- [x] Edge function to record ad spend (`record-ad-spend`)
- [x] Edge function to bill 5% fee (`bill-ad-spend-percentage`)
- [ ] Set up cron job to trigger monthly billing
- [ ] Integrate with Meta Ads API for spend tracking
- [ ] Integrate with TikTok Ads API for spend tracking
- [ ] Integrate with Google Ads API for spend tracking
- [ ] Integrate with LinkedIn Ads API for spend tracking
- [ ] Add dashboard UI to show ad spend history
- [ ] Add notifications when invoices are created
