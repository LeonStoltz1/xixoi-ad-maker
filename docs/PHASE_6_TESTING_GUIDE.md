# Phase 6: Master-Account Testing & Validation Guide

## Overview
This guide provides step-by-step instructions for testing the master-account-only architecture before production launch.

---

## STEP 1: Insert System Credential Placeholders

First, insert placeholder records for each platform's system credentials. Run this SQL in your Supabase SQL Editor:

```sql
-- Insert system credential placeholders for all 4 platforms
INSERT INTO public.platform_credentials (
  platform,
  platform_account_id,
  access_token,
  refresh_token,
  owner_type,
  owner_id,
  status,
  expires_at
) VALUES
  ('meta', 'PLACEHOLDER_META_ACCOUNT_ID', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL),
  ('tiktok', 'PLACEHOLDER_TIKTOK_ACCOUNT_ID', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL),
  ('google', 'PLACEHOLDER_GOOGLE_ACCOUNT_ID', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL),
  ('linkedin', 'PLACEHOLDER_LINKEDIN_ACCOUNT_ID', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL)
ON CONFLICT (platform, owner_type, owner_id) DO NOTHING;
```

**Expected Result:** 4 rows inserted (or already exist message)

---

## STEP 2: Grant Admin Role to Test User

Run this SQL to make yourself an admin (replace `YOUR_USER_ID` with your actual Supabase auth.users ID):

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Insert admin role (replace YOUR_USER_ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify admin role
SELECT * FROM public.user_roles WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:** You should see a user_roles record with role = 'admin'

---

## STEP 3: Test Admin Credentials Page

### 3A. Access Admin Page
1. Navigate to `/xi-admin/platform-credentials`
2. **Expected:** Page loads successfully (no redirect to /dashboard or /auth)
3. **Expected:** You see 4 platform cards: Meta, TikTok, Google, LinkedIn

### 3B. Verify Server-Side Admin Check
1. Open browser DevTools → Network tab
2. Refresh the page
3. Look for RPC call to `is_admin` function
4. **Expected:** Returns `true` for your user

### 3C. Test Without Admin Role (Optional)
1. Remove admin role: `DELETE FROM user_roles WHERE user_id = 'YOUR_USER_ID';`
2. Refresh `/xi-admin/platform-credentials`
3. **Expected:** Redirected to `/dashboard` with toast error "Access denied"
4. **Restore admin role** before continuing

---

## STEP 4: Encrypt & Insert Real Master Tokens

### 4A. Test Encrypt-Master-Token Function
1. In browser console or Supabase Functions test, call:
```javascript
const { data, error } = await supabase.functions.invoke('encrypt-master-token', {
  body: { token: 'test-token-12345' }
});
console.log('Encrypted:', data);
```
2. **Expected:** Returns `{ encrypted: "base64-encrypted-string" }`

### 4B. Update Tokens via Admin UI
For each platform (Meta, TikTok, Google, LinkedIn):

1. Click "Update Token" button on the platform card
2. Paste the **actual master access token** for that platform
3. Click "Confirm Update"
4. **Expected:** Toast success "Token updated successfully"
5. **Expected:** Platform status changes from "pending" to "connected"

**CRITICAL:** You must have actual valid tokens from:
- **Meta:** Business Manager account with ad creation permissions
- **TikTok:** TikTok Ads Manager API access token
- **Google:** Google Ads API developer token + OAuth credentials
- **LinkedIn:** LinkedIn Marketing API access token

---

## STEP 5: Test Credential Retrieval (Backend)

### 5A. Verify Encrypted Storage
Run this SQL to confirm tokens are encrypted:
```sql
SELECT 
  platform, 
  platform_account_id,
  LEFT(access_token, 50) as token_preview,
  status,
  owner_type
FROM platform_credentials
WHERE owner_type = 'system';
```
**Expected:** `token_preview` shows encrypted gibberish (not plaintext)

### 5B. Test getSystemCredentials Helper
Create a test edge function or use existing publish function to verify:
```typescript
import { getSystemCredentials } from "../_shared/credentials.ts";

// This should decrypt and return tokens
const metaCreds = await getSystemCredentials('meta');
console.log('Meta Account ID:', metaCreds.platform_account_id);
console.log('Token Length:', metaCreds.accessToken.length);
```
**Expected:** Returns decrypted token successfully

---

## STEP 6: Test Campaign Creation Flow

### 6A. Navigate to Create Campaign
1. Go to `/create-campaign`
2. **Expected:** See "No Ad Accounts Banner" at top explaining xiXoi handles accounts
3. **Expected:** Banner text: "xiXoi™ handles all ad platform accounts for you..."

### 6B. Create Test Campaign
1. Fill in campaign name: "Master Account Test Campaign"
2. Select upload type: Image
3. Upload a test image (JPG/PNG under 5MB)
4. Enter product description (e.g., "Test product for master account validation")
5. **Expected:** Character counter shows limits for selected platforms

### 6C. Platform Selection & Budget
1. Select platforms: Meta (required), TikTok, Google, LinkedIn
2. Set daily budgets for each selected platform ($20 minimum)
3. **Expected:** Budget sliders work for each platform independently

### 6D. Generate Ad Variants
1. Click "Let me see..." button
2. **Expected:** AI generates 1-4 variants (depending on user's plan tier)
3. **Expected:** Preview modal shows actual uploaded image + AI-generated copy
4. **Expected:** Watermark visible: "Powered By xiXoi™" (if Free tier)

---

## STEP 7: Test Payment & Publishing Flow

### 7A. Payment Modal (Free/Unpaid Users)
1. Click "Pay to Publish" button
2. **Expected:** Payment modal opens with pricing options
3. **Expected:** Options: "Publish Pro — $29 per ad set" and "Unlimited Pro — $99/month"

### 7B. Stripe Checkout (Test Mode)
1. Select a pricing option
2. Click "Continue to Payment →"
3. **Expected:** Redirected to Stripe Checkout
4. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
5. Complete payment
6. **Expected:** Redirected back to xiXoi

### 7C. Post-Payment Publishing
1. After successful payment, verify redirect to success page
2. **Expected:** Campaign status changes to "published"
3. **Expected:** Watermark removed (if paid tier)

---

## STEP 8: Test Publish Functions (Backend)

### 8A. Check Edge Function Logs
For each platform publish function:
1. Navigate to Supabase → Edge Functions → Logs
2. Filter by function name: `publish-meta`, `publish-tiktok`, etc.
3. **Expected:** Logs show "Retrieved system credentials for [platform]"
4. **Expected:** No errors about "user credentials not found"

### 8B. Verify API Calls (Optional)
If you have access to platform ad accounts:
1. Check Meta Business Manager → Ad Account
2. **Expected:** See newly created campaign/ad
3. Repeat for TikTok, Google, LinkedIn accounts

### 8C. Database Verification
Run this SQL to verify campaign was published:
```sql
SELECT 
  c.id,
  c.name,
  c.status,
  c.created_at,
  cc.channel,
  cc.channel_campaign_id,
  cc.is_connected
FROM campaigns c
LEFT JOIN campaign_channels cc ON c.id = cc.campaign_id
WHERE c.name = 'Master Account Test Campaign'
ORDER BY c.created_at DESC
LIMIT 1;
```
**Expected:** Status = 'published', channels show is_connected = true

---

## STEP 9: Test Dashboard Display

### 9A. View Published Campaign
1. Navigate to `/dashboard`
2. **Expected:** See "Master Account Test Campaign" card
3. Click "View Ad" button
4. **Expected:** Navigate to `/ad-published/{campaignId}`
5. **Expected:** See published ad with correct creative, copy, and platforms

### 9B. Verify NoAdAccountsBanner NOT Shown
1. While on dashboard
2. **Expected:** NoAdAccountsBanner does NOT appear (only shows in /create-campaign)

---

## STEP 10: Security & RLS Validation

### 10A. Test Non-Admin Access to Credentials
1. Create a second test user (non-admin)
2. Try to access `/xi-admin/platform-credentials`
3. **Expected:** Redirected to `/dashboard` with "Access denied" message

### 10B. Verify RLS Policies
Run this SQL as a non-admin user:
```sql
SELECT * FROM platform_credentials WHERE owner_type = 'system';
```
**Expected:** Returns 0 rows (RLS blocks non-service-role access)

---

## STEP 11: Error Handling Tests

### 11A. Missing Credentials Test
1. Temporarily delete one platform credential:
```sql
DELETE FROM platform_credentials WHERE platform = 'tiktok' AND owner_type = 'system';
```
2. Try to publish campaign selecting TikTok
3. **Expected:** Error message "Platform credentials unavailable for tiktok"
4. **Restore credential** after test

### 11B. Invalid Token Test
1. Update a credential with invalid token via admin UI
2. Try to publish campaign to that platform
3. **Expected:** API error from platform (401 Unauthorized or similar)

---

## STEP 12: Production Readiness Checklist

Before going live, verify:

- [ ] All 4 platform system credentials inserted with REAL tokens
- [ ] Tokens encrypted using encrypt-master-token function
- [ ] Admin role system working (is_admin RPC returns correct results)
- [ ] Admin UI (/xi-admin/platform-credentials) protected by server-side RLS
- [ ] NoAdAccountsBanner displays correctly on /create-campaign only
- [ ] All marketing copy updated (FAQ, Terms, Privacy, Hero)
- [ ] Payment flow works end-to-end (Stripe → publish → success)
- [ ] All 4 publish functions call getSystemCredentials correctly
- [ ] Edge function logs show successful credential retrieval
- [ ] Campaign creation flow works for all 4 platforms
- [ ] Dashboard displays published campaigns correctly
- [ ] Security: Non-admins cannot access credentials or admin pages

---

## Troubleshooting Common Issues

### Issue: "Access denied" when accessing admin page
**Fix:** Verify admin role exists:
```sql
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

### Issue: "Platform credentials unavailable"
**Fix:** Verify system credentials exist:
```sql
SELECT platform, status FROM platform_credentials WHERE owner_type = 'system';
```

### Issue: "Token encryption failed"
**Fix:** Verify ENCRYPTION_KEY secret is set (32 characters):
```bash
# Check in Supabase Dashboard → Project Settings → Edge Functions → Secrets
```

### Issue: Publish function doesn't use system credentials
**Fix:** Check function code calls `getSystemCredentials(platform)` not `getUserCredentials`

### Issue: NoAdAccountsBanner doesn't show
**Fix:** Verify import and component placement in CreateCampaign.tsx line ~465

---

## Success Criteria

**Phase 6 is complete when:**
1. ✅ All 4 system credentials encrypted and stored in database
2. ✅ Admin page accessible only to admin users via server-side RLS
3. ✅ Token update flow works via admin UI + encrypt-master-token
4. ✅ Campaign creation shows NoAdAccountsBanner
5. ✅ All 4 publish functions retrieve system credentials successfully
6. ✅ End-to-end test campaign publishes without errors
7. ✅ No OAuth references remain in user-facing UI/copy
8. ✅ Security validated: non-admins cannot access credentials

---

## Next Steps After Phase 6

Once all tests pass:
1. Deploy to production environment
2. Update DNS/domain settings to https://xixoi.com
3. Submit API approval applications to Meta, Google, TikTok, LinkedIn
4. Monitor edge function logs for first 48 hours
5. Set up token refresh automation (if needed for platforms with expiring tokens)

---

**Last Updated:** 2025-01-17  
**Migration Phase:** 6 of 6  
**Status:** Testing & Validation
