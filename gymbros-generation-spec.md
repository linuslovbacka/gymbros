# GYMBROS — Avatar & Cosmetic Generation Spec

The authoritative design for how Gymbros produces every avatar and cosmetic asset, versions them, and stores old prompts + old generated images. This is a **dev-run tooling pipeline**, separate from the app runtime. The app is a read-only consumer of its output (see `gymbros-spec.md` §12 art contract and §15).

Decisions include the reasoning behind them so future-you can revisit *why* without re-deriving.

---

## 1. Purpose & principles

- Generate avatar sprites and cosmetics as the app's progression art, iteratively and deliberately.
- **Fully manual, approval-gated — NO auto-generation anywhere.** Every asset is triggered by hand via the CLI, reviewed, and only goes live after an explicit `approve`. The app and backend never trigger generation automatically (no on-equip auto-bake, no on-level-up auto-gen) for launch.
- **Sequencing:** this pipeline is the **final task before launching to the friend.** The app is built and shipped against placeholder art first; the real generated sprites/cosmetics are produced and approved last, once everything else works.
- **Keep every old prompt and every old generated image forever** — nothing is overwritten. Archival is a first-class feature, not an afterthought.
- The app never calls image models. All generation happens in tooling; the app only reads finished, **approved** assets + metadata from Supabase.
- Secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) stay local; never shipped to the client.

---

## 2. Architecture decisions (and why)

- **Runs as a local Node/TS CLI** under `tools/cosmetic-gen/`, run manually.
  - *Why:* cosmetics are a fixed catalog tied to achievements, not user-generated content; generation is a deliberate iterative dev loop ("placeholders first, real sprites swapped in" — `gymbros-spec.md` §3); and API keys must stay server-side. An in-app admin UI or always-on edge function is unnecessary for a two-player app.
- **Generation via Gemini Nanobanan Pro.**
  - *Why:* matches the agreed style tooling (`gymbros-spec.md` §3/§12) and is strong at **character consistency across edits**, which the whole evolution/animation approach depends on.
- **Background removal locally via `@imgly/background-removal-node`** (remove.bg as a drop-in fallback if pixel-art cutouts look soft).
  - *Why:* no extra paid API, no per-image cost, good enough for clean studio-style generations.
- **Frame alignment + spritesheet packing via `sharp`.**
- **Hybrid storage.** Editable prompt *source* lives in the repo (git-diffable history). Immutable run snapshots (resolved prompt + params + images) live in Supabase.
  - *Why:* repo = the working copy you edit and diff; Supabase = the permanent, queryable archive + what the app reads. Two clean roles, no double source of truth (the repo holds the *template*, the DB holds the *exact thing that produced each image*).

---

## 3. v1 scope decisions (and why)

### Single combined physique tier per side
The avatar renders as **one combined sprite per side** (~12 base images: 2 sides × ~6 tiers), driven by a single derived tier. Upper/lower body stay split **only in the levelling data** (`gymbros-spec.md` §3/§5).

- *Why:* independent upper × lower visual tiers is a combinatorial explosion (2 sides × ~6 × ~6 = 72+ base images before any cosmetic or animation frame), and generated art drifts badly when asked to hold one character across that many related states. A single axis keeps it tractable and consistent.
- *Trade-off accepted:* the "skipped leg day is immediately visible" hook is deferred as a *visual* feature; it still exists in data. A v2 may revisit it via layered upper/lower compositing once consistency is solved.

### Generated animation via spritesheets
Each state gets a base pose plus short clips: an idle "breathing" **loop** and a flex/taunt **one-shot** (the tier-1 reference uses 4 + 4 = 8 frames; treat that as the stretch target and start from the static fallback, adding frames only as long as consistency holds), packed into a spritesheet with an atlas.

- **Consistency technique:** generate frame 0 first, then produce every other frame as a Nanobanan Pro **image-to-image edit conditioned on frame 0**, so the character doesn't drift between frames.
- **Graceful fallback:** `--frames 1` yields a single static sprite that the app animates with code (transform bob / scale-pop). If generated frames look inconsistent, drop to 1 frame per clip with zero pipeline changes.
- *Why this is flagged risky:* frame-consistent generated spritesheets are the hardest thing to get out of an image model. Treat the multi-frame path as "try it, review, keep if it holds," with the static fallback always available.

### Per-player avatar
Each player (Linus / Oskar) has their own base description. **Avatar state = base style + player prompt + tier + side + equipped loadout.**

---

## 4. Equip model — RPG slots (and why)

One item per slot, classic RPG style. Curated and legible instead of open-ended.

| Slot | Holds | Render strategy |
|---|---|---|
| Head | headbands, caps, hoods, Consistency Crown | loadout bake |
| Torso | tanks, tees, hoodies, compression shirts, starter outfit | loadout bake |
| Hands | wristbands, lifting straps, gloves, chalk | loadout bake |
| Waist | belts (IRON belt skins) | loadout bake |
| Legs | shorts, joggers, chicken-legs joke skin | loadout bake |
| Feet | sneakers, lifting shoes, barefoot | loadout bake |
| Aura / Effect | ember accent, animated streak aura, lightning | runtime layer |
| Companion | floating spotter-drone | runtime layer |
| Special / Soul Takeover | legendary full-avatar reskin | full replacement |

- Titles/banners and locker themes are **not** avatar slots — they decorate the name/profile.
- *Why a drone companion:* it floats beside the avatar, is geometry-independent (doesn't need to track body tier), and animates well as its own loop.

### Hybrid rendering by slot type (and why)
True free-swap "paper-doll" layering across 6 tiers × 2 sides × poses means hundreds of fitted layers, and generated pixel art won't keep seams aligned. So we split by slot type:

- **Aura + Companion → runtime layers.** Composited live by z-order; instant equip/unequip; own animation loops. No generation at equip time.
- **Body-worn slots → cached "loadout bake."** On a worn-item change, regenerate the avatar via image-to-image ("same character, swap in X"), then **cache by `player + tier + loadout-hash`**. First sighting pays one generation; cached forever after. Keeps worn gear fitted and consistent (no seam problems) and avoids pre-generating every combination.
- **Special → full replacement** sprite.
- *Net effect:* RPG slots ✓, generated-art consistency ✓, animation (body sheet + independent floating loops) ✓, bounded cost (on-demand cache) ✓.

### Fire vortex is NOT the aura slot
The §10 fire vortex is a **system** progress overlay, not an earned/equipped item:
- Driven by `intensity = currentXP / threshold` through 5 fixed stages.
- Generated **once** as neutral/white stage loops; the app **tints per currency** in-app (orange GRIT / cold blue IRON).
- Always present while progressing; reused across every avatar; never part of a loadout.
- Z-order: vortex base behind the avatar torso, upper flames in front; an equipped Aura layers independently.

---

## 5. Style guide (for prompts)

Pulled from `gymbros-spec.md` §3 — the generation prompts must encode these.

- **Reference territory:** low-res AAA-shooter sprite style — Halo, Gears of War, Dead Space. Gritty, cinematic, desaturated, grounded; no cartoon/chibi exaggeration.
- **Format (canonical, locked):** native **48×72 px per frame**, displayed at 3–4× upscale. Full body, loose weighted stance, slight 3/4 turn. **No anti-aliasing** on the silhouette; flat colour blocks, hard chunky pixel edges, visible individual pixels. NOT smooth, painterly, or high-detail illustration. This frame box is fixed across **all** tiers, sides, and cosmetics so packing/anchoring and on-avatar bakes line up.
- **Proportions:** head-to-body ratio **1:7**, realistic-heroic. NOT chibi, stumpy, or stocky.
- **Shading:** max **3 values per material** (base, shadow, highlight). Flat blocks only — no gradients, no blending. Light source upper-left.
- **Outline:** dark, only on the outer silhouette and major limb separations. Interior detail via value contrast, **not** internal black lines.
- **Face:** minimal, not a portrait — no detailed eyes/nose/mouth; short hair, flat skin, 1–2 dark pixels for brow shadow. Identical every frame.
- **Palette:** ~12 muted desaturated colours total — browns, khakis, gunmetal grays, occasional warm amber. **No neon.** Do NOT draw a colour legend/swatches in the image.
- **Sides:** mirrored — Avatar Right faces left (Linus), Avatar Left faces right (Oskar). Do **not** just horizontally flip a side (it throws the upper-left light to upper-right) — regenerate the mirror with light kept upper-left.

### Generation-specific conventions
- **The model never lays out the spritesheet.** Generate **one frame at a time** (frame 0, then each subsequent frame as an image-to-image edit conditioned on frame 0 — §6). `sheet.ts` (`sharp`) deterministically packs frames into the strip: one row, even spacing, identical size, shared baseline. Never put "EXACTLY N frames in a row / same baseline" demands in a per-frame prompt — that layout is guaranteed by code, not begged from the model.
- **Generation background ≠ in-app background.** Generate on a solid, removal-friendly background colour (e.g. magenta/green that contrasts the desaturated palette) so `@imgly` cuts cleanly; a flat grey reads on-brand but sits too close to the t-shirt/sneaker tones and risks eating them. The transparent cutout is what ships; the in-app backdrop is a separate concern.
- **Consistent canvas + feet anchor:** every cutout is centered on the fixed 48×72 frame box and anchored by the feet/bounding box so frames and tiers don't jitter when swapped.
- **Standalone cosmetic items:** the same style, item isolated and centered for the grid icon — separate from the on-avatar bake.
- **Vortex sprites:** neutral/white, currency-agnostic (tinted at runtime).
- **Late-stage escalation:** the grounded early style is deliberate so the "absolutely unhinged" late tiers land harder.

### Tier 1 reference (the scrawny beginner) — decomposed across prompt layers
The detailed reference prompt splits across the §6 layers so style + identity + choreography stay reusable while only the physique/clothing changes per tier:

- **base-style.ts (constant):** the Reference / Format / Proportions / Shading / Outline / Palette rules above.
- **players.ts (per-player identity):** young man, late teens / early twenties, **youthful** soft features (not rugged/older); short mid-brown hair `#3A2510`, flat tan skin; simple head shape, same face every frame.
- **avatars.ts → tier 1 (physique + starter clothing):** scrawny, underdeveloped — narrow shoulders barely wider than hips, thin straight arms with no muscle, flat narrow chest, mild forward slouch (a weak beginner who's never trained). Oversized off-white tee `#D8D0B8` hanging off the thin frame; baggy olive-grey joggers `#5A6258`; scuffed low brown sneakers `#282420`.
- **frames.ts (choreography):** *idle clip* (loop) = neutral → chest 1px up / shoulders lift → back toward neutral → head dips 1px. *flex/taunt clip* (one-shot) = raise right arm into a flex → **bicep completely flat, no bulge**, looking at it → other hand points at the unimpressive arm → both arms drop, shoulders slump, head lowers (defeated).
- **Tier-dependent payoff (IMPORTANT):** the flat-bicep/defeated-slump punchline is **tier-1 only**. The flex choreography must be parameterized per tier so higher tiers pay off with a real bulge and pride. The animation itself carries the progression joke.

---

## 6. Prompt structure & composition

Editable source lives in the repo; the CLI resolves the final prompt and **snapshots the exact string** used for every image.

- `tools/cosmetic-gen/prompts/base-style.ts` — the shared style block (§5).
- `tools/cosmetic-gen/prompts/players.ts` — per-player base description (Linus / Oskar).
- `tools/cosmetic-gen/prompts/avatars.ts` — per-tier physique + clothing fragments (tier 1 = the scrawny beginner in §5; expandable to ~6 tiers).
- `tools/cosmetic-gen/prompts/cosmetics.ts` — per-cosmetic fragment + `slot` / category / rarity, seeded from `gymbros-achievements.md` rewards (crown→head, belt→waist, aura→aura, drone→companion, …).
- `tools/cosmetic-gen/prompts/effects.ts` — the 5 fire-vortex stage prompts.
- `tools/cosmetic-gen/prompts/clips.ts` (or `frames.ts` data) — per-clip frame choreography (idle loop, flex/taunt one-shot), with **per-tier** variants for the flex payoff.

**Composition rules:**
- Avatar base (frame 0) = `base-style + players[player] + avatars[tier] + side`, single frame, no strip/layout instructions.
- Animation frames (2..n) = **image-to-image** on frame 0 + the clip's per-frame motion description ("same character, same everything, now …"). `sheet.ts` packs them; the prompt never describes the strip.
- Standalone item = `base-style + cosmetics[slug].fragment + "single item, isolated, centered"`.
- Loadout bake = **image-to-image** on the current avatar image + appended worn-slot fragments ("same character, wearing …").

---

## 7. Versioning & archival — how old prompts and old images are stored, and where

This is the core requirement: **every prompt and every generated image is kept, versioned, and retrievable; nothing is overwritten.**

### Where the source lives (repo, git history)
- The *editable* prompt fragments live in `tools/cosmetic-gen/prompts/*.ts`, version-controlled in git. This gives a human-readable, diffable history of how the *templates* evolved over time.

### Where the permanent archive lives (Supabase)
Two layers, both append-only:

**a) Prompt history → `prompt_versions` table.** Every generation run inserts a new row capturing the **exact resolved prompt string** that produced the image, plus params (model, seed, size, side, loadout) and the parent it was conditioned on. Rows are never updated except to flip the `is_current` pointer.

- An edit to a prompt = a new row with `version_no = previous + 1`. The old row stays forever.
- `subject_key` groups all versions of one thing (e.g. all versions of `avatar:linus:tier3`).

**b) Image history → `generated_images` table + `avatars` Storage bucket.** Every generated image (raw, cutout, each frame, packed spritesheet) is uploaded to a **versioned Storage path** and recorded as a row linked to its `prompt_version`. Old images are never deleted or overwritten — a new generation writes to a new `v{n}` path.

- `is_approved` marks the chosen image for a subject; flipping it never deletes the prior one.

### Storage layout (existing public `avatars` bucket)
Reuse the already-provisioned public `avatars` bucket (`SUPABASE_SETUP.md`), organized by prefix and **versioned by `v{n}`** so history accumulates:

```
avatars/
  avatars/{player}/tier{n}/v{k}/{clip}.sheet.png   + .sheet.json
  cosmetics/{slug}/v{k}/standalone.png
  layers/{slot}/{slug}/v{k}/{clip}.sheet.png        (aura, companion)
  bakes/{player}/tier{n}/{loadout_hash}/v{k}/{clip}.sheet.png + .sheet.json
  effects/vortex/stage{1..5}/v{k}/loop.sheet.png
```

- `v{k}` increments on every regeneration; old folders remain as the image archive.
- The app always resolves the **current/approved** version via the DB pointer, so accumulating old versions never affects what users see.

### Retrieval / rollback
- `list <subject>` shows all versions; `diff <subject>` compares prompt text across versions; `approve <imageId>` promotes any past version back to current (rollback = re-approve an old row — the asset is still there).

### Atlas (`.sheet.json`) schema — the shared pipeline↔app contract
One sheet **per clip**, single horizontal row (matches the storage layout: `{clip}.sheet.png` + `{clip}.sheet.json`). This is the exact shape the pipeline writes and the app's `SpriteAnimator` reads; it is also mirrored into `generated_images.atlas` (jsonb). Lock it now so neither side reworks at Phase 8.

```jsonc
{
  "clip": "idle",          // "idle" | "flex" (matches generated_images.clip)
  "frameWidth": 48,         // native px — the locked 48×72 box
  "frameHeight": 72,
  "frameCount": 4,
  "columns": 4,             // == frameCount (single row)
  "rows": 1,                // always 1 in v1 (one clip per sheet)
  "fps": 8,                 // playback rate
  "loop": true,             // idle loops; flex/taunt is a one-shot (false)
  "anchor": { "x": 24, "y": 72 }, // feet anchor (bottom-centre), for consistent placement across tiers/cosmetics
  "durations": [125, 125, 125, 125] // optional per-frame ms; omit ⇒ uniform from fps
}
```

App-side reconciliation this resolves: `SpriteAnimator.AtlasMeta` becomes **single-clip** (drop the multi-clip `clips[clip].row` model; `rows` is always 1, `columns == frameCount`). Crisp upscale = `image-rendering: pixelated` plus a `background-size` scaled from `frameWidth/frameHeight` to the container — both app-side, fine to wire when real sheets land.

---

## 8. Data model (additive to the existing schema)

The project already has `profiles` (tiers, **equipped gear**, streak/rust, program stage) and a public `avatars` bucket. The pipeline **reuses** those and adds bookkeeping tables.

- **`profiles`** (existing — extend): add `avatar_base_prompt` (per-player description). Tier (single derived render tier) and equipped loadout already live here; the pipeline reads them. Side is derived from the pair.
- **`cosmetics`** (new, app-facing catalog) — `id`, `slug`, `name`, `slot`, `category`, `rarity`, `achievement_id` (nullable), `description`, `prompt_fragment`, `current_image_id`.
- **`prompt_versions`** (new, history) — `id`, `kind` ('avatar_tier' | 'cosmetic' | 'loadout_bake' | 'system_effect'), `subject_key`, `version_no`, `prompt_text`, `parent_version_id`, `params` jsonb, `is_current`, `created_at`.
- **`generated_images`** (new, history) — `id`, `prompt_version_id`, `variant` ('standalone' | 'layer' | 'bake' | 'special' | 'effect' | 'raw' | 'cutout' | 'frame' | 'spritesheet'), `clip` ('idle' | 'flex' | null), `frame_index`, `storage_path`, `width`, `height`, `atlas` jsonb (the per-clip `.sheet.json` schema in §7), `is_approved`, `created_at`.
- **`avatar_renders`** (new, bake cache) — `id`, `profile_id`, `tier`, `loadout_hash`, `loadout` jsonb, `spritesheet_image_id`, `created_at`. Unique on (`profile_id`, `tier`, `loadout_hash`).

RLS: history/catalog tables are readable by authenticated users; writes happen only via the service-role key in the CLI (and, later, an edge function).

---

## 9. CLI commands

Run via `npm run gen` (`tsx tools/cosmetic-gen`).

- `avatar <player> <tier> [--clip idle,flex --frames N]` — generate/version a player's base avatar at a tier, then clip frames + sheet.
- `cosmetic <slug>` — generate the standalone grid item (and, for aura/companion slots, the runtime layer sheet).
- `bake <player> <tier> --loadout head=...,torso=...` — image-to-image bake of the worn loadout onto the current avatar, cached by loadout-hash.
- `vortex <stage 1..5>` — generate/version a fire-vortex stage loop (currency-tinted in-app).
- `sheet <subject> [--clip ...]` — (re)pack existing approved frames into a spritesheet + atlas without regenerating.
- `list [subject]` / `diff <subject>` / `approve <imageId>` — inspect, compare, and promote/rollback versions.

---

## 10. Config / secrets

- `.env.local` (gitignored): `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus the existing `VITE_SUPABASE_URL`.
- New deps: `@google/genai`, `@imgly/background-removal-node`, `sharp`, `tsx`, `dotenv` (Supabase JS already present).
- `tools/cosmetic-gen/README.md` documents setup and the run loop.

---

## 11. Where bakes run (now vs later)

- **Launch (manual only):** bakes are produced **by hand via the CLI** for the loadouts players actually earn — a small, finite set for two players — and each is `approve`d before it goes live. There is **no automatic generation** at runtime.
- **Post-launch (optional, explicitly deferred):** because `avatar_renders` is the shared source of truth, a Supabase Edge Function *could* later run the same `bake.ts` on-equip and populate the same cache — no rework, just a different trigger. This is **off for launch** and only considered after the friend is playing and the manual flow is proven.

---

## 12. Open questions

- Exact Nanobanan Pro model id and confirmation of image-to-image (reference) support on first run.
- Whether `@imgly` cutouts are crisp enough for pixel art, or we switch to remove.bg.
- Whether to add `avatar_base_prompt` directly to `profiles` or keep a small dedicated table.
- Number of tiers to commit to for v1 (spec says 5–10; pipeline assumes ~6).
- Frame counts per clip that stay consistent enough to ship.
