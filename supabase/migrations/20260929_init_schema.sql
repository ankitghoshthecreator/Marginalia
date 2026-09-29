-- Migration 20260929_init_schema.sql
-- Postgres schema with Row Level Security (RLS) for Supabase

create table if not exists profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  created_at timestamptz default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  body_ciphertext bytea not null,       -- client-side encrypted, server never sees plaintext
  body_nonce bytea not null,
  mood_label text,                      -- classification result
  mood_confidence real,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  device_vector_clock jsonb default '{}'::jsonb
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  name text not null,
  cadence text not null check (cadence in ('daily','weekly','custom')),
  created_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  logged_at date not null,
  unique (habit_id, logged_at)
);

-- Enable RLS
alter table entries enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;

-- RLS Security Policies
create policy "own entries only" on entries
  for all using (auth.uid() = user_id);

create policy "own habits only" on habits
  for all using (auth.uid() = user_id);

create policy "own habit logs only" on habit_logs
  for all using (
    auth.uid() = (select user_id from habits where habits.id = habit_id)
  );
