# Gymbros — Backlog

Open design questions and deferred work. Not yet scheduled.

**Primary dev plan for agents:** [docs/HANDOFF.md](docs/HANDOFF.md) + [docs/MVP.md](docs/MVP.md) (habits MVP + Next.js in-place).  
**This file** = deferred product/ops items, not the default “execute the plan” target.

---

## Supabase dashboard auth settings (manual — code done)

**Status:** Code done (email/password + reset). Remaining work is dashboard-only.

### To do
3. **Email confirmation decision** (Supabase dashboard, not code): either wire
   custom SMTP (Resend/SendGrid) so confirmation + reset emails are reliable, OR
   disable email confirmation since it's a closed 2-person app. Default Supabase
   email is rate-limited and spam-prone.
4. **Lock down sign-ups** (dashboard) once both accounts (Linus + Oskar) exist —
   disable new sign-ups or add an allowlist, so a stranger with the URL can't
   register. RLS + pairing already protect data, but accounts would still be open.

### Nice-to-have (later)
- Optional MFA (Supabase supports it) — low priority for a 2-user app.

---

## Wardrobe changes vs. spritesheet generation cost

**Status:** Open — recommendation below, not yet implemented.

### Problem
Each distinct **body-worn loadout** needs its own pre-baked, animated spritesheet
(idle 4 + flex 4 = 8 frames) per physique tier, produced through the manual,
approval-gated Phase 8 pipeline (`tools/cosmetic-gen`). Letting players freely mix
bought gear implies a combinatorial set of looks that each need art — and the app
never generates images at runtime.

### Key reframe
This is a **2-player app** (Linus + Oskar). At most **two loadouts are ever live**
at once, so there is no real combinatorial explosion: we only need the current look
each player wears at their current tier. The genuine constraints are:
1. Generation is **not live/instant** (dev + Gemini + approval), so a just-equipped
   combo has no art the moment it's equipped.
2. Each bake is **8 Gemini frames** — trivial cost at this scale, even daily.

### Recommendation
- **Only body-worn slots cost a bake.** Keep aura, companion, and title as runtime
  overlays / text — **instant and free to swap anytime**. Make this distinction
  visible in the locker UI so most "fun" swapping is zero-cost.
- **Equipping a body item is a "commit" that forges a new look:** enqueue a bake of
  that one loadout at the player's current tier. Until it's ready, fall back
  gracefully (previous baked look, or layered placeholder + item icon) so an
  unbaked combo never looks broken.
- **Add a cooldown framed as flavor/progression, not a combo limit** — e.g. one
  reforge per training day. Fits the game's "commitment" tone (cf. Pro Mode's
  "no going back").
- **Auto-equip-latest as the lazy default** for whoever doesn't want to fiddle.

### Options considered
- **"Always wears the latest"** — simplest, deterministic, near-zero pipeline
  burden, but kills the RPG dress-up fun.
- **"Change ~1/day"** — keeps expression, makes looks feel earned, naturally
  rate-limits baking. **Preferred**, provided there's a clean "look is being forged"
  fallback.

### Cheaper-art lever
For non-current / historical looks, bake **idle-only (4 frames)** and generate flex
lazily on first flex — halves per-look cost if it ever matters.

### If true unlimited instant swapping is ever needed
Move body slots to **layered paper-doll compositing** (each item its own animated
overlay aligned to the shared frame choreography). Any combo becomes stacked
runtime layers with zero new generation. More art-pipeline work per item and
trickier to keep aligned across the flex deform — almost certainly not worth it for
2 users, but it's the "right" answer if this ever became real multiplayer.

### Tier interaction (note)
A loadout bake is keyed by `(tier, loadout_hash)`. Leveling a physique tier requires
re-baking the current loadout at the new tier. Automatic under the "commit on
change / on level-up" flow; still fine at 2 users.
