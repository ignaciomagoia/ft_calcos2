create or replace function public.is_admin(uid uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
  );
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.coupons enable row level security;
alter table public.subcategories enable row level security;
alter table public.product_subcategories enable row level security;
alter table public.orders enable row level security;

-- categories
drop policy if exists "public select categories" on public.categories;
create policy "public select categories"
  on public.categories
  for select
  using (true);

drop policy if exists "admin insert categories" on public.categories;
create policy "admin insert categories"
  on public.categories
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin update categories" on public.categories;
create policy "admin update categories"
  on public.categories
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin delete categories" on public.categories;
create policy "admin delete categories"
  on public.categories
  for delete
  using (public.is_admin(auth.uid()));

-- products
drop policy if exists "public select products" on public.products;
create policy "public select products"
  on public.products
  for select
  using (active = true);

drop policy if exists "admin select products" on public.products;
create policy "admin select products"
  on public.products
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "admin insert products" on public.products;
create policy "admin insert products"
  on public.products
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin update products" on public.products;
create policy "admin update products"
  on public.products
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin delete products" on public.products;
create policy "admin delete products"
  on public.products
  for delete
  using (public.is_admin(auth.uid()));

-- subcategories
drop policy if exists "public select subcategories" on public.subcategories;
create policy "public select subcategories"
  on public.subcategories
  for select
  using (true);

drop policy if exists "admin select subcategories" on public.subcategories;
create policy "admin select subcategories"
  on public.subcategories
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "admin insert subcategories" on public.subcategories;
create policy "admin insert subcategories"
  on public.subcategories
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin update subcategories" on public.subcategories;
create policy "admin update subcategories"
  on public.subcategories
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin delete subcategories" on public.subcategories;
create policy "admin delete subcategories"
  on public.subcategories
  for delete
  using (public.is_admin(auth.uid()));

-- product_subcategories
drop policy if exists "public select product_subcategories" on public.product_subcategories;
create policy "public select product_subcategories"
  on public.product_subcategories
  for select
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_subcategories.product_id
        and p.active = true
    )
  );

drop policy if exists "admin select product_subcategories" on public.product_subcategories;
create policy "admin select product_subcategories"
  on public.product_subcategories
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "admin insert product_subcategories" on public.product_subcategories;
create policy "admin insert product_subcategories"
  on public.product_subcategories
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin delete product_subcategories" on public.product_subcategories;
create policy "admin delete product_subcategories"
  on public.product_subcategories
  for delete
  using (public.is_admin(auth.uid()));

-- profiles
drop policy if exists "user read profile" on public.profiles;
create policy "user read profile"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "admin update profile" on public.profiles;
create policy "admin update profile"
  on public.profiles
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- coupons
drop policy if exists "admin select coupons" on public.coupons;
create policy "admin select coupons"
  on public.coupons
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "admin insert coupons" on public.coupons;
create policy "admin insert coupons"
  on public.coupons
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin delete coupons" on public.coupons;
create policy "admin delete coupons"
  on public.coupons
  for delete
  using (public.is_admin(auth.uid()));

-- orders
drop policy if exists "public insert orders" on public.orders;
create policy "public insert orders"
  on public.orders
  for insert
  with check (source = 'web');

drop policy if exists "admin select orders" on public.orders;
create policy "admin select orders"
  on public.orders
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "admin delete orders" on public.orders;
create policy "admin delete orders"
  on public.orders
  for delete
  using (public.is_admin(auth.uid()));
