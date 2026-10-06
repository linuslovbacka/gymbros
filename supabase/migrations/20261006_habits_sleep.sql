alter table public.daily_habits
  add column if not exists sleep_met boolean not null default false;
