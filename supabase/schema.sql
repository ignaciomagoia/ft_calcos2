create extension if not exists "uuid-ossp";

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  image_url text,
  description text,
  product_layout text not null default 'compact',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.categories
  add column if not exists image_url text,
  add column if not exists description text,
  add column if not exists product_layout text not null default 'compact';

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price int not null,
  price_4 int,
  price_6 int,
  price_8 int,
  category_id uuid references public.categories (id) on delete set null,
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.products
  add column if not exists description text,
  add column if not exists price_4 int,
  add column if not exists price_6 int,
  add column if not exists price_8 int;

create table if not exists public.subcategories (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique (category_id, slug)
);

create table if not exists public.product_subcategories (
  subcategory_id uuid not null references public.subcategories (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (subcategory_id, product_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer',
  created_at timestamptz default now()
);

create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (active);
create index if not exists subcategories_category_idx on public.subcategories (category_id);
create index if not exists subcategories_slug_idx on public.subcategories (slug);
create index if not exists product_subcategories_product_idx
  on public.product_subcategories (product_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  percent int not null check (percent between 1 and 100),
  created_at timestamptz default now()
);

create unique index if not exists coupons_code_upper_trim_idx
  on public.coupons ((upper(btrim(code))));
create index if not exists coupons_created_idx
  on public.coupons (created_at desc);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  summary text not null,
  total int not null default 0 check (total >= 0),
  whatsapp_message text not null,
  order_details jsonb,
  source text not null default 'web',
  created_at timestamptz default now()
);

create index if not exists orders_created_idx
  on public.orders (created_at desc);
create index if not exists orders_source_idx
  on public.orders (source);

create or replace function public.validate_coupon(input_code text)
returns table (code text, percent int)
language sql
stable
security definer
set search_path = public
as $$
  select c.code, c.percent
  from public.coupons c
  where upper(btrim(c.code)) = upper(btrim(input_code))
  limit 1;
$$;

revoke all on function public.validate_coupon(text) from public;
grant execute on function public.validate_coupon(text) to anon, authenticated;
