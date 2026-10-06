-- Habits MVP: daily toggles + optional protein target on profiles

create table if not exists public.daily_habits (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  no_sugar boolean not null default false,
  protein_met boolean not null default false,
  water_met boolean not null default false,
  sick boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.daily_habits enable row level security;

create policy "daily_habits_own_all"
  on public.daily_habits
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_habits_partner_read"
  on public.daily_habits
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles me
      join public.profiles bro
        on bro.pair_id = me.pair_id
       and bro.user_id <> me.user_id
      where me.user_id = auth.uid()
        and bro.user_id = daily_habits.user_id
    )
  );

alter table public.profiles
  add column if not exists protein_target_g integer default 110;

alter publication supabase_realtime add table public.daily_habits;
