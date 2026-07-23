-- Crédit de bienvenue PRO PexxaFloor
-- À exécuter une seule fois dans le SQL Editor Supabase.

begin;

create table if not exists public.pro_credit_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance_cents integer not null default 0 check (balance_cents >= 0),
  total_granted_cents integer not null default 0 check (total_granted_cents >= 0),
  total_used_cents integer not null default 0 check (total_used_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pro_credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cart_id uuid references public.carts_temp(id) on delete set null,
  stripe_session_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'consumed', 'released')),
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  consumed_at timestamptz,
  released_at timestamptz,
  unique (cart_id)
);

create table if not exists public.pro_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reservation_id uuid references public.pro_credit_reservations(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  amount_cents integer not null check (amount_cents <> 0),
  type text not null check (type in ('welcome_grant', 'redemption', 'refund', 'adjustment')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists pro_credit_reservations_user_idx
  on public.pro_credit_reservations (user_id, status);

create index if not exists pro_credit_transactions_user_idx
  on public.pro_credit_transactions (user_id, created_at desc);

alter table public.pro_credit_accounts enable row level security;
alter table public.pro_credit_reservations enable row level security;
alter table public.pro_credit_transactions enable row level security;

drop policy if exists "Users can read their own credit account"
  on public.pro_credit_accounts;
create policy "Users can read their own credit account"
  on public.pro_credit_accounts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own credit reservations"
  on public.pro_credit_reservations;
create policy "Users can read their own credit reservations"
  on public.pro_credit_reservations for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own credit transactions"
  on public.pro_credit_transactions;
create policy "Users can read their own credit transactions"
  on public.pro_credit_transactions for select
  to authenticated
  using (auth.uid() = user_id);

-- Aucune écriture directe depuis le navigateur : toutes les mutations passent
-- par le serveur avec la service role et ces fonctions atomiques.
revoke insert, update, delete on public.pro_credit_accounts from anon, authenticated;
revoke insert, update, delete on public.pro_credit_reservations from anon, authenticated;
revoke insert, update, delete on public.pro_credit_transactions from anon, authenticated;

create or replace function public.grant_pro_welcome_credit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_user uuid;
begin
  if new.is_pro is true and coalesce(old.is_pro, false) is false then
    insert into public.pro_credit_accounts (
      user_id,
      balance_cents,
      total_granted_cents
    )
    values (new.id, 1000, 1000)
    on conflict (user_id) do nothing
    returning user_id into inserted_user;

    if inserted_user is not null then
      insert into public.pro_credit_transactions (
        user_id,
        amount_cents,
        type,
        idempotency_key
      )
      values (
        new.id,
        1000,
        'welcome_grant',
        'welcome:' || new.id::text
      )
      on conflict (idempotency_key) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists grant_pro_welcome_credit_trigger on public.profiles;
create trigger grant_pro_welcome_credit_trigger
after update of is_pro on public.profiles
for each row
execute function public.grant_pro_welcome_credit();

create or replace function public.grant_pro_welcome_credit_on_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_user uuid;
  became_verified boolean;
begin
  became_verified :=
    new.status = 'VERIFIED'
    and (
      tg_op = 'INSERT'
      or (tg_op = 'UPDATE' and old.status is distinct from 'VERIFIED')
    );

  if became_verified then
    insert into public.pro_credit_accounts (
      user_id,
      balance_cents,
      total_granted_cents
    )
    values (new.user_id, 1000, 1000)
    on conflict (user_id) do nothing
    returning user_id into inserted_user;

    if inserted_user is not null then
      insert into public.pro_credit_transactions (
        user_id,
        amount_cents,
        type,
        idempotency_key
      )
      values (
        new.user_id,
        1000,
        'welcome_grant',
        'welcome:' || new.user_id::text
      )
      on conflict (idempotency_key) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists grant_pro_welcome_credit_application_trigger
  on public.pro_applications;
create trigger grant_pro_welcome_credit_application_trigger
after insert or update of status on public.pro_applications
for each row
execute function public.grant_pro_welcome_credit_on_application();

create or replace function public.reserve_pro_credit(
  p_user_id uuid,
  p_cart_id uuid,
  p_max_amount_cents integer
)
returns table (reservation_id uuid, amount_cents integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  account_balance integer;
  reserved_amount integer;
  new_reservation_id uuid;
begin
  if p_max_amount_cents <= 0 then
    return;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_user_id and is_pro is true
  ) then
    return;
  end if;

  select r.id, r.amount_cents
  into new_reservation_id, reserved_amount
  from public.pro_credit_reservations r
  where r.cart_id = p_cart_id and r.status = 'reserved';

  if new_reservation_id is not null then
    return query select new_reservation_id, reserved_amount;
    return;
  end if;

  select a.balance_cents
  into account_balance
  from public.pro_credit_accounts a
  where a.user_id = p_user_id
  for update;

  reserved_amount := least(coalesce(account_balance, 0), p_max_amount_cents);
  if reserved_amount <= 0 then
    return;
  end if;

  update public.pro_credit_accounts
  set
    balance_cents = balance_cents - reserved_amount,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.pro_credit_reservations (
    user_id,
    cart_id,
    amount_cents
  )
  values (p_user_id, p_cart_id, reserved_amount)
  returning id into new_reservation_id;

  return query select new_reservation_id, reserved_amount;
end;
$$;

create or replace function public.attach_credit_stripe_session(
  p_reservation_id uuid,
  p_stripe_session_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pro_credit_reservations
  set stripe_session_id = p_stripe_session_id, updated_at = now()
  where id = p_reservation_id and status = 'reserved';

  if not found then
    raise exception 'Credit reservation not found';
  end if;
end;
$$;

create or replace function public.consume_pro_credit(
  p_stripe_session_id text,
  p_order_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation_row public.pro_credit_reservations%rowtype;
begin
  select *
  into reservation_row
  from public.pro_credit_reservations
  where stripe_session_id = p_stripe_session_id
  for update;

  if not found or reservation_row.status = 'released' then
    return 0;
  end if;

  if reservation_row.status = 'consumed' then
    return reservation_row.amount_cents;
  end if;

  update public.pro_credit_reservations
  set
    status = 'consumed',
    order_id = p_order_id,
    consumed_at = now(),
    updated_at = now()
  where id = reservation_row.id;

  update public.pro_credit_accounts
  set
    total_used_cents = total_used_cents + reservation_row.amount_cents,
    updated_at = now()
  where user_id = reservation_row.user_id;

  insert into public.pro_credit_transactions (
    user_id,
    reservation_id,
    order_id,
    amount_cents,
    type,
    idempotency_key
  )
  values (
    reservation_row.user_id,
    reservation_row.id,
    p_order_id,
    -reservation_row.amount_cents,
    'redemption',
    'redemption:' || reservation_row.id::text
  )
  on conflict (idempotency_key) do nothing;

  return reservation_row.amount_cents;
end;
$$;

create or replace function public.release_pro_credit(
  p_stripe_session_id text default null,
  p_reservation_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation_row public.pro_credit_reservations%rowtype;
begin
  select *
  into reservation_row
  from public.pro_credit_reservations
  where
    (p_stripe_session_id is not null and stripe_session_id = p_stripe_session_id)
    or (p_reservation_id is not null and id = p_reservation_id)
  for update;

  if not found or reservation_row.status <> 'reserved' then
    return 0;
  end if;

  update public.pro_credit_accounts
  set
    balance_cents = balance_cents + reservation_row.amount_cents,
    updated_at = now()
  where user_id = reservation_row.user_id;

  update public.pro_credit_reservations
  set
    status = 'released',
    released_at = now(),
    updated_at = now()
  where id = reservation_row.id;

  return reservation_row.amount_cents;
end;
$$;

revoke all on function public.reserve_pro_credit(uuid, uuid, integer) from public;
revoke all on function public.attach_credit_stripe_session(uuid, text) from public;
revoke all on function public.consume_pro_credit(text, uuid) from public;
revoke all on function public.release_pro_credit(text, uuid) from public;

grant execute on function public.reserve_pro_credit(uuid, uuid, integer) to service_role;
grant execute on function public.attach_credit_stripe_session(uuid, text) to service_role;
grant execute on function public.consume_pro_credit(text, uuid) to service_role;
grant execute on function public.release_pro_credit(text, uuid) to service_role;

commit;
