alter table public.profiles
  add column if not exists body_weight_kg numeric(5, 1),
  add column if not exists body_height_cm numeric(5, 1);
