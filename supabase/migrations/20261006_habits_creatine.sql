alter table public.daily_habits
  add column if not exists creatine_met boolean not null default false;
