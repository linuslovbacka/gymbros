# Gymbros — Habits MVP scope

Ship **daily discipline + training clarity** before flashy gamification or art pipeline work.

Full agent context: [HANDOFF.md](./HANDOFF.md).

---

## In scope

### Daily checks (home)

| Check | Behavior |
|--------|----------|
| No sugar | Manual toggle: stayed sugar-free today |
| Protein | Log grams on home; target from weight or **110 g** default (+25 g in **performance / bulk** on Diet) |
| Water | Toggle: ~**1.5–2 L** for the day |
| Training | Auto when workout logged — **excused** when **I’m sick today** is on |
| Sick | Skips training for the day; diet + water habits still count (**3/3** max) |

Show progress **3/3** (sick) or **4/4** (well). Partner’s checks under **Bro today**.

**Home in MVP:** habits + **TRAIN** + **Diet** (restrictions/goals reference) + schedule/sign-out — no VS / avatars / battle chrome ([DEFERRED_BATTLE_UI.md](./DEFERRED_BATTLE_UI.md)).

### Schedule (`/schedule` after Next migration)

- Beginner **W1 → W2 → W3** lists from `BEGINNER_PROGRAM`
- Standard **split** days: Up / Forward / Down (`HOME_FRAMEWORK`)
- **Full** home and gym session lists from `buildWorkout()`
- **Today preview** must match what **TRAIN** loads

### Workout loop

- Keep Home/Gym, Full/Split, exercise logging, feel + progress on done
- **Extra routines:** **Skills** (everyone) and **Glute day** (home + gym lists; Glute entry only when `NEXT_PUBLIC_PERSONAL_GLUTES_USER_ID` matches your auth user id)
- **Quiet done screen** in MVP — no achievement/currency theatre

### Data

- `daily_habits(user_id, date, no_sugar, protein_met)` + RLS
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

- Sleep ≥ 7 h, ~10k steps — extra booleans on `daily_habits`

Handbook-derived items **not** planned: see exclusions in [INSPIRATION_PROGRAM_HANDBOOK.md](./INSPIRATION_PROGRAM_HANDBOOK.md).

---

## Success criteria

- Two paired users: habits isolated; partner sees bro’s checks
- Schedule matches workout for same mode/stage/split
- Auth → pair → train → Supabase session still works after Next migration
