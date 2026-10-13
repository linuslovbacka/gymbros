alter table public.daily_habits
  add column if not exists calories_kcal integer not null default 0,
  add column if not exists calories_met boolean not null default false;

alter table public.profiles
  add column if not exists kcal_target integer;
