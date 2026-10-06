# Agent handoff — Gymbros

**Read this first** in a new Cursor session. Product design lives in [gymbros-spec.md](../gymbros-spec.md). Deferred ideas in [BACKLOG.md](../BACKLOG.md).

---

## Workspace

- **Folder:** `Gymbros_APP` under iCloud `Projects_Active` (open this folder as the Cursor workspace root).
- **GitHub:** [linuslovbacka/gymbros](https://github.com/linuslovbacka/gymbros)
- **Deploy:** Vercel → `gymbros-nine.vercel.app`
- **Supabase:** project `sokuvssuuightppxlqoi` — see [SUPABASE_SETUP.md](../SUPABASE_SETUP.md)

---

## What “execute the plan” means (default)

Unless the user names something else, **execute the habits MVP + in-place Next.js migration** described in [MVP.md](./MVP.md) and the build order below.

**Do not** re-implement auth code unless the user asks — email/password + password reset is **done** (see [Completed](#completed)).

**Do not** start `tools/cosmetic-gen/` or flashy gamification UI for MVP (`MVP_MODE` hides locker, IRON shop, achievement fanfare).

---

## Current stack

| Layer | Today |
|--------|--------|
| UI | **Next.js 16** App Router (`app/`), React 19, Tailwind v4 + Gymbros CSS |
| Motion | **GSAP** on daily checks (client); `prefers-reduced-motion` respected |
| Backend | Supabase (`@supabase/ssr` + browser client), RLS, Realtime on `profiles` + `daily_habits` |
| Auth | Email/password only; forgot password + `/update-password`; **no Google OAuth** |
| MVP | `MVP_MODE` hides locker / currency theatre; habits + `/schedule` live |
| Deploy | Vercel, project root |

Aligns with **Gröda / DLKK** (Next on Vercel) while keeping Gymbros’s own Supabase project.

---

## Active build order

**Migration + habits MVP (code): done.** See [MIGRATION.md](./MIGRATION.md).

**Manual follow-up:** apply [supabase/migrations/20260605_daily_habits.sql](../supabase/migrations/20260605_daily_habits.sql) on Supabase if not already applied (habit toggles need the table).

**Next product work (post-MVP):** turn off `MVP_MODE` in `src/lib/mvp.ts` when ready for locker/achievements; optional habit add-ons beyond sleep/steps/creatine per [MVP.md](./MVP.md).

---

## Completed

| Date | Work |
|------|------|
| 2026-06 | **Auth hardening (code):** forgot password, `UpdatePasswordScreen`, Google sign-in removed. Dashboard follow-ups still in BACKLOG § “Supabase dashboard auth settings”. |

---

## Manual (human) — not agent code

From [BACKLOG.md](../BACKLOG.md):

1. Supabase **Redirect URLs** for password reset (`localhost` + Vercel).
2. **Email confirmation** vs custom SMTP (or disable for 2-user app).
3. **Lock sign-ups** after Linus + Oskar accounts exist.

---

## Pitfalls for agents

- **BACKLOG “NEXT SESSION”** = dashboard auth only, **not** the MVP/Next plan.
- **README “Phase 1”** is outdated vs `main` (achievements/locker exist in code); MVP intentionally **hides** them.
- **iCloud Optimise Storage** can evict files — user may need to open folder locally before long sessions.
- Never commit iCloud `* 2` duplicate paths.

---

## Key files

```
app/                      Next.js routes
src/content/workouts.ts   Program + buildWorkout()
src/content/schedule.ts   Schedule helpers + today preview
src/state/store.tsx       Auth, pair, sessions, habits, profile sync
src/screens/*             Screen components
src/lib/mvp.ts            MVP_MODE flag
tools/cosmetic-gen/       Dev-only art pipeline — out of MVP scope
supabase/migrations/      SQL (apply daily_habits on remote)
docs/MVP.md               Product scope in/out
docs/MIGRATION.md         Migration checklist
```
