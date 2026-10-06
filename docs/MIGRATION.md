# Vite → Next.js migration log

Track in-place migration at repo root. Details and order: [HANDOFF.md](./HANDOFF.md).

---

## Baseline (Vite era)

**Entry:** `index.html` → `src/main.tsx` → `src/App.tsx` (view state, not routes)

**Remove after parity:**

- [x] `vite.config.ts`
- [x] `index.html`
- [x] `src/main.tsx`
- [x] Vite-specific env: `VITE_SUPABASE_*` → `NEXT_PUBLIC_SUPABASE_*` (legacy `VITE_*` still read as fallback in `src/lib/supabase/env.ts`)

**Keep (paths stable if possible):**

- [x] `src/content/`
- [x] `src/engine/`
- [x] `tools/cosmetic-gen/` (unchanged)

---

## Parity checklist

- [x] Email auth + password recovery flow (`/login`, `/update-password`)
- [x] Pair create/join (`/pair`)
- [x] Start (VS) screen (`/`)
- [x] Workout → Done → session insert (`/workout`, `/done` + sessionStorage draft)
- [x] Profile save + partner Realtime

---

## Next scaffold

- [x] Next.js App Router + TypeScript + Tailwind at repo root
- [x] `gsap`, `@gsap/react`, `@supabase/ssr`
- [x] `middleware.ts` session refresh
- [x] Routes: `/login`, `/pair`, `/`, `/schedule`, `/workout`, `/done`, `/update-password`
- [x] `npm run build` passes

---

## Habits MVP (Phase 1)

- [x] `supabase/migrations/20260605_daily_habits.sql` in repo
- [ ] Apply migration on project `sokuvssuuightppxlqoi` (Supabase SQL editor or CLI if MCP times out)
- [x] `DailyChecks`, `/schedule`, `MVP_MODE` UI trim

---

## Completed migration steps

| Date | Step |
|------|------|
| 2026-06-05 | Next.js in-place at repo root; habits MVP UI + migration SQL |
