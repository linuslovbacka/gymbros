-- Sick day (skip training, keep diet habits), water toggle, maintenance mode

alter table public.daily_habits
  add column if not exists water_met boolean not null default false,
  add column if not exists sick boolean not null default false;

alter table public.profiles
  add column if not exists maintenance_mode boolean not null default false;
