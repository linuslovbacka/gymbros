alter table public.daily_habits
  add column if not exists mobility_met boolean not null default false;
