import type { LoggedEntry } from './types';

// IRON — absolute output (spec section 5).
//   Gym track:          IRON per set = weight (kg) x reps
//   Calisthenics track: IRON per set = reps x variation_multiplier
// Timed holds use seconds as the "reps" value.
export function ironForEntry(entry: LoggedEntry): number {
  let total = 0;
  for (const set of entry.sets) {
    if (entry.track === 'gym') {
      total += (set.weightKg ?? entry.weightKg ?? 0) * set.value;
    } else {
      total += set.value * entry.ironMultiplier;
    }
  }
  return Math.round(total);
}

export function ironForSession(entries: LoggedEntry[]): number {
  return entries.reduce((sum, e) => sum + ironForEntry(e), 0);
}

// GRIT — behaviour (spec section 8). Phase 1 keeps this simple: a flat reward for
// showing up plus a small bonus per exercise that maxed its range. Rich
// achievement-driven GRIT lands in Phase 2.
const GRIT_PER_SESSION = 20;
const GRIT_PER_CEILING = 5;

export function gritForSession(ceilingCount: number): number {
  return GRIT_PER_SESSION + ceilingCount * GRIT_PER_CEILING;
}
