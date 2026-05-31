import type { Track } from '../content/types';

/** One working set as logged by the user. `value` is reps, or seconds for holds. */
export interface LoggedSet {
  value: number;
  weightKg?: number;
}

/** A completed exercise within a session. */
export interface LoggedEntry {
  exerciseId: string;
  track: Track;
  rungIndex: number;
  weightKg?: number;
  timed?: boolean;
  perSide?: boolean;
  ironMultiplier: number;
  target: { low: number; high: number; sets: number };
  sets: LoggedSet[];
}

export type Feel = 'easy' | 'good' | 'dead';

// Self-report options differ per track (spec section 5).
export type CalisthenicsProgress = 'more_reps' | 'cleaner_form' | 'harder_variation' | 'easier';
export type GymProgress = 'more_reps' | 'more_weight' | 'easier';
export type ProgressAnswer = CalisthenicsProgress | GymProgress;

export const CALISTHENICS_PROGRESS: { id: CalisthenicsProgress; label: string }[] = [
  { id: 'more_reps', label: 'More reps' },
  { id: 'cleaner_form', label: 'Cleaner form' },
  { id: 'harder_variation', label: 'Moved to harder variation' },
  { id: 'easier', label: 'Felt easier' },
];

export const GYM_PROGRESS: { id: GymProgress; label: string }[] = [
  { id: 'more_reps', label: 'More reps' },
  { id: 'more_weight', label: 'More weight' },
  { id: 'easier', label: 'Felt easier' },
];

export const FEEL_OPTIONS: { id: Feel; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'good', label: 'Good' },
  { id: 'dead', label: 'Dead' },
];
