# xiXoi™ Admin Dashboard

## Overview
The admin dashboard provides complete visibility into watermark violations, manual charging, and revenue tracking.

## Access Control
- **Role-based**: Uses separate `user_roles` table (prevents privilege escalation)
- **Security definer function**: `has_role()` checks admin status securely
- **Admin-only route**: `/admin` automatically redirects non-admins

## Features

### 1. **Violation Tracking**
- View all free ads published
- See tampered vs. intact watermarks
- Track charged vs. uncharged violations
- Monitor revenue in real-time

### 2. **Manual Charging**
- One-click $29 charge for any free ad
- Creates Stripe checkout session
- Updates `free_ads.tampered` and `free_ads.charged`
- Removes watermark from campaign after payment

### 3. **Forgiveness System**
- Admins can forgive violations
- Resets `tampered` and `charged` flags
- Good for customer support / special cases

## How to Grant Admin Access

### Option 1: Direct SQL (Supabase SQL Editor)
```sql
-- Replace YOUR_USER_ID with actual UUID
insert into user_roles (user_id, role)
values ('YOUR_USER_ID', 'admin');
```

### Option 2: Via Backend Function
Create a one-time setup function:
```sql
create or replace function grant_admin(user_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where email = user_email;

  if target_user_id is null then
    raise exception 'User not found';
  end if;

  insert into user_roles (user_id, role)
  values (target_user_id, 'admin')
  on conflict (user_id, role) do nothing;
end;
$$;

-- Usage:
select grant_admin('admin@xixoi.com');
```

## Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Total Free Ads | All free ads published |
| Tampered | Ads with watermark removed |
| Charged | Users who paid $29 |
| Total Revenue | Sum of all $29 charges |

## Actions

### Charge $29
- Triggers when admin clicks "Charge $29"
- Creates Stripe checkout session
- Redirects admin to confirm payment
- Webhook updates `free_ads` table on success

### Forgive
- Resets violation status
- Does **not** refund if already charged
- Use for: support cases, false positives, goodwill

## Security Notes

✅ **Secure**: Uses separate `user_roles` table  
✅ **Secure**: Security definer function prevents RLS recursion  
✅ **Secure**: No auth.users exposure in views  
✅ **Secure**: Admin check on frontend + backend  

⚠️ **Remaining Warnings** (non-critical):
- Function search path: Intentionally set for security definer functions
- Password leak protection: Enable in Supabase Auth settings

## Testing

1. **Grant yourself admin**:
   ```sql
   insert into user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'your@email.com';
   ```

2. **Visit `/admin`**

3. **See dashboard** with all free ads

4. **Test charge flow**:
   - Click "Charge $29" on any ad
   - Complete Stripe checkout (test mode: 4242 4242 4242 4242)
   - Verify ad marked as charged

## Next Steps

- [ ] Add CSV export functionality
- [ ] Add email alerts on tamper detection
- [ ] Add client-side steganography (invisible watermarks)
- [ ] Add analytics charts (revenue over time)
- [ ] Add bulk actions (charge all tampered)
