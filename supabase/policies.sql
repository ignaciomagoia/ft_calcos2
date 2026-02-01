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
