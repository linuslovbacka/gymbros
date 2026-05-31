# GYMBROS

A gamified competitive training app for two players (Linus vs Oskar). React PWA on
Supabase. See [gymbros-spec.md](gymbros-spec.md) for the full design.

## Stack

- React + Vite + TypeScript (PWA)
- Supabase — auth, Postgres, realtime, storage
- Deploy: Vercel

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + publishable key
npm run dev
```

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for the backend (already provisioned) and the
one manual step (Google OAuth).

## Project layout

```
src/
  content/    Static content — ladders, exercises, frameworks, Pro Mode labels (spec 4,6,7)
  engine/     Pure logic — IRON/GRIT currency + leveling state machine (spec 5)
  state/      Supabase auth, cloud sync, realtime, the app store
  components/  Avatar (placeholder) + Pro Mode header
  screens/    Auth, Pair, Start (VS), Workout, Done
```

## Build status — Phase 1 (foundation + workout loop)

Done: project scaffold, two-player Supabase schema, auth + invite-code pairing, the
three-screen loop (Start VS / Workout / Done), all spec section 6 ladders + the W1→W3
beginner block, IRON/GRIT computation, and the rep-ceiling level-up engine with the
"ready to climb?" prompt.

Next phases (see spec section 13): achievements, rust/streak system, cosmetics + equip,
real avatar sprites + fire vortex, bro/social achievements, IRON shop.
