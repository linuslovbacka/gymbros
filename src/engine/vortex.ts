// Fire-vortex driver (spec section 10). The vortex is a SEPARATE system effect,
// never baked into avatar art. It is driven by a single 0–1 float
// `intensity = currentXP / threshold` mapped to five escalating stages, and
// tinted by currency (orange GRIT / cold blue IRON) from one neutral asset.

import { CEILING_WINDOW } from './leveling';
import type { ExerciseState } from '../content/workouts';

export type VortexStage = 1 | 2 | 3 | 4 | 5;
export type VortexTint = 'grit' | 'iron';

/**
 * Closeness to the next avatar level, as a 0–1 float. "XP" here is progress
 * toward the next ladder climb: a pending level-up reads as nearly full, else
 * the best ceiling-streak ratio across exercises (consecutive max-range
 * sessions / the window needed to climb). Grows every session — see §10.
 */
export function vortexIntensity(state: ExerciseState): number {
  let best = 0;
  for (const p of Object.values(state)) {
    if (p.pendingLevelUp) return 0.96;
    const streak = p.ceilingStreak ?? 0;
    best = Math.max(best, streak / CEILING_WINDOW);
  }
  return Math.max(0, Math.min(0.95, best));
}

export function vortexStage(intensity: number): VortexStage {
  if (intensity < 0.2) return 1;
  if (intensity < 0.4) return 2;
  if (intensity < 0.6) return 3;
  if (intensity < 0.8) return 4;
  return 5;
}

/**
 * Tint by currency lane: the stronger lifter of the pair (more IRON) burns cold
 * blue, everyone else burns GRIT orange. Solo players default to GRIT.
 */
export function vortexTint(iron: number, opponentIron: number | null): VortexTint {
  if (opponentIron == null) return 'grit';
  return iron > opponentIron ? 'iron' : 'grit';
}
