alter table public.daily_habits
  add column if not exists protein_g integer not null default 0;
