# Gymbros — Avatar & Cosmetic Generation Pipeline

A **dev-run, manual, approval-gated** CLI that produces every avatar sprite, cosmetic,
and fire-vortex effect for Gymbros. It is **separate from the app**: the app never calls
image models — it only reads finished, **approved** assets from Supabase (the `avatars`
bucket + the `generated_images` / `avatar_renders` / `cosmetics` tables).

See `../../gymbros-generation-spec.md` for the full design and the reasoning behind it.

> This is the **final pre-launch task**. The app ships against placeholder art first; real
> sprites are generated and approved here last, once everything else works.

## Setup

```bash
cd tools/cosmetic-gen
npm install
cp .env.local.example .env.local   # then fill it in (stays local, gitignored)
```

`.env.local` needs:

- `GEMINI_API_KEY` — from https://aistudio.google.com/apikey
- `GEMINI_IMAGE_MODEL` — defaults to `gemini-3-pro-image-preview` (Nano Banana Pro). Override if renamed.
- `SUPABASE_URL` — defaults to the app's `VITE_SUPABASE_URL` if present one level up.
- `SUPABASE_SERVICE_ROLE_KEY` — **service role** key (Project Settings → API). Bypasses RLS; never ship it.
- Optional `LINUS_PROFILE_ID` / `OSKAR_PROFILE_ID` — so `approve` can wire `avatar_renders` automatically.

## Run

From the repo root: `npm run gen -- <command>` — or from here: `npm run gen -- <command>`.

```bash
# a player's base avatar at a tier (idle + flex clips, packed into one sheet)
npm run gen -- avatar linus 1
npm run gen -- avatar linus 1 --frames 1          # static fallback (1 frame per clip)

# a standalone cosmetic grid item (+ full reskin sheet for 'special' slots)
npm run gen -- cosmetic snapback
npm run gen -- cosmetic soul_takeover --player linus

# bake a worn loadout onto the avatar (image-to-image, cached by loadout-hash)
npm run gen -- bake linus 3 --loadout head=snapback,torso=tank_black,waist=lever_belt

# a fire-vortex intensity stage (neutral/white; the app tints it per currency)
npm run gen -- vortex 3

# inspect / compare / promote (rollback = approve an older id)
npm run gen -- list
npm run gen -- list avatar:linus:tier1
npm run gen -- diff avatar:linus:tier1
npm run gen -- approve <imageId> --player linus
```

## The loop

1. `avatar` / `cosmetic` / `bake` / `vortex` generates frame 0, then each animation frame as
   an **image-to-image edit conditioned on frame 0** (consistency technique), removes the
   background locally, packs the frames into a sheet + atlas, and uploads everything to a new
   `v{n}` storage path. Nothing live changes yet — the image is unapproved.
2. Review the sheet in Supabase storage (or `list`).
3. `approve <imageId>` flips `is_approved` and wires the pointer the app resolves
   (`cosmetics.current_image_id`, or an `avatar_renders` row for avatar/bake sheets).
4. Don't like a result? Re-run to make a new version, or `approve` an older image id to roll
   back. Old prompts and images are **kept forever** — never overwritten.

## How it maps to the app

- Sheets are packed with **clips as rows** (idle = row 0, flex = row 1) and frames left→right,
  exactly what `src/components/SpriteAnimator.tsx` reads via `backgroundPosition`.
- The canonical frame box is **48×72** (`prompts/base-style.ts`), displayed upscaled with
  `image-rendering: pixelated`.
- The bake cache key (`lib/loadout.ts` `loadoutHash`) mirrors `src/engine/art.ts` exactly. If
  `BODY_SLOTS` order ever changes in the app, update it here too.

## Layout

```
prompts/    editable prompt source (base-style, players, avatars, cosmetics, effects, clips)
lib/        gemini, bg removal, sharp sheet packing, storage, versioning, prompt compose
commands/   one file per CLI command
index.ts    CLI dispatcher
```

## Troubleshooting

- **`Class GNotificationCenterDelegate is implemented in both …libvips…` (macOS):** harmless
  duplicate-symbol warning because `@imgly/background-removal-node` vendors its own `sharp`
  while we also depend on a newer `sharp`. It does not affect output. If it ever causes a
  crash, align the versions or run cutout and packing in separate steps.

## Open questions (spec §12)

- Confirm the exact Nano Banana Pro model id and image-to-image support on first run.
- Whether `@imgly` cutouts are crisp enough for pixel art, or switch to remove.bg in `lib/bg.ts`.
- Frame counts per clip that stay consistent enough to ship (start at `--frames 1`, add frames
  only while consistency holds).
