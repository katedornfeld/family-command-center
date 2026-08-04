-- Family Command Center — Core MVP Schema
-- Tables: family_members, events, weather_forecasts, meal_plans, grocery_items
--
-- Run this once in the Supabase SQL Editor (see instructions in the PR/chat).
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE.

-- ---------------------------------------------------------------------------
-- Extension needed for gen_random_uuid()
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helper: auto-update `updated_at` on any row update
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- family_members
-- ---------------------------------------------------------------------------
create table if not exists family_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_updated_at on family_members;
create trigger set_updated_at
  before update on family_members
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  event_date        date not null,
  start_time        time,
  end_time          time,
  location          text,
  family_member_id  uuid references family_members(id) on delete set null,
  event_type        text not null default 'appointment'
                      check (event_type in ('appointment', 'activity', 'birthday', 'work', 'school')),
  notes             text,
  is_recurring      boolean not null default false,
  is_cancelled      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint events_time_range check (
    start_time is null or end_time is null or end_time >= start_time
  )
);

create index if not exists events_event_date_idx on events (event_date);
create index if not exists events_family_member_id_idx on events (family_member_id);

drop trigger if exists set_updated_at on events;
create trigger set_updated_at
  before update on events
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- weather_forecasts
-- ---------------------------------------------------------------------------
create table if not exists weather_forecasts (
  id             uuid primary key default gen_random_uuid(),
  forecast_date  date not null unique,
  high_temp      numeric,
  low_temp       numeric,
  condition      text,
  last_updated   timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists weather_forecasts_forecast_date_idx on weather_forecasts (forecast_date);

-- ---------------------------------------------------------------------------
-- meal_plans
-- ---------------------------------------------------------------------------
create table if not exists meal_plans (
  id           uuid primary key default gen_random_uuid(),
  plan_date    date not null,
  meal_name    text not null,
  description  text,
  prep_note    text,
  reason       text,
  source       text not null default 'claude'
                 check (source in ('claude', 'manual')),
  status       text not null default 'suggested'
                 check (status in ('suggested', 'approved', 'edited', 'rejected')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists meal_plans_plan_date_idx on meal_plans (plan_date);
create index if not exists meal_plans_status_idx on meal_plans (status);

drop trigger if exists set_updated_at on meal_plans;
create trigger set_updated_at
  before update on meal_plans
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- grocery_items
-- ---------------------------------------------------------------------------
create table if not exists grocery_items (
  id          uuid primary key default gen_random_uuid(),
  item_name   text not null,
  category    text,
  quantity    text,
  purchased   boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists grocery_items_purchased_idx on grocery_items (purchased);

drop trigger if exists set_updated_at on grocery_items;
create trigger set_updated_at
  before update on grocery_items
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This MVP has no authentication (single shared household, no user accounts),
-- so RLS is enabled with a single permissive policy per table that allows
-- full access to the anon/authenticated roles used by the app's Supabase
-- client. This satisfies Supabase's requirement that every table have RLS
-- policies without introducing per-user auth logic, which is explicitly out
-- of scope for the MVP.
-- ---------------------------------------------------------------------------
alter table family_members    enable row level security;
alter table events            enable row level security;
alter table weather_forecasts enable row level security;
alter table meal_plans        enable row level security;
alter table grocery_items     enable row level security;

drop policy if exists "Allow all access" on family_members;
create policy "Allow all access" on family_members
  for all using (true) with check (true);

drop policy if exists "Allow all access" on events;
create policy "Allow all access" on events
  for all using (true) with check (true);

drop policy if exists "Allow all access" on weather_forecasts;
create policy "Allow all access" on weather_forecasts
  for all using (true) with check (true);

drop policy if exists "Allow all access" on meal_plans;
create policy "Allow all access" on meal_plans
  for all using (true) with check (true);

drop policy if exists "Allow all access" on grocery_items;
create policy "Allow all access" on grocery_items
  for all using (true) with check (true);
