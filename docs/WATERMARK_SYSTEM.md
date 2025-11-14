# xiXoi™ Watermark Protection System

## Overview
The watermark protection system tracks free ads and ensures users either keep the watermark or pay $29 to remove it.

## How It Works

### 1. **Ad Generation** (Free Users)
- When a free user creates an ad, the system:
  - Creates 1 Meta variant (vs 4 for paid users)
  - Adds visible "Powered by xiXoi™" watermark
  - Creates a `free_ads` record with unique fingerprint
  - Campaign has `has_watermark: true`

### 2. **Publishing Flow**
When user clicks **"Publish Free"** on AdPublished page:

```typescript
// Frontend calls
supabase.functions.invoke('publish-ad', {
  body: { variantId: selectedVariant.id }
})
```

**Publish-Ad Edge Function:**
- Checks if campaign has watermark
- Verifies `free_ads` record exists
- Marks ad as published
- Returns success ✅

### 3. **Remove Watermark** ($29)
When user clicks **"Remove Watermark – $29"**:
- Creates Stripe checkout session
- Redirects to Stripe payment page
- On success, webhook removes watermark from campaign

### 4. **Webhook Processing**
**stripe-webhook** handles:
- `branding_removal` payments → removes watermark
- `watermark_tampered` payments → marks as charged, removes watermark

## Database Schema

### `free_ads` Table
```sql
- id: UUID
- user_id: UUID (references auth.users)
- ad_variant_id: UUID (references ad_variants)
- fingerprint: TEXT (unique identifier)
- image_url: TEXT
- published_at: TIMESTAMP
- tampered: BOOLEAN (default false)
- charged: BOOLEAN (default false)
```

## Testing the Flow

### Test Case 1: Free User Publishing
1. **Sign up** as new user (free plan)
2. **Create campaign** with image
3. **Generate ad** → See 1 Meta variant
4. **Go to AdPublished** page
5. **See**:
   - "FREE PREVIEW" badge
   - "Powered by xiXoi™" watermark
   - "Publish Free" button
   - "Remove Watermark – $29" button
6. **Click "Publish Free"**
7. **Result**: Toast success, redirects to analytics

### Test Case 2: Remove Watermark
1. Follow steps 1-5 above
2. **Click "Remove Watermark – $29"**
3. **Result**: Redirects to Stripe checkout
4. **Complete payment** (use test card: 4242 4242 4242 4242)
5. **Webhook processes** → removes watermark
6. **Return to app** → watermark gone

### Test Case 3: Paid User
1. **Sign up** and subscribe to Pro
2. **Create campaign**
3. **Generate ad** → See 4 variants (Meta, TikTok, Google, LinkedIn)
4. **Go to AdPublished**
5. **See**: No watermark, no "Remove" button
6. Ad published without watermark

## Edge Functions

### `/publish-ad`
- **Auth**: Required (JWT)
- **Input**: `{ variantId: string }`
- **Output**: `{ success: true }` or error
- **Purpose**: Publish ad with watermark tracking

### `/generate-ad-variants`
- **Auth**: Not required (public)
- **Input**: `{ campaignId: string }`
- **Output**: `{ success: true, variants: [] }`
- **Purpose**: Generate AI ad copy + track free ads

### `/stripe-webhook`
- **Auth**: Webhook signature
- **Purpose**: Process payments and update database

## Next Steps: Full Steganography

The current implementation uses **database tracking**. For production with invisible watermarks:

1. **Client-side watermarking** using Canvas API
2. **Embed fingerprint** in image pixels (LSB)
3. **Upload watermarked image** to storage
4. **On publish**: Download, extract, verify fingerprint
5. **If tampered**: Auto-charge $29

This requires:
- Canvas manipulation in browser
- Or server-side with different library (not sharp)
- Or external watermarking service

## Current Status

✅ Database structure
✅ Edge functions deployed
✅ Frontend connected
✅ Stripe integration
✅ Webhook handling
⚠️ Invisible watermark (requires client-side implementation)

## Monitoring

Query free ads:
```sql
SELECT 
  fa.*,
  c.name as campaign_name,
  p.email as user_email
FROM free_ads fa
JOIN ad_variants av ON fa.ad_variant_id = av.id
JOIN campaigns c ON av.campaign_id = c.id
JOIN profiles p ON fa.user_id = p.id
WHERE fa.published_at IS NOT NULL
ORDER BY fa.created_at DESC;
```
