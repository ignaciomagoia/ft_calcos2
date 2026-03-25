-- Product numeric order optimization for large catalogs.
-- Safe to run multiple times.

alter table public.products
add column if not exists sort_number integer;

create or replace function public.extract_product_sort_number(product_name text)
returns integer
language plpgsql
immutable
as $$
declare
  matches text[];
begin
  matches := regexp_match(coalesce(product_name, ''), '(\d+)\s*$');

  if matches is null then
    return null;
  end if;

  return matches[1]::integer;
end;
$$;

update public.products
set sort_number = public.extract_product_sort_number(name)
where sort_number is distinct from public.extract_product_sort_number(name);

create or replace function public.set_product_sort_number()
returns trigger
language plpgsql
as $$
begin
  new.sort_number := public.extract_product_sort_number(new.name);
  return new;
end;
$$;

drop trigger if exists trg_products_set_sort_number on public.products;

create trigger trg_products_set_sort_number
before insert or update of name
on public.products
for each row
execute function public.set_product_sort_number();

create index if not exists products_category_active_sort_idx
on public.products (category_id, active, sort_number, name, id);

create index if not exists product_subcategories_subcategory_product_idx
on public.product_subcategories (subcategory_id, product_id);

