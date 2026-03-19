create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  subcategory_id uuid not null references public.subcategories(id) on delete restrict,
  price_cash numeric(12,2) not null,
  price_installment numeric(12,2) not null,
  old_price numeric(12,2),
  badge text not null default 'Destaque',
  short_description text not null default 'Produto disponível na vitrine da loja.',
  highlights text[] not null default array['Atendimento via WhatsApp']::text[],
  is_visible boolean not null default true,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_channels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  value text not null,
  href text not null default '#',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_intro text not null,
  whatsapp_floating_message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_sort_order_idx on public.categories (sort_order);
create index if not exists subcategories_category_sort_order_idx on public.subcategories (category_id, sort_order);
create index if not exists products_sort_order_idx on public.products (sort_order);
create index if not exists product_images_product_sort_order_idx on public.product_images (product_id, sort_order);
create index if not exists attendants_sort_order_idx on public.attendants (sort_order);
create index if not exists contact_channels_sort_order_idx on public.contact_channels (sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists subcategories_set_updated_at on public.subcategories;
create trigger subcategories_set_updated_at before update on public.subcategories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists product_images_set_updated_at on public.product_images;
create trigger product_images_set_updated_at before update on public.product_images
for each row execute function public.set_updated_at();

drop trigger if exists attendants_set_updated_at on public.attendants;
create trigger attendants_set_updated_at before update on public.attendants
for each row execute function public.set_updated_at();

drop trigger if exists contact_channels_set_updated_at on public.contact_channels;
create trigger contact_channels_set_updated_at before update on public.contact_channels
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.attendants enable row level security;
alter table public.contact_channels enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "public categories read" on public.categories;
create policy "public categories read" on public.categories
for select to anon, authenticated
using (is_active = true);

drop policy if exists "public subcategories read" on public.subcategories;
create policy "public subcategories read" on public.subcategories
for select to anon, authenticated
using (is_active = true);

drop policy if exists "public products read" on public.products;
create policy "public products read" on public.products
for select to anon, authenticated
using (is_visible = true);

drop policy if exists "public product images read" on public.product_images;
create policy "public product images read" on public.product_images
for select to anon, authenticated
using (true);

drop policy if exists "public attendants read" on public.attendants;
create policy "public attendants read" on public.attendants
for select to anon, authenticated
using (is_active = true);

drop policy if exists "public contact channels read" on public.contact_channels;
create policy "public contact channels read" on public.contact_channels
for select to anon, authenticated
using (is_active = true);

drop policy if exists "public site settings read" on public.site_settings;
create policy "public site settings read" on public.site_settings
for select to anon, authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public product images bucket read" on storage.objects;
create policy "public product images bucket read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');
