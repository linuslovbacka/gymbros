# GYMBROS — Design Spec

A consolidated summary of three design discussions covering the full concept, visual style, and gamification layer. Decisions include the reasoning behind them so future-you can revisit *why* without re-deriving.

---

## 1. Concept

A gamified competitive training app built for two players — Linus and his friend Oskar. Both are gamers, so the app borrows the visual language of fighting games and the reward language of RPGs. The whole product is essentially a long-running rivalry made visible: every workout makes your avatar tougher and your stack of unlocks deeper.

**Tone:** serious-enough to respect the training, unhinged-enough to be a joke between mates. Grounded gym-bro humour, never cutesy.

**Stack:** React PWA via Vite + Supabase (auth, realtime sync, cloud storage). Same architecture as Pestbok and Gröda — proven and reusable.

---

## 2. The three screens

The app is intentionally small. Three screens, one job each.

### Start screen
- VS layout — Linus's pixel avatar on the left, Oskar's on the right, facing each other like a fighting-game splash
- Days-trained tracker in the background
- An escalating header sits behind the avatars (driven by the Pro Mode button — see §7)
- A single TRAIN button at the bottom

### Workout screen
- First step: choose **Home** or **Gym**
- For Home, a second choice: **Full workout** or **Split** (one direction per day — see §5)
- Loads the current workout based on where the user is in the progression (W1 / W2 / W3)
- Exercises shown one at a time with an embedded video — no separate library page
- Each exercise displays its prescribed sets × reps/time; actual reps are logged per set

### Done screen
- Celebration moment — good place to trigger an avatar flex animation
- Two questions, logged to Supabase:
  - "How did it feel?" → *easy / good / dead*
  - "Did you progress?" → *more reps / more weight / felt easier*
- These answers feed the level-up logic without making the user think about it

**Reasoning for the three-screen minimum:** every additional screen is a friction tax on starting a workout. The app's job is to remove every decision between "I want to train" and "I'm doing my first exercise." Library pages, exercise pickers, settings menus — all kept out of the main flow on purpose.

---

## 3. Avatar system

The avatar is the core feedback loop of the entire app — strength in the real world is reflected as visible muscle on screen. Upper and lower body are tracked separately *in data*, so skipped leg days still register in progression — but see the v1 rendering note below for how that maps to the sprite.

### Progression
- **5–10 visual stages** from scrawny → unhinged
- Upper- and lower-body progression is tracked independently in the levelling data (§5)
- Movement via spritesheet — idle animation (breathing), plus a flex/taunt for the done screen
- Placeholder art at first; real sprites swapped in once the references and prompts are dialled in

> **v1 rendering decision (IMPORTANT for implementation):** Do **NOT** build separate upper-body and lower-body sprites/spritesheets, and do **NOT** generate or composite the avatar from independent upper/lower halves. For v1 the avatar is rendered as a **single combined sprite per side**, driven by **one derived physique tier** (computed from the separately-tracked upper/lower data — e.g. the lower of the two). Upper/lower stays split in the *levelling data* only. A future v2 may revisit a visible upper/lower split via layered compositing — but no code, art, or spritesheet structure for a split avatar should be created in v1.

### Visual style (Discussion 2)

The agreed style draws from game-accurate fan art — Dead Space, Mass Effect, Gears of War territory. Grounded, slightly gritty, no cartoon exaggeration.

**Format**
- Pixel art at roughly 32×64 or 48×96 character resolution, displayed at 3–4× upscale
- Full body, front-facing idle stance with a slight 3/4 lean
- No anti-aliasing — hard pixel edges throughout

**Shading**
- 3–5 tones per colour: dark outline pixel, shadow tone, midtone, highlight, occasional specular dot
- Visible texture variation between materials (fabric vs. metal vs. leather)

**Silhouette**
- Each character reads as a clean, distinct silhouette
- Confident idle stance, weight on both feet, slight personality in posture

**Palette**
- Desaturated and earthy: browns, khakis, gunmetal grays, occasional warm amber
- No neon. Grounded and gritty.

**Background**
- Flat neutral gray with a faint ground-shadow line. No environment.

### Level 1 reference (already prompted for Nanobanan Pro)
Skinny young man, plain t-shirt, joggers, beat-up sneakers, slight slouch. Two mirrored versions — Avatar Right facing left (Linus's side), Avatar Left facing right (Oskar's side).

**Reasoning for the style choice:** game-art realism makes the absurdity of later stages land harder. If the avatars looked cartoonish from the start, the late-game escalation ("absolutely unhinged" stage) loses its punch. Starting grounded earns the chaos later.

---

## 4. Workout framework

A push/pull system organised by direction of force, with parallel Home and Gym tracks so the same training framework works regardless of location.

### Home framework

| Direction | Pull                          | Push                       |
| --------- | ----------------------------- | -------------------------- |
| Up        | Pull-up (rings)               | Pike push-up → HSPU        |
| Forward   | Inverted row (rings)          | Push-up (rings/parallettes)|
| Down      | Front lever progression       | Dip (rings/parallettes)    |

### Gym framework

| Direction | Pull          | Push           |
| --------- | ------------- | -------------- |
| Up        | Lat pulldown  | Shoulder press |
| Forward   | Cable row     | Bench press    |
| Down      | DB high pull  | Weighted dip   |

### Supplementary
- **Skill work:** Handstand progression + Front lever progression
- **Core:** Hollow body hold + L-sit / tuck ups on parallettes
- **Legs (both modes):** Pistol squat + Nordic curl (+ Deadlift optional at gym)
- **Decompression:** Hanging from rings

### Home split mode
Instead of one ~20-minute full session, the day can be split into a single direction:
- Day 1: Up (pull-up + pike push-up)
- Day 2: Forward (inverted row + push-up)
- Day 3: Down (front lever + dip)

The app knows which day is next based on the last logged session.

### W1 → W2 → W3 beginner progression
- **W1:** Band pull-up 3×3–6, Eccentric dip 3×3–6, Inverted row 3×10–15, Push-up 3×8–15, Hollow body hold 3×30s, Hanging 3×30–60s
- **W2:** Eccentric pull-up 3×3–6, Pike push-up 3×5–10, Inverted row 3×10–15, Push-up 3×8–15, Hollow body hold 3×30s, Hanging 3×30–60s
- **W3:** Band pull-up 3×6–12, Band dip 3×5–10, Inverted row 3×10–15, Push-up 3×8–15, Hollow body hold 3×30s, Hanging 3×30–60s

### User stats (Linus)
67 kg, 110 g protein/day target, 7 h sleep goal, 10k steps/day at standing desk. Equipment: rings, parallettes, weighted vest.

---

## 5. Levelling logic

Level-ups are based on *progression evidence*, not session count. Calisthenics and weighted lifting follow the same underlying logic but climb on different axes — and the app has to understand both.

### Two axes of progression

- **Weight axis (gym track)** — same movement, more load. The "ladder rung" is a weight number. Progression = adding kg.
- **Variation axis (calisthenics track)** — same body, harder leverage. The "ladder rung" is a named variation (band pull-up → eccentric → full → weighted → archer → one-arm). Progression = climbing the ladder.

Every exercise in the app has either a weight-progression scheme or a pre-defined variation ladder stored as data (see §6).

### The level-up trigger

The same trigger logic works for both axes:

1. User hits the **top of the prescribed rep range on all working sets** for 2–3 consecutive sessions, *and*
2. Their post-workout "did you progress?" answers agree it's getting easier

When both conditions are met, the next session prompts: **"You've maxed [current rung]. Ready to try [next rung]?"** with a *yes / not yet* choice. "Not yet" keeps the user on the current rung for another cycle. Manual override is always available — the user can climb (or step back down) whenever they want.

### Self-report as a second channel

The Done screen "Did you progress?" question gets the right set of options per track:

- **Calisthenics:** more reps / cleaner form / moved to harder variation / felt easier
- **Gym:** more reps / more weight / felt easier

A "moved to harder variation" or "more weight" answer overrides the auto-detect immediately — the app trusts the user's call.

**Reasoning:** session-count levelling rewards just showing up but ignores whether the work is actually getting harder. Tying progression to the rep ceiling + the self-report keeps the avatar's growth honest — when the character gets bigger, the user genuinely earned it. Inflated progress would kill the feedback loop.

### How IRON earns differ by track

IRON (the absolute-strength currency — see §8) needs to be meaningful for someone who never touches a barbell. The mapping:

- **Gym track:** `IRON per set = weight (kg) × reps`. Load IS the multiplier.
- **Calisthenics track:** `IRON per set = reps × variation_multiplier`. The multiplier is defined per rung in the ladder (see §6).

So Linus on archer pull-ups and Oskar on band pull-ups, both doing 8 reps, earn proportional IRON based on the actual difficulty of what they did — Linus around 4.5× Oskar's haul. Honest accounting regardless of training style.

### The avatar growth signal

Levelling the avatar's upper- and lower-body tiers is tied to **climbing the ladder on a major movement**, not to weight added or rep count alone. Whether that climb happens via a +5 kg jump on bench or a switch from band pull-up to full pull-up, the avatar tier advances the same way. This keeps the avatar progression equally satisfying for both modes.

These upper/lower tiers live in the levelling **data**. For v1 the *rendered* sprite uses a single derived physique tier computed from them (see §3 v1 rendering decision) — the split is not drawn as separate body halves.

---

## 6. Exercise ladders

The data underneath the levelling system. Each ladder is an ordered list of *(rung name, prescription, IRON multiplier)*. The app loads the relevant ladder per exercise per user and steps through it based on the trigger logic in §5.

Numbers below are first-pass — tune during build. The multipliers are calibrated so a single bodyweight pull-up = 2.0 (the reference point), and everything else scales relative to that.

### Pull-up — *Home: Up Pull*

1. Dead hang — 3 × 30 s — ×0.5
2. Scapular pull-up — 3 × 8–12 — ×0.7
3. Band pull-up (thick) — 3 × 6–10 — ×1.0
4. Band pull-up (medium) — 3 × 8–12 — ×1.2
5. Band pull-up (light) — 3 × 8–12 — ×1.4
6. Eccentric pull-up (5 s negatives) — 3 × 3–6 — ×1.6
7. Negative + jump — 3 × 5–8 — ×1.8
8. Full pull-up — 3 × 3–8 — ×2.0
9. Full pull-up — 3 × 8–15 — ×2.3
10. Weighted +5 kg — 3 × 5–10 — ×2.8
11. Weighted +10 kg — 3 × 5–10 — ×3.5
12. Weighted +20 kg — 3 × 3–8 — ×4.5
13. Archer pull-up — 3 × 3–6 each — ×5.0
14. Typewriter pull-up — 3 × 3–6 — ×5.5
15. Assisted one-arm — 3 × 2–4 each — ×6.5
16. One-arm pull-up — 3 × 1–3 each — ×8.0

### Pike push-up → HSPU — *Home: Up Push*

1. Pike hold — 3 × 20 s — ×0.8
2. Pike push-up (feet on floor) — 3 × 5–10 — ×1.2
3. Elevated pike push-up (feet on box) — 3 × 5–10 — ×1.5
4. Wall handstand hold — 3 × 30 s — ×1.7
5. Wall HSPU (partial ROM) — 3 × 3–6 — ×2.5
6. Wall HSPU (full ROM) — 3 × 3–8 — ×3.0
7. Wall HSPU (deficit, parallettes) — 3 × 3–6 — ×3.5
8. Freestanding HSPU progression — 3 × 1–3 — ×5.0+

### Inverted row — *Home: Forward Pull*

1. Incline inverted row (high) — 3 × 8–15 — ×0.6
2. Inverted row (parallel to floor) — 3 × 8–15 — ×1.0
3. Inverted row — 3 × 15–20 — ×1.2
4. Feet-elevated inverted row — 3 × 8–15 — ×1.5
5. Archer inverted row — 3 × 5–10 each — ×2.0
6. One-arm inverted row — 3 × 3–8 each — ×3.0
7. Front lever row progression — 3 × 3–6 — ×4.0+

### Push-up — *Home: Forward Push*

1. Incline push-up (high) — 3 × 8–15 — ×0.7
2. Incline push-up (low) — 3 × 8–15 — ×0.9
3. Push-up — 3 × 8–15 — ×1.0
4. Push-up — 3 × 15–25 — ×1.2
5. Rings push-up — 3 × 8–15 — ×1.5
6. Diamond push-up — 3 × 8–15 — ×1.5
7. Archer push-up — 3 × 5–10 each — ×2.0
8. Pseudo planche push-up — 3 × 5–10 — ×2.5
9. One-arm push-up — 3 × 3–8 each — ×3.5
10. Planche push-up progression — 3 × 1–3 — ×4.5+

### Front lever — *Home: Down Pull*

Timed holds — "reps" field captures total accumulated seconds across the working sets.

1. Tuck front lever — 3 × 10 s — ×1.5
2. Tuck front lever — 3 × 20 s — ×1.8
3. Advanced tuck (back flat) — 3 × 10 s — ×2.5
4. Advanced tuck — 3 × 20 s — ×3.0
5. Single-leg front lever — 3 × 10 s each — ×4.0
6. Straddle front lever — 3 × 5 s — ×5.0
7. Straddle front lever — 3 × 15 s — ×6.0
8. Full front lever — 3 × 5 s — ×7.5
9. Full front lever — 3 × 15 s — ×9.0
10. Front lever pull-up — 3 × 1–3 — ×10.0+

### Dip — *Home: Down Push*

1. Bench dip — 3 × 8–15 — ×0.6
2. Negative dip (3 s lower) — 3 × 3–6 — ×0.9
3. Band-assisted dip — 3 × 5–10 — ×1.2
4. Parallel bar dip — 3 × 5–10 — ×1.5
5. Parallel bar dip — 3 × 10–20 — ×1.8
6. Ring dip (turned in) — 3 × 5–10 — ×2.2
7. Ring dip (RTO) — 3 × 5–10 — ×2.8
8. Weighted +5 kg — 3 × 5–10 — ×2.5
9. Weighted +10 kg — 3 × 5–10 — ×3.2
10. Weighted +20 kg — 3 × 5–8 — ×4.2
11. Bulgarian dip — 3 × 3–6 — ×4.5
12. Korean dip — 3 × 3–6 — ×5.0

### Handstand progression — *Skill*

1. Wall plank (face away) — 3 × 30 s — ×1.0
2. Wall handstand (back to wall) — 3 × 20–30 s — ×1.5
3. Wall handstand (chest to wall) — 3 × 30–60 s — ×2.0
4. Wall HS shoulder taps — 3 × 6–10 each — ×2.5
5. Freestanding kick-up attempts — 5 × 30 s — ×3.0
6. Freestanding handstand — 3 × 5–10 s — ×4.0
7. Freestanding handstand — 3 × 20–30 s — ×5.5
8. Press handstand progression — 3 × 1–3 — ×7.0+

### L-sit / V-sit — *Core*

1. Tuck L-sit on floor — 3 × 10 s — ×0.8
2. Tuck L-sit on parallettes — 3 × 15–20 s — ×1.0
3. One-leg extended L-sit — 3 × 10 s each — ×1.5
4. L-sit (legs straight) — 3 × 10 s — ×2.0
5. L-sit — 3 × 20–30 s — ×2.5
6. V-sit progression — 3 × 5–10 s — ×3.5
7. Manna progression — 3 × 3–10 s — ×5.0+

### Hollow body hold — *Core*

1. Tuck hollow hold — 3 × 20 s — ×0.5
2. One-leg hollow hold — 3 × 20 s each — ×0.7
3. Hollow hold (knees bent) — 3 × 30 s — ×1.0
4. Full hollow hold — 3 × 30 s — ×1.5
5. Full hollow hold — 3 × 60 s — ×2.0
6. Hollow rocks — 3 × 20 — ×2.0
7. Weighted hollow hold — 3 × 30 s — ×2.5+

### Pistol squat — *Legs*

1. Assisted pistol (TRX/rings) — 3 × 5–8 each — ×1.0
2. Box pistol (high box) — 3 × 5–8 each — ×1.5
3. Box pistol (low box) — 3 × 5–8 each — ×2.0
4. Counterweighted pistol — 3 × 3–6 each — ×2.5
5. Full pistol squat — 3 × 3–8 each — ×3.0
6. Pistol — 3 × 8–12 each — ×3.5
7. Weighted pistol +5 kg — 3 × 5 each — ×4.0
8. Weighted pistol +10 kg — 3 × 3–5 each — ×4.5
9. Shrimp squat progression — 3 × 3–6 each — ×5.0+

### Nordic curl — *Legs*

1. Assisted Nordic (heavy band) — 3 × 3–6 — ×1.5
2. Assisted Nordic (medium band) — 3 × 3–6 — ×2.0
3. Negative-only Nordic (3 s) — 3 × 3–5 — ×2.5
4. Negative Nordic (5 s) — 3 × 3–5 — ×3.0
5. Negative + small push-back — 3 × 3–5 — ×3.5
6. Full Nordic curl — 3 × 3–6 — ×4.5
7. Weighted Nordic — 3 × 3–6 — ×5.5+

### Gym lifts — *Lat pulldown, Shoulder press, Cable row, Bench press, DB high pull, Weighted dip*

No variation ladder — pure weight progression. The "ladder" is just weight increments:

- **Rep range:** 3 × 5–10 (compound) or 3 × 8–12 (isolation)
- **Increment when ceiling hit:** +5 kg (compound) or +2.5 kg (smaller lifts)
- **IRON per set:** `weight × reps` (no multiplier — the load is the multiplier)

Level-up logic is identical: hit the top of the range on all working sets for 2–3 consecutive sessions → next session prompts the weight increase.

---

## 7. Pro Mode (the joke feature)

A button on the start screen, sitting behind/around the avatars. It exists purely for delight.

- Press once → header changes to "PRO BROS"
- Press again → "ULTRA BROS"
- Keeps escalating, infinitely, with increasingly unhinged labels
- **Once pressed, it can never be unpressed.** Permanent escalation.

### Agreed label sequence (hybrid — starts serious, gets unhinged)
1. GYM BROS *(default)*
2. PRO BROS
3. ULTRA BROS
4. BEAST BROS
5. MONSTER BROS
6. UNCHAINED BROS *(capitalisation/colour shift here signals chaos)*
7. TRANSCENDENT BROS
8. GODS FEAR YOU
9. REALITY BENDING
10. THE GYM IS INSIDE YOU NOW
11. *…continues forever, increasingly unhinged*

**Reasoning for "hybrid" over the alternatives:** the absurdity has to be *earned*. Starting at "GODLIKE" on press 1 has nowhere to escalate to. The hybrid sequence stays grounded for the first few presses so the moment it tips into chaos (around press 6) feels like a real reward for hammering the button.

**Reasoning for non-reversibility:** if the button can be unpressed, it stops being a commitment and becomes a setting. The fact that you've permanently turned yourself into "REALITY BENDING BROS" with no way back is most of the joke.

---

## 8. Gamification layer (Discussion 3)

The core design problem: Linus is currently stronger than Oskar. If the entire reward economy is built on raw numbers, Oskar gets out-competed every session and quits. Solution: split the economy into two parallel lanes so each player has a place to win.

### Two currencies

- **IRON** — earned from *absolute* output: total volume moved, max lifts, heavy milestones. The stronger lifter dominates this lane.
- **GRIT** — earned from *behaviour*: showing up, streaks, PRs, comebacks, variety. Anyone can win it; beginners earn it fastest because PRs come constantly when you start.

Cosmetics are bought primarily with **GRIT**. The flashiest hardcore-only items are gated behind **IRON**. Most achievements pay out a fixed chunk of one currency plus a specific unlock.

**Reasoning:** decoupling reward from raw strength is the whole game. The two-currency split means Linus and Oskar are essentially competing in two different games at once — and Oskar (the newer lifter) gets buried in GRIT early on, which is exactly when habits are most fragile and most need the dopamine.

### Achievement categories

**Consistency (GRIT)** — streaks, "never skips," monthly attendance milestones
**Personal Records (GRIT)** — every PR pays out; volume of PRs rewards the beginner
**Strength Milestones (IRON)** — bodyweight bench, 100kg club, total-volume thresholds
**Variety (GRIT)** — hitting all muscle groups, trying new movements, leg-day specials
**Resilience / Comeback (GRIT)** — returning after a gap, de-rusting gear, "no quit"
**Bro / Social (shared)** — same-day sessions, combined volume goals, simultaneous streaks

**Reasoning for the Resilience category:** quitting is the #1 risk. Rewarding return separately from streaks means a missed week doesn't become a missed month — it becomes the start of a "Comeback Kid" badge.

### Cosmetics

- Fits (tops, shorts, shoes), accessories (belts, chalk, straps, wristbands), effects (auras, glows, sweat/ember accents), titles/banners, emotes/poses, locker themes
- Joke unlocks (chicken legs, novelty mankini) priced cheap on purpose — comedy is part of the reward
- Rarity tiers: common → rare → epic → legendary, colour-coded throughout

### Equip model — RPG slots (IMPORTANT for implementation)
Cosmetics that appear *on the avatar* use a classic RPG slot system, one item per slot. The equip screen and avatar render must be built around these slots:

- **Head, Torso, Hands, Waist, Legs, Feet** — body-worn gear.
- **Aura / Effect** — earned, equippable decorative effect (ember accent, animated streak aura). Swappable; rusts with the equipped set. (Distinct from the system fire vortex in §10.)
- **Companion** — a floating spotter-drone (own animation loop, sits beside the avatar).
- **Special / Soul Takeover** — legendary full-avatar reskin that *replaces* the render and disables the normal slots.

Titles/banners and locker themes are not avatar slots — they decorate the name/profile, not the body.

### How equipped cosmetics render (hybrid — do NOT regenerate the whole avatar per equip naively)
- **Aura + Companion → runtime layers.** Composited live over the avatar by z-order; instant equip/unequip; play their own animation loops. No image generation at equip time.
- **Body-worn slots → cached "loadout bake."** The fitted avatar-wearing-loadout sprite is produced by the generation pipeline (below) and **cached by `player + tier + loadout-hash`** in the `avatar_renders` table. The app looks up the current loadout's bake; if absent, it falls back to the base-tier avatar and the bake is produced out-of-band. The app does **not** call image models directly.
- **Special → full replacement** sprite, resolved like a tier avatar.
- Equipped set + rust state (§9) is per-player data the app owns; the *art* it points at comes from the pipeline's Storage/tables.

### Detail pages with descriptions
Clicking the avatar opens the achievements/cosmetics grid. Clicking any item opens a detail page with a short, funny description in honest gym-bro voice. Examples agreed:
- *Consistency Crown* — "You showed up. Even we're shocked."
- *Comeback Kid* — "You quit once. We're impressed you came back."
- *Chicken Legs* — "Leg day? We're still not entirely convinced it happened."
- *Bodyweight Bench* — "You're stronger than your own weight. (That's literally the whole point.)"
- *Hype Man* — "Your friend PRd because you pushed him. Don't tell him that."

**Reasoning for the detail-page humour:** the joke needs space to land. Putting funny copy on the grid cards clutters the visual scan; putting it on a dedicated detail page means the moment the user clicks an item, the app gets a chance to make them smile. The cosmetics carry the visual reward, the descriptions carry the emotional one.

---

## 9. Streak & loss system — rust, not strip

Streaks matter, but the way they're enforced is the difference between an app you love and an app you delete.

### The system
- **3 rest tokens per month**, refilling on the 1st
- A missed day auto-spends a token; the streak survives
- Run out of tokens + miss a day → **equipped gear goes "rusty"** (greyed out, dull, cracked — but kept)
- Come back and hit ~2–3 sessions → gear shines again, streak resumes from where it rusted (not zero)
- Rust only affects the **equipped set** — never the whole locker

### Why we explicitly DON'T strip cosmetics or delete progress

This was a deliberate decision against the more aggressive "lose your gear if you miss" mechanic. Reasoning:

1. **Loss aversion is real but mis-targeted by punishment of absence.** Losing something hurts ~2× as much as gaining it feels good, which seems to justify harsh penalties. But the moment a user misses a workout is usually the moment life got hard — they're sick, slammed at work, dealing with kids, low energy. Coming back to a stripped avatar adds *shame* to that, and shame is what makes people ghost the app entirely.

2. **The weaker friend eats the punishment first and hardest.** Oskar (the newer lifter) has the more fragile habit. The whole point of the gamification layer is to keep him hooked through the fragile early phase. Loss-based mechanics drive *exactly the player you're trying to protect* away.

3. **Duolingo learned this the expensive way.** Their original brutal streak-loss model drove measurable churn until they introduced the "streak freeze." That precedent is too clear to ignore.

4. **Lapses still need to sting — but recoverably.** The rust system makes the lapse visible and unpleasant without being terminal. The user can see their gear is dull, they know what they have to do to bring it back, and the path back is short (a few sessions). Sting + clear recovery path = motivation. Sting + no recovery path = exit.

5. **You never *take* what someone earned.** Earned cosmetics are a permanent record of past effort. Stripping them rewrites the user's history and breaks trust with the app. Rusting them visually marks the *present* state without erasing the *past* achievement.

**The principle: make lapses STING but always RECOVERABLE.**

---

## 10. Visual progression cue — the fire vortex

A continuous visual feedback layer showing how close the avatar is to the next level. Sits on the floor around the avatar's feet, escalating in five stages as progress accumulates.

### The five stages
1. **0–20%** — faint embers drifting up from the floor, barely there
2. **20–40%** — a low swirl of sparks circling the feet, slow rotation
3. **40–60%** — a visible flame ring on the floor, picking up speed
4. **60–80%** — the vortex lifts into a spinning column around the legs
5. **80–99%** — full fire tornado, tallest and fastest, almost engulfing the avatar — then the level-up flourish triggers and it bursts/collapses into the new tier

### Implementation principles
- **Driven by a single 0–1 float** — `intensity = currentXP / threshold`, mapped to a stage. Continuous animation as the user logs sessions, not just on level-up.
- **Separate overlay sprite, not baked into the avatar art** — keeps the effect 100% reusable across any avatar at any level. The avatar art doesn't need to know the effect exists.
- **Tint by currency** — same sprite/shader, recoloured. Orange flame for GRIT, cold blue for IRON. Two effects from one asset.
- **Draw order matters** — render the vortex base *behind* the avatar's torso and the upper flames *in front*, so the avatar sits *inside* the spinning column rather than on top of it. Avatar sandwiched between two layers.
- **For web/PWA, prefer a sprite sheet over a real particle system** — 5 looping frames per stage is plenty and cheap on mobile.
- **Final-stage flourish** — at 95–99%, a subtle screen shake or a half-second pause before the burst. Anticipation makes the level-up *land*.

**Reasoning for "always-on, progress-driven":** anticipation is the actual reward, not the level-up itself. If the effect only appears at the moment of level-up, you've collapsed the most valuable feedback loop in the whole app — the slow build, the visible getting-closer — into a single instant. Driving it continuously means every single session moves the visible needle, which is what keeps people logging the next one.

---

## 11. Multiplayer / how Oskar fits in

- Linus shares a link with Oskar; Oskar makes his own account
- Both accounts are connected; both see each other's avatar, progression, and stats on the VS screen
- Realtime sync via Supabase — same architecture as Pestbok
- Competition is purely *visual* — no leaderboard, no score, no ranking
- The Bro/Social achievement category adds collaborative goals so it's not purely comparative

**Reasoning for visual-only competition:** explicit leaderboards turn a friendship into a scoreboard. Visual competition (your avatar next to his) is enough to motivate without making the gap into a number that can hurt feelings. The collaborative Bro achievements ("Combined Total," "Iron Sharpens Iron," "Hype Man") explicitly reward making each other better — which is the actual goal of training together.

---

## 12. Tech stack

- **Frontend:** React PWA via Vite
- **Backend:** Supabase (auth, realtime sync, Postgres storage)
- **Deploy:** Vercel or Netlify
- **Pixel art:** generated via Nanobanan Pro from agreed style prompts; placeholders in code first, real sprites swapped in iteratively. Generation is handled by a **separate dev-run pipeline** (see §15) — the app never calls image models itself
- **Storage philosophy:** cloud-first from day one — same lesson as Gröda, no localStorage as primary store, no risk of losing Oskar's data when the schema changes

### Avatar / cosmetic art contract (what the app consumes)
The generation pipeline (§15, full design in `gymbros-generation-spec.md`) owns all avatar and cosmetic art and exposes it through Supabase. The app is a **read-only consumer** of:
- Existing `profiles` (already holds tiers + equipped gear; gains `avatar_base_prompt`), plus new tables `cosmetics` (incl. `slot`, rarity, description, current image), `generated_images` (with `atlas` JSON for spritesheet playback), and `avatar_renders` (loadout-bake cache keyed by `profile + tier + loadout_hash`).
- The existing public **`avatars` Storage bucket**, organized by prefix (`avatars/`, `cosmetics/`, `layers/`, `bakes/`, `effects/`) and versioned `v{n}`: standalone grid items, aura/companion layer sheets, loadout bakes, special reskins, and the fire-vortex stage loops.
- The app composites equipped slots by z-order, plays spritesheets via the `atlas` metadata, picks the fire-vortex stage from `intensity = currentXP / threshold` and tints it by currency in-app (§10), and applies rust as a visual treatment over the equipped set (§9).

---

## 13. Suggested build order

1. **Currencies + session logging** — everything else hangs off these two primitives
2. **PR detection + Consistency/PR achievements** — fastest dopamine, hooks the beginner phase
3. **Rust/rest-token streak system** — retention insurance
4. **Cosmetics + equip screen + detail-page descriptions** — equip screen is built around the RPG slots (§8); art is read from the pipeline's Supabase tables/bucket (§12 contract, §15)
5. **Avatar + fire vortex effect** — composite equipped slots by z-order, play spritesheets from `atlas` metadata, resolve loadout bakes from `avatar_renders`, wire the vortex stage to the existing XP float
6. **Bro/social achievements** — needs both accounts wired
7. **Strength milestones + IRON shop** — last because IRON is the slower currency
8. **Real art generation pass (FINAL, pre-launch)** — the whole app is built and ships against placeholder art; the avatar/cosmetic pipeline (§15, `gymbros-generation-spec.md`) is run **last, manually**, to produce and `approve` the real sprites just before launching to the friend. No auto-generation — manual + approval-gated only.

---

## 14. Still open

- Exact GRIT / IRON pricing for cosmetics (economy tuning)
- Tuning the IRON multipliers in §6 — first-pass numbers, calibrate against real session data
- Tuning the 2–3-session ceiling-check window — too short and progression feels jumpy, too long and it feels stalled
- Data model for a "session" and a "PR" (what fields, how PR detection actually runs)
- Pixel art for all 5–10 single-tier progression stages per side (currently only Level 1 prompted; v1 renders one combined tier per side — see §3)
- Exercise video sources / hosting
- Whether the Pro Mode header lives across both accounts or is per-user
- Exact Nanobanan Pro model id + whether loadout bakes run as a Supabase Edge Function (see §15)

---

## 15. Avatar & cosmetic generation pipeline

A **separate, dev-run tooling pipeline** (not part of the app runtime, not a user feature) that produces every avatar/cosmetic asset and writes them to Supabase for the app to consume (§12 contract). The app never calls image models directly. **Full design lives in `gymbros-generation-spec.md`** (decisions + reasoning, style guide, prompt structure, and how old prompts/images are versioned and stored); this section is the summary the app build must align to.

### What it is
- A local TypeScript CLI under `tools/cosmetic-gen/` run manually during development.
- Generation via **Gemini Nanobanan Pro**; background removal locally via `@imgly/background-removal-node` (remove.bg as fallback); frame alignment + spritesheet packing via `sharp`.
- Secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) stay local; never shipped to the client.

### What it generates
- **Avatar tiers** — one combined sprite per side per tier (§3 v1 decision), as a base pose plus short idle/flex clips packed into spritesheets (frames conditioned on frame 0 for character consistency; graceful fallback to a single static frame + code-driven motion).
- **Standalone cosmetic items** — the grid icons for the achievements/cosmetics list.
- **Aura + Companion layers** — transparent, self-animating overlay sheets composited at runtime.
- **Loadout bakes** — body-worn loadouts baked onto the current avatar via image-to-image, cached by `player + tier + loadout-hash` in `avatar_renders`.
- **Special / Soul Takeover** — full-avatar reskin sprites.
- **Fire vortex** — 5 fixed stage loops, neutral/white so the app tints per currency (§10); a system effect, not a cosmetic.

### Versioning
- Editable prompt *source* lives in the repo (git-diffable): base style, per-player prompt, tier scaffold, per-cosmetic fragments mapped to slots, vortex stages.
- Every run snapshots the exact resolved prompt + params + images immutably into Supabase (`prompt_versions`, `generated_images`); old versions are archived, never overwritten. An `approve` step flips which version is current/live.

### Trigger model
- New achievement with a cosmetic → resolve to its slot → bake (worn) or layer (aura/companion) → archive previous, set new current. Level-ups bake the new tier carrying the equipped loadout over.
- v1: bakes are pre-produced via the CLI for the loadouts players actually earn. The `avatar_renders` cache is the shared source of truth, so a future Supabase Edge Function can run the same bake on-equip with no rework.

### Consumer integration checklist (for the app build)
The app build is responsible only for *consuming* this output. To do that:

- [ ] Build the whole app against **placeholder art**; do not block on real sprites. The generation pass is build-order step 8 (final, pre-launch).
- [ ] **Never call image models** from the app or backend. Read finished, **approved** assets only.
- [ ] Render the avatar as a **single combined sprite per side** from one derived tier — no separate upper/lower sprites.
- [ ] Play avatar/cosmetic animation from **spritesheet + `atlas` JSON**; support a static-frame fallback with code-driven motion (bob / flex pop).
- [ ] Build the equip screen on the **RPG slots** (Head, Torso, Hands, Waist, Legs, Feet, Aura, Companion, Special).
- [ ] Composite the rendered avatar by **z-order**: loadout bake (or base-tier fallback if the current loadout isn't baked yet) → aura layer → companion layer; Special replaces the whole stack.
- [ ] Resolve the current avatar art via `avatar_renders` (by `profile + tier + loadout_hash`), falling back to the base-tier avatar when a loadout bake is absent.
- [ ] Render the **fire vortex** separately: pick the stage from `intensity = currentXP / threshold`, tint per currency in-app, draw base behind torso and flames in front. It is NOT the Aura slot.
- [ ] Resolve all images through **current/approved DB pointers** (`cosmetics.current_image_id`, `generated_images.is_approved`); never hardcode Storage paths.
- [ ] Apply **rust** (§9) as a visual treatment over the equipped set — a shader/filter on the composited layers, not a separate generated asset.
- [ ] Read player art state from `profiles` (tier, equipped gear, `avatar_base_prompt`); the app owns equip/rust state, the pipeline owns the art.
