# Affiliate Stripe Connect Verification System

## Overview

The xiXoi™ affiliate program uses Stripe Connect to handle payouts. This system ensures affiliates can only receive payments when their Stripe accounts are fully verified and approved.

## Account Status Flow

```
┌─────────────────────────────────────────────────────────┐
│  Affiliate Signs Up                                      │
│  stripe_account_status: null                            │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Connects Stripe Account                                 │
│  stripe_account_status: "pending"                       │
│  stripe_onboarding_complete: false                      │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Stripe Reviews Account (1-2 business days)             │
│  • Webhook: account.updated                             │
│  • Daily cron job: verify-stripe-accounts               │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  APPROVED        │    │  REJECTED/       │
│  status:         │    │  RESTRICTED      │
│  "verified"      │    │  status:         │
│  ✅ Can receive  │    │  "rejected" or   │
│  payouts         │    │  "restricted"    │
└──────────────────┘    │  ❌ Cannot       │
                        │  receive payouts │
                        └──────────────────┘
```

## Status Definitions

### `pending`
- **Initial state** after Stripe Connect onboarding started
- Account under review by Stripe
- **Cannot** request or receive payouts
- UI shows: "⏳ Your Stripe account verification is pending"

### `verified`
- Account **fully approved** by Stripe
- Both `charges_enabled` and `payouts_enabled` are true
- **Can** request and receive payouts
- UI shows: "✓ Verified" badge

### `restricted`
- Account has issues requiring attention
- Missing required information or documents
- **Cannot** request or receive payouts until resolved
- UI shows: "⚠️ Your Stripe account is restricted"

### `rejected`
- Account permanently rejected by Stripe (fraud detection, etc.)
- **Cannot** request or receive payouts
- Must contact support
- UI shows: "❌ Your Stripe account was rejected"

## Implementation Details

### 1. Webhook Handler (`stripe-webhook/index.ts`)

Listens for `account.updated` events from Stripe:

```typescript
case 'account.updated': {
  const account = event.data.object;
  
  // Determine status based on Stripe account properties
  let accountStatus = 'pending';
  
  if (account.charges_enabled && account.payouts_enabled) {
    accountStatus = 'verified';
  } else if (account.requirements?.disabled_reason) {
    accountStatus = account.requirements.disabled_reason === 'rejected.fraud' 
      ? 'rejected' 
      : 'restricted';
  }
  
  // Update affiliate record
  await supabase
    .from('affiliates')
    .update({ 
      stripe_account_status: accountStatus,
      stripe_onboarding_complete: account.charges_enabled && account.payouts_enabled,
    })
    .eq('stripe_account_id', account.id);
}
```

### 2. Payout Request Validation (`Affiliates.tsx`)

Before allowing payout requests, verify account status:

```typescript
const handleRequestPayout = async () => {
  // Check if account is verified
  const accountStatus = affiliate.stripe_account_status;
  
  if (accountStatus === 'rejected') {
    toast.error("Your Stripe account was rejected. Please contact support.");
    return;
  }
  
  if (accountStatus === 'restricted') {
    toast.error("Your Stripe account is restricted. Please complete verification.");
    return;
  }

  if (accountStatus !== 'verified') {
    toast.error("Your Stripe account verification is pending.");
    return;
  }

  // Proceed with payout request...
}
```

### 3. Automated Transfer Protection (`process-payouts/index.ts`)

Before creating Stripe transfers, verify account is verified:

```typescript
if (affiliate.is_blocked) {
  console.log('Affiliate is blocked, skipping transfer');
} else if (affiliate.stripe_account_status !== 'verified') {
  console.log('Affiliate account not verified, skipping transfer');
} else {
  // Create Stripe transfer...
}
```

### 4. Daily Verification Cron Job

**Function:** `verify-stripe-accounts`  
**Schedule:** Daily at 2 AM UTC  
**Purpose:** Catch any missed webhooks and sync account statuses

```typescript
// Retrieves all non-verified accounts from database
// Fetches current status from Stripe API
// Updates database if status changed
```

## Database Schema

```sql
ALTER TABLE affiliates 
  ADD COLUMN stripe_account_status text DEFAULT 'pending';

-- Status values: 'pending', 'verified', 'restricted', 'rejected'
```

## Testing

### Manual Testing

1. **Create affiliate account**
   ```
   Visit: /affiliates
   Click: "Create My Affiliate Account"
   Expected: affiliate created with status = null
   ```

2. **Start Stripe Connect onboarding**
   ```
   Click: "Connect Bank Account with Stripe"
   Expected: Redirects to Stripe onboarding
   Status changes to: "pending"
   ```

3. **Complete Stripe onboarding**
   ```
   Fill out Stripe form
   Submit verification documents
   Expected: Redirects back to /affiliates?setup=success
   Status remains: "pending" (awaiting Stripe review)
   ```

4. **Stripe approves account (webhook)**
   ```
   Stripe sends: account.updated webhook
   Expected: Status changes to "verified"
   UI shows: ✓ Verified badge
   ```

5. **Request payout (verified account)**
   ```
   Click: "Request Full Payout"
   Expected: Success - payout request created
   ```

6. **Request payout (pending account)**
   ```
   Click: "Request Full Payout"
   Expected: Error - "Account verification pending"
   ```

### Webhook Testing

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

stripe trigger account.updated
```

### Cron Job Testing

Manually invoke the verification function:

```bash
curl -X POST https://kkpbwuzxunefujucrbfr.supabase.co/functions/v1/verify-stripe-accounts \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring

### Check affiliate account statuses

```sql
SELECT 
  code,
  stripe_account_status,
  stripe_onboarding_complete,
  total_earned,
  created_at
FROM affiliates
ORDER BY created_at DESC;
```

### Find accounts stuck in pending

```sql
SELECT 
  code,
  stripe_account_id,
  stripe_account_status,
  created_at
FROM affiliates
WHERE stripe_account_status = 'pending'
  AND stripe_account_id IS NOT NULL
  AND created_at < NOW() - INTERVAL '7 days';
```

### Check webhook logs

```sql
SELECT * FROM supabase_functions.logs
WHERE name = 'stripe-webhook'
  AND timestamp > NOW() - INTERVAL '1 day'
ORDER BY timestamp DESC;
```

## Troubleshooting

### Account stuck in "pending"

**Cause:** Webhook missed or Stripe still reviewing  
**Solution:** 
1. Check webhook logs in Stripe Dashboard
2. Manually run verify-stripe-accounts function
3. Check Stripe Dashboard for account status

### Affiliate can't request payout

**Cause:** Account not verified  
**Solution:**
1. Check `stripe_account_status` in database
2. If "pending": Wait for Stripe approval (1-2 days)
3. If "restricted": Direct affiliate to complete verification in Stripe
4. If "rejected": Contact Stripe support or affiliate support

### Transfer failed during payout processing

**Cause:** Account became restricted between verification check and transfer  
**Solution:**
- Automatic: Transfer caught by `.catch()` and logged
- Manual: Review failed transfers, update account status, retry next month

## Security Considerations

1. **Always verify from Stripe API** - Don't trust client-side status
2. **Validate webhook signatures** - Prevent spoofed webhooks
3. **Rate limit payout requests** - Prevent abuse
4. **Log all status changes** - Audit trail for disputes
5. **Block malicious affiliates** - Separate from Stripe status

## Future Enhancements

- [ ] Email notifications on status changes
- [ ] Retry failed transfers with exponential backoff
- [ ] Support manual payout approvals for high-value requests
- [ ] Add payout request rate limiting
- [ ] Implement affiliate account suspension reasons
