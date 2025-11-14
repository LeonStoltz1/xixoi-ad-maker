-- Create role enum
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default now(),
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Create security definer function to check roles (prevents recursive RLS)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Policy: Users can view their own roles
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Policy: Only admins can insert/update/delete roles
create policy "Admins can manage all roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create admin watermark report view (no RLS on views - security comes from underlying tables)
create or replace view admin_watermark_report as
select 
  fa.id,
  fa.ad_variant_id,
  fa.fingerprint,
  fa.image_url,
  fa.published_at,
  fa.tampered,
  fa.charged,
  fa.user_id,
  u.email as user_email,
  c.name as campaign_name,
  c.id as campaign_id,
  av.creative_url,
  av.variant_type as platform,
  p.stripe_customer_id,
  case when fa.charged then 29.00 else 0.00 end as revenue
from free_ads fa
join ad_variants av on fa.ad_variant_id = av.id
join campaigns c on av.campaign_id = c.id
left join profiles p on fa.user_id = p.id
left join auth.users u on fa.user_id = u.id
order by fa.published_at desc nulls last;

-- Grant access to authenticated users (admin check will happen in application layer)
grant select on admin_watermark_report to authenticated;