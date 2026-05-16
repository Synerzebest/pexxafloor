-- Packs configurables
-- A coller dans l'éditeur SQL Supabase.

create table if not exists public.packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_fr text not null,
  name_nl text not null,
  name_en text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'pack_item_role'
      and n.nspname = 'public'
  ) then
    create type public.pack_item_role as enum ('calculated', 'included', 'option');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'pack_quantity_mode'
      and n.nspname = 'public'
  ) then
    create type public.pack_quantity_mode as enum (
      'fixed',
      'per_surface',
      'per_tube_length',
      'per_circuit',
      'per_perimeter',
      'capacity_match',
      'roll_optimizer',
      'manual_option'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'pack_rounding'
      and n.nspname = 'public'
  ) then
    create type public.pack_rounding as enum ('ceil', 'floor', 'round', 'none');
  end if;
end
$$;

create table if not exists public.pack_items (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.packs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  role public.pack_item_role not null default 'calculated',
  group_key text,
  quantity_mode public.pack_quantity_mode not null default 'fixed',
  quantity_value numeric,
  multiplier numeric not null default 1,
  rounding public.pack_rounding not null default 'ceil',
  conditions jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pack_items_conditions_object check (jsonb_typeof(conditions) = 'object')
);

create index if not exists idx_packs_active_sort
  on public.packs(active, sort_order);

create index if not exists idx_pack_items_pack_sort
  on public.pack_items(pack_id, active, sort_order);

create index if not exists idx_pack_items_product
  on public.pack_items(product_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_packs_updated_at on public.packs;
create trigger set_packs_updated_at
before update on public.packs
for each row execute function public.set_updated_at();

drop trigger if exists set_pack_items_updated_at on public.pack_items;
create trigger set_pack_items_updated_at
before update on public.pack_items
for each row execute function public.set_updated_at();

insert into public.packs (slug, name_fr, name_nl, name_en, sort_order, active)
values
  ('treillis', 'Pack treillis', 'Nettenpakket', 'Mesh pack', 1, true),
  ('agrafe', 'Pack agrafe', 'Tackerpakket', 'Tacker pack', 2, true),
  ('natte', 'Pack plaques a plots', 'Noppenplatenpakket', 'Studded panel pack', 3, true)
on conflict (slug) do update
set
  name_fr = excluded.name_fr,
  name_nl = excluded.name_nl,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- RLS optionnel mais recommande si tu utilises Supabase cote client pour l'admin.
alter table public.packs enable row level security;
alter table public.pack_items enable row level security;

drop policy if exists "Public can read active packs" on public.packs;
create policy "Public can read active packs"
on public.packs
for select
using (active = true);

drop policy if exists "Public can read active pack items" on public.pack_items;
create policy "Public can read active pack items"
on public.pack_items
for select
using (
  active = true
  and exists (
    select 1
    from public.packs p
    where p.id = pack_items.pack_id
      and p.active = true
  )
);

drop policy if exists "Admins can manage packs" on public.packs;
create policy "Admins can manage packs"
on public.packs
for all
using (
  exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and (pr.isadmin = true or pr.role = 'ADMIN' or pr.user_role = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and (pr.isadmin = true or pr.role = 'ADMIN' or pr.user_role = 'admin')
  )
);

drop policy if exists "Admins can manage pack items" on public.pack_items;
create policy "Admins can manage pack items"
on public.pack_items
for all
using (
  exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and (pr.isadmin = true or pr.role = 'ADMIN' or pr.user_role = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and (pr.isadmin = true or pr.role = 'ADMIN' or pr.user_role = 'admin')
  )
);

-- Exemples de configuration a creer depuis l'admin :
-- role = calculated, quantity_mode = capacity_match, group_key = collecteur,
-- quantity_value = nombre de circuits supportes.
--
-- role = calculated, quantity_mode = roll_optimizer, group_key = tubes-pert,
-- quantity_value = longueur du rouleau, conditions = {"tuyauType":"PERT"}.
--
-- role = calculated, quantity_mode = per_surface,
-- quantity_value = surface couverte par unite, multiplier = 1.1.
--
-- role = calculated, quantity_mode = per_circuit,
-- multiplier = 2 pour les raccords depart/retour.
--
-- role = option pour les produits selectionnables.
-- role = included pour les produits offerts/inclus automatiquement.
