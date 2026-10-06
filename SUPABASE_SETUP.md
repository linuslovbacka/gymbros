# Supabase setup — Gymbros

The Gymbros Supabase project is **already created and provisioned** (separate from
Gröda). Auth is **email + password only** (no Google OAuth in the app).

## Project

- **Project ref:** `sokuvssuuightppxlqoi`
- **URL:** `https://sokuvssuuightppxlqoi.supabase.co`
- **Region:** eu-north-1
- Keys live in `.env.local` (gitignored). The publishable key is safe in the browser.

## Schema (already applied)

Tables, RLS, realtime, and storage are live:

- **`pairs`** — links the two accounts via a 6-char `invite_code`.
- **`profiles`** — one row per user (currencies, tiers, streak, rest tokens, equipped
  gear, `exercise_state`, `program_stage`, ...). RLS lets a user read/write their own
  row and **read their pair partner's** row.
- **`sessions`** — one row per logged workout.
- **RPCs:** `create_pair()`, `join_pair(p_code)` (security definer, authenticated only).
- **Trigger:** a profile row is auto-created on signup.
- **Realtime:** `profiles` and `sessions` are in the `supabase_realtime` publication.
- **Storage:** public `avatars` bucket for future sprite art (Phase 5).

To re-run or inspect, the SQL lives in the migration history / can be re-applied from
the dashboard SQL editor.

## Auth URL configuration (required for password reset)

Dashboard → **Authentication → URL Configuration**:

- Add **Redirect URLs** for every app origin (password-reset emails redirect here):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/update-password`
  - Production: `https://YOUR_DOMAIN/auth/callback` and `https://YOUR_DOMAIN/update-password`
  - Vercel preview URLs with the same paths when testing previews
- **Site URL** should match your primary deployed origin.

The app calls `resetPasswordForEmail` with `redirectTo: window.location.origin` and
shows `UpdatePasswordScreen` on the `PASSWORD_RECOVERY` auth event.

## Email confirmation (pick one)

By default Supabase requires email confirmation. For a closed 2-user app you can either:

- **Disable confirm email** — Dashboard → **Authentication → Sign In / Up → Email** →
  toggle off "Confirm email" (simplest for Linus + Oskar), or
- **Custom SMTP** (Resend/SendGrid) so confirmation + reset emails are reliable in prod.

Default Supabase email is rate-limited and spam-prone.

## Lock down sign-ups (after both accounts exist)

Once Linus + Oskar have accounts, disable open registration (allowlist or disable sign-ups)
so strangers with the URL cannot create accounts. RLS + pairing protect data, but auth
accounts would still be open otherwise.

## Env vars (Next.js)

```
NEXT_PUBLIC_SUPABASE_URL=https://sokuvssuuightppxlqoi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Add the same two variables to the Vercel project (Production + Preview). Legacy `VITE_*` names still work locally as a fallback.

## Habits MVP schema

Run [supabase/migrations/20260605_daily_habits.sql](supabase/migrations/20260605_daily_habits.sql) in the SQL editor (table `daily_habits`, partner read RLS, `profiles.protein_target_g`, Realtime publication).
