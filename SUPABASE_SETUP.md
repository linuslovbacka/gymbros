# Supabase setup — Gymbros

The Gymbros Supabase project is **already created and provisioned** (separate from
Gröda). This file documents what's there and the one manual step left (Google OAuth).

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

## Manual step: enable Google OAuth

1. Supabase Dashboard → **Authentication → Providers → Google** → enable.
2. Create OAuth credentials in Google Cloud Console; set the authorized redirect URI to
   `https://sokuvssuuightppxlqoi.supabase.co/auth/v1/callback`.
3. Paste the client ID/secret into the Supabase Google provider and save.
4. Dashboard → **Authentication → URL Configuration** → add your site URLs to
   *Redirect URLs* (e.g. `http://localhost:5173`, and the Vercel production + preview
   URLs once deployed).

## For quick local testing without Google

Email + password sign-in is wired up too. By default Supabase requires email
confirmation. For frictionless dev logins, Dashboard → **Authentication → Sign In / Up
→ Email** → toggle off "Confirm email" (turn it back on for production).

## Env vars

```
VITE_SUPABASE_URL=https://sokuvssuuightppxlqoi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Add the same two variables to the Vercel project (Production + Preview).
