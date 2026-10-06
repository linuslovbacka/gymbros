# Deferred — battle / VS home (post-MVP)

Saved for when `MVP_MODE` is off. Code lives in `StartScreen` (full layout), `screens.css` (`.vs-screen`), and related components — not deleted.

## VS home layout

- Two-column **fighter** stage with center **VS** mark
- **Days trained** hero numeral in the grid center
- **Waiting for bro** empty side + ghost avatar
- **Both bros in today** banner when both trained
- **Foot shadow** + **AvatarStage** (fire vortex tint vs opponent IRON)

## Fighter chrome

- Display name + **trained today** dot
- **LEVEL** from physique tiers
- Cosmetic **title**, **RUSTY** badge
- **UP / LO / STREAK** tier badges
- Tap avatar → **locker** (when wired)

## Top bar (full mode)

- **IRON / GRIT** chips + **rest tokens**
- **Pro Mode** header (escalating label / chaos gradient)

## Related systems (already gated elsewhere)

- Done screen: IRON/GRIT rewards, PR banners, achievements, level-up climb prompts
- Locker, shop, Pro Mode press — routes may exist; keep hidden in MVP

## Re-enable

Set `MVP_MODE = false` in `src/lib/mvp.ts` and verify pairing + opponent realtime still feel good on the VS screen.
