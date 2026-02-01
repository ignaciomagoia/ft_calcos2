insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

drop policy if exists "public read products bucket" on storage.objects;
create policy "public read products bucket"
  on storage.objects
  for select
  using (bucket_id = 'products');

drop policy if exists "admin insert products bucket" on storage.objects;
create policy "admin insert products bucket"
  on storage.objects
  for insert
  with check (bucket_id = 'products' and public.is_admin(auth.uid()));

drop policy if exists "admin update products bucket" on storage.objects;
create policy "admin update products bucket"
  on storage.objects
  for update
  using (bucket_id = 'products' and public.is_admin(auth.uid()))
  with check (bucket_id = 'products' and public.is_admin(auth.uid()));

drop policy if exists "admin delete products bucket" on storage.objects;
create policy "admin delete products bucket"
  on storage.objects
  for delete
  using (bucket_id = 'products' and public.is_admin(auth.uid()));
