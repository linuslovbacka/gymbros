# Gymbros — Habits MVP scope

Ship **daily discipline + training clarity** before flashy gamification or art pipeline work.

Full agent context: [HANDOFF.md](./HANDOFF.md).

---

## In scope

### Daily checks (home)

| Check | Behavior |
|--------|----------|
| Sleep | Toggle: **≥ 7 h** last night |
| No sugar | Manual toggle: stayed sugar-free today |
| Protein | Log grams on home; target from weight or **110 g** default (+25 g in **performance / bulk** on Diet) |
| Water | Toggle: ~**1.5–2 L** for the day |
| Steps | Toggle: ~**10k** steps or post-meal walks / break up sitting |
| Kreatin | Toggle: **5 g** creatine monohydrate for the day |
| Mobility | Toggle: **5+ min** (or finish **TRAIN → Mobility**) |
| Training | Auto when strength/cardio workout logged — **excused** when **I’m sick today** is on |
| Sick | Skips training for the day; lifestyle habits still count (**7/7** max) |

Show progress **7/7** (sick) or **8/8** (well). Partner’s checks under **Bro today**.

**Diet screen:** restrictions (no sugar, caffeine tip), performance/bulk, protein/BMI, creatine guide, protein alternatives overlay, and a short lead on sleep ↔ habits.

**Home in MVP:** habits + **TRAIN** + **Diet** (restrictions/goals reference) + schedule/sign-out — no VS / avatars / battle chrome ([DEFERRED_BATTLE_UI.md](./DEFERRED_BATTLE_UI.md)).

### Schedule (`/schedule` after Next migration)

- Beginner **W1 → W2 → W3** (home Main only) — signposted on Schedule; **skippable** to standard
- Standard **home:** upper or lower only (no full home). **Gym:** full, upper, or lower — user picks each session
- Optional **split suggestion** from last logged split (copy only; does not assign the workout)
- **Today preview** must match what **TRAIN** loads for the same mode + choice

### Workout loop

- Home/Gym, session choice (above), exercise logging, feel + progress on done
- **Extra routines:** **Skills**, **Mobility** (timed stretch session), **Conditioning (4×4)**, and **Glute day** (home + gym lists; Glute entry only when `NEXT_PUBLIC_PERSONAL_GLUTES_USER_ID` matches your auth user id)
- **Quiet done screen** in MVP — no achievement/currency theatre

### Data

- `daily_habits(user_id, date, …)` — booleans for sleep, no_sugar, protein_met, water, steps, creatine, mobility_met, sick; `protein_g` + RLS
- Same Supabase project as today

### Stack (with migration)

Next.js in-place, Tailwind tokens, GSAP (light), Supabase SSR — see HANDOFF.

---

## Out of scope (defer)

- **VS / battle home** — fighters, VS mark, waiting-for-bro, level badges, vortex avatars ([DEFERRED_BATTLE_UI.md](./DEFERRED_BATTLE_UI.md))
- `tools/cosmetic-gen/` / Gemini pipeline
- Locker, IRON shop, Pro Mode escalation UI, fire vortex, real sprites
- Achievement unlock fanfare (engine may stay; UI hidden via `MVP_MODE`)
- Nutrition tracking beyond yes/no protein
- PWA manifest polish (after habits feel good)

---

## Phase 1.5 (easy add-ons)

- ~~Sleep ≥ 7 h, ~10k steps~~ — shipped on home (`sleep_met`, `steps_met`)

Handbook-derived items **not** planned: see exclusions in [INSPIRATION_PROGRAM_HANDBOOK.md](./INSPIRATION_PROGRAM_HANDBOOK.md).

---

## Success criteria

- Two paired users: habits isolated; partner sees bro’s checks
- Schedule matches workout for same mode/stage/split
- Auth → pair → train → Supabase session still works after Next migration
