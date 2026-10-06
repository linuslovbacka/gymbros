alter table public.daily_habits
  add column if not exists steps_met boolean not null default false;
