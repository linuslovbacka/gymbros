# GYMBROS

A gamified competitive training app for two players (Linus vs Oskar). **Next.js** on
Supabase. See [gymbros-spec.md](gymbros-spec.md) for the full design.

**Cursor / agents:** start with [docs/HANDOFF.md](docs/HANDOFF.md).  
**MVP scope:** [docs/MVP.md](docs/MVP.md). **Migration log:** [docs/MIGRATION.md](docs/MIGRATION.md).

## Stack

- **Next.js 16** (App Router) + React + TypeScript
- **Tailwind CSS v4** (tokens) + existing Gymbros CSS
- **GSAP** (`@gsap/react`) for light motion on daily checks
- **Supabase** — auth, Postgres, Realtime (`@supabase/ssr` + browser client)
- Deploy: **Vercel** (project root)

## Run locally

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev                  # http://localhost:3000
```

Apply [supabase/migrations/20260605_daily_habits.sql](supabase/migrations/20260605_daily_habits.sql) on the Gymbros Supabase project before using daily habit toggles.

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for backend details and dashboard auth settings.

## Project layout

```
app/              Next.js routes (login, pair, home, schedule, workout, done)
src/content/      Program data — ladders, workouts, schedule helpers
src/engine/       Pure logic — currency, leveling, streaks/rust, achievements
src/state/        Supabase auth, profile sync, habits, app store
src/screens/      Screen components used by app routes
src/components/   Avatar, DailyChecks, auth gates
tools/cosmetic-gen/  Dev-only art pipeline (not MVP runtime)
```

## Build status — Habits MVP

**In scope now:** daily checks (no sugar, protein, training), training schedule view,
core workout loop, email auth. Gamification UI hidden via `MVP_MODE` (locker, currency
fanfare, Pro Mode header).

**Deferred:** cosmetic pipeline, full locker/achievement theatre, PWA polish — see [docs/MVP.md](docs/MVP.md).
