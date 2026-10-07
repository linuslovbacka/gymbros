import type { Direction, Mode, SplitDay } from './types';
import { getExercise } from './exercises';

// ─── Push/pull framework (spec section 4) ────────────────────────────────────

export const HOME_FRAMEWORK: Record<Direction, { pull: string; push: string }> = {
  up: { pull: 'pullup', push: 'pike_pushup' },
  forward: { pull: 'inverted_row', push: 'pushup' },
  down: { pull: 'front_lever', push: 'dip' },
};

export const GYM_FRAMEWORK: Record<Direction, { pull: string; push: string }> = {
  up: { pull: 'lat_pulldown', push: 'shoulder_press' },
  forward: { pull: 'cable_row', push: 'bench_press' },
  down: { pull: 'db_high_pull', push: 'weighted_dip' },
};

export const SUPPLEMENTARY = {
  skill: 'handstand',
  core: ['hollow', 'lsit'],
  legs: ['pistol', 'nordic'],
  decompression: 'hanging',
};

export const DIRECTION_ORDER: Direction[] = ['up', 'forward', 'down'];

export const SPLIT_DAY_ORDER: SplitDay[] = ['upper', 'lower'];

export const SPLIT_DAY_LABEL: Record<SplitDay, string> = {
  upper: 'Upper body',
  lower: 'Lower body',
};

/** Copy for Schedule / TRAIN — suggestion only, not assignment. */
export const BEGINNER_ONBOARDING = {
  title: 'Beginner ramp (W1 → W3)',
  bullets: [
    'Same three weeks for home and gym Main — each week has a fixed exercise list tuned to that location (easier rungs / starter weights).',
    'One completed Main workout advances the week — home or gym counts, not both required. Skills, mobility, and cardio do not advance the ramp.',
    'After W3 you unlock the full program: home upper/lower only; gym full, upper, or lower each session.',
  ],
  advanceDetail:
    'You stay on W1 until you finish one home or gym Main session, then W2, then W3, then standard. Logging the wrong location still uses that week’s list for where you train.',
  skipLabel: 'Skip to full program',
  skipConfirmTitle: 'Skip the beginner ramp?',
  skipConfirmBody:
    'You’ll jump straight to choosing upper or lower at home (and full/upper/lower at gym). Your exercise progress stays as-is; only the ramp week counter is skipped.',
  unlockNote: 'Split-day reference lists unlock after W3 or if you skip.',
} as const;

/** Exercises per split day (standard program only). */
export const SPLIT_WORKOUT: Record<Mode, Record<SplitDay, string[]>> = {
  home: {
    upper: ['pullup', 'pike_pushup', 'inverted_row', 'pushup', 'front_lever', 'dip', 'hollow'],
    lower: ['pistol', 'glute_bridge', 'nordic', 'hanging'],
  },
  gym: {
    upper: ['lat_pulldown', 'bench_press', 'cable_row'],
    lower: ['deadlift', 'hip_thrust', 'romanian_deadlift', 'single_leg_rdl'],
  },
};

// ─── Beginner block W1 -> W2 -> W3 (spec section 4) ──────────────────────────
// Fixed onboarding prescriptions; each item pins an exercise to a starting rung.

export type ProgramStage = 'w1' | 'w2' | 'w3' | 'standard';

export interface BeginnerItem {
  exerciseId: string;
  rungIndex: number;
  sets: number;
  low: number;
  high: number;
  timed?: boolean;
  /** Gym lifts — pinned working weight for this ramp week. */
  weightKg?: number;
  prescription: string;
}

export type BeginnerStage = 'w1' | 'w2' | 'w3';

export const BEGINNER_PROGRAM: Record<BeginnerStage, BeginnerItem[]> = {
  w1: [
    { exerciseId: 'pullup', rungIndex: 2, sets: 3, low: 3, high: 6, prescription: '3 x 3-6' },
    { exerciseId: 'dip', rungIndex: 1, sets: 3, low: 3, high: 6, prescription: '3 x 3-6' },
    { exerciseId: 'inverted_row', rungIndex: 1, sets: 3, low: 10, high: 15, prescription: '3 x 10-15' },
    { exerciseId: 'pushup', rungIndex: 2, sets: 3, low: 8, high: 15, prescription: '3 x 8-15' },
    { exerciseId: 'hollow', rungIndex: 2, sets: 3, low: 30, high: 30, timed: true, prescription: '3 x 30 s' },
    { exerciseId: 'hanging', rungIndex: 1, sets: 3, low: 30, high: 60, timed: true, prescription: '3 x 30-60 s' },
  ],
  w2: [
    { exerciseId: 'pullup', rungIndex: 5, sets: 3, low: 3, high: 6, prescription: '3 x 3-6' },
    { exerciseId: 'pike_pushup', rungIndex: 1, sets: 3, low: 5, high: 10, prescription: '3 x 5-10' },
    { exerciseId: 'inverted_row', rungIndex: 1, sets: 3, low: 10, high: 15, prescription: '3 x 10-15' },
    { exerciseId: 'pushup', rungIndex: 2, sets: 3, low: 8, high: 15, prescription: '3 x 8-15' },
    { exerciseId: 'hollow', rungIndex: 2, sets: 3, low: 30, high: 30, timed: true, prescription: '3 x 30 s' },
    { exerciseId: 'hanging', rungIndex: 1, sets: 3, low: 30, high: 60, timed: true, prescription: '3 x 30-60 s' },
  ],
  w3: [
    { exerciseId: 'pullup', rungIndex: 4, sets: 3, low: 6, high: 12, prescription: '3 x 6-12' },
    { exerciseId: 'dip', rungIndex: 2, sets: 3, low: 5, high: 10, prescription: '3 x 5-10' },
    { exerciseId: 'inverted_row', rungIndex: 1, sets: 3, low: 10, high: 15, prescription: '3 x 10-15' },
    { exerciseId: 'pushup', rungIndex: 2, sets: 3, low: 8, high: 15, prescription: '3 x 8-15' },
    { exerciseId: 'hollow', rungIndex: 2, sets: 3, low: 30, high: 30, timed: true, prescription: '3 x 30 s' },
    { exerciseId: 'hanging', rungIndex: 1, sets: 3, low: 30, high: 60, timed: true, prescription: '3 x 30-60 s' },
  ],
};

/** Gym Main beginner block — same W1→W3 counter as home. */
export const BEGINNER_PROGRAM_GYM: Record<BeginnerStage, BeginnerItem[]> = {
  w1: [
    {
      exerciseId: 'lat_pulldown',
      rungIndex: 0,
      sets: 3,
      low: 8,
      high: 12,
      weightKg: 25,
      prescription: '3 x 8-12 @ 25 kg',
    },
    {
      exerciseId: 'bench_press',
      rungIndex: 0,
      sets: 3,
      low: 8,
      high: 12,
      weightKg: 20,
      prescription: '3 x 8-12 @ 20 kg',
    },
    {
      exerciseId: 'cable_row',
      rungIndex: 0,
      sets: 3,
      low: 8,
      high: 12,
      weightKg: 25,
      prescription: '3 x 8-12 @ 25 kg',
    },
    {
      exerciseId: 'deadlift',
      rungIndex: 0,
      sets: 3,
      low: 5,
      high: 8,
      weightKg: 35,
      prescription: '3 x 5-8 @ 35 kg',
    },
    { exerciseId: 'hollow', rungIndex: 2, sets: 3, low: 30, high: 30, timed: true, prescription: '3 x 30 s' },
  ],
  w2: [
    {
      exerciseId: 'lat_pulldown',
      rungIndex: 0,
      sets: 3,
      low: 6,
      high: 10,
      weightKg: 30,
      prescription: '3 x 6-10 @ 30 kg',
    },
    {
      exerciseId: 'shoulder_press',
      rungIndex: 0,
      sets: 3,
      low: 8,
      high: 12,
      weightKg: 20,
      prescription: '3 x 8-12 @ 20 kg',
    },
    {
      exerciseId: 'cable_row',
      rungIndex: 0,
      sets: 3,
      low: 8,
      high: 12,
      weightKg: 30,
      prescription: '3 x 8-12 @ 30 kg',
    },
    {
      exerciseId: 'bench_press',
      rungIndex: 0,
      sets: 3,
      low: 6,
      high: 10,
      weightKg: 25,
      prescription: '3 x 6-10 @ 25 kg',
    },
    { exerciseId: 'hollow', rungIndex: 2, sets: 3, low: 30, high: 30, timed: true, prescription: '3 x 30 s' },
  ],
  w3: [
    {
      exerciseId: 'lat_pulldown',
      rungIndex: 0,
      sets: 3,
      low: 8,
      high: 12,
      weightKg: 32.5,
      prescription: '3 x 8-12 @ 32.5 kg',
    },
    {
      exerciseId: 'bench_press',
      rungIndex: 0,
      sets: 3,
      low: 6,
      high: 10,
      weightKg: 30,
      prescription: '3 x 6-10 @ 30 kg',
    },
    {
      exerciseId: 'cable_row',
      rungIndex: 0,
      sets: 3,
      low: 8,
      high: 12,
      weightKg: 32.5,
      prescription: '3 x 8-12 @ 32.5 kg',
    },
    {
      exerciseId: 'shoulder_press',
      rungIndex: 0,
      sets: 3,
      low: 6,
      high: 10,
      weightKg: 22.5,
      prescription: '3 x 6-10 @ 22.5 kg',
    },
    {
      exerciseId: 'deadlift',
      rungIndex: 0,
      sets: 3,
      low: 5,
      high: 8,
      weightKg: 40,
      prescription: '3 x 5-8 @ 40 kg',
    },
    { exerciseId: 'hollow', rungIndex: 2, sets: 3, low: 30, high: 30, timed: true, prescription: '3 x 30 s' },
  ],
};

export function beginnerProgramFor(mode: Mode, stage: BeginnerStage): BeginnerItem[] {
  return mode === 'home' ? BEGINNER_PROGRAM[stage] : BEGINNER_PROGRAM_GYM[stage];
}

// ─── Per-exercise progress carried in profile.exercise_state ─────────────────

export interface ExerciseProgress {
  /** Current ladder index (calisthenics). */
  rung?: number;
  /** Current working weight (gym lifts). */
  weightKg?: number;
  /** Consecutive sessions the ceiling was hit on every working set. */
  ceilingStreak?: number;
  /** Eligible to climb — surfaced as a prompt. */
  pendingLevelUp?: boolean;
  /**
   * Best effort ever recorded, for PR detection. Compared lexicographically:
   * `prRank` first (ladder index for calisthenics, working weight for gym),
   * then `prValue` (max reps, or seconds for holds) as the tie-breaker.
   */
  prRank?: number;
  prValue?: number;
}

export type ExerciseState = Record<string, ExerciseProgress>;

/** A single resolved exercise to perform + log in a workout. */
export interface WorkoutItem {
  exerciseId: string;
  name: string;
  rungName: string;
  rungIndex: number;
  weightKg?: number;
  sets: number;
  low: number;
  high: number;
  timed?: boolean;
  perSide?: boolean;
  prescription: string;
}

function resolveCalisthenics(exerciseId: string, state: ExerciseState): WorkoutItem {
  const ex = getExercise(exerciseId);
  const rungIndex = Math.min(state[exerciseId]?.rung ?? 0, ex.ladder.length - 1);
  const rung = ex.ladder[rungIndex];
  return {
    exerciseId,
    name: ex.name,
    rungName: rung.name,
    rungIndex,
    sets: rung.sets,
    low: rung.low,
    high: rung.high,
    timed: rung.timed,
    perSide: rung.perSide,
    prescription: rung.prescription,
  };
}

function resolveGym(exerciseId: string, state: ExerciseState): WorkoutItem {
  const ex = getExercise(exerciseId);
  const w = ex.weight!;
  const weightKg = state[exerciseId]?.weightKg ?? w.startKg;
  return {
    exerciseId,
    name: ex.name,
    rungName: `${weightKg} kg`,
    rungIndex: 0,
    weightKg,
    sets: 3,
    low: w.low,
    high: w.high,
    prescription: `3 x ${w.low}-${w.high} @ ${weightKg} kg`,
  };
}

function resolve(exerciseId: string, state: ExerciseState): WorkoutItem {
  return getExercise(exerciseId).track === 'gym'
    ? resolveGym(exerciseId, state)
    : resolveCalisthenics(exerciseId, state);
}

function fromBeginner(items: BeginnerItem[]): WorkoutItem[] {
  return items.map((it) => {
    const ex = getExercise(it.exerciseId);
    if (ex.track === 'gym') {
      const w = ex.weight!;
      const weightKg = it.weightKg ?? w.startKg;
      return {
        exerciseId: it.exerciseId,
        name: ex.name,
        rungName: `${weightKg} kg`,
        rungIndex: 0,
        weightKg,
        sets: it.sets,
        low: it.low,
        high: it.high,
        prescription: it.prescription,
      };
    }
    const rung = ex.ladder[it.rungIndex];
    return {
      exerciseId: it.exerciseId,
      name: ex.name,
      rungName: rung.name,
      rungIndex: it.rungIndex,
      sets: it.sets,
      low: it.low,
      high: it.high,
      timed: it.timed,
      perSide: rung.perSide,
      prescription: it.prescription,
    };
  });
}

export interface BuildOptions {
  mode: Mode;
  stage: ProgramStage;
  state: ExerciseState;
  kind: 'full' | 'split';
  splitDay?: SplitDay;
}

/** The current workout, based on where the user is (spec sections 2, 4, 5). */
export function buildWorkout(opts: BuildOptions): WorkoutItem[] {
  const { mode, stage, state, kind, splitDay } = opts;

  // Beginners follow the fixed W1->W2->W3 block (home or gym Main).
  if (stage !== 'standard') {
    return fromBeginner(beginnerProgramFor(mode, stage));
  }

  const framework = mode === 'home' ? HOME_FRAMEWORK : GYM_FRAMEWORK;

  if (kind === 'split') {
    const day = splitDay ?? 'upper';
    return SPLIT_WORKOUT[mode][day].map((id) => resolve(id, state));
  }

  // Full session: every direction (pull + push) plus one core and one leg movement.
  const items: WorkoutItem[] = [];
  for (const dir of DIRECTION_ORDER) {
    items.push(resolve(framework[dir].pull, state));
    items.push(resolve(framework[dir].push, state));
  }
  if (mode === 'gym') items.push(resolve('deadlift', state));
  items.push(resolve(SUPPLEMENTARY.legs[0], state));
  items.push(resolve(SUPPLEMENTARY.core[0], state));
  return items;
}

/** Maps legacy session `split` values (up/forward/down) to upper body. */
export function normalizeSplitDay(last?: string | null): SplitDay | undefined {
  if (last === 'upper' || last === 'lower') return last;
  if (last === 'up' || last === 'forward' || last === 'down') return 'upper';
  return undefined;
}

/** Alternating follow-up — for suggestion copy only, not workout assignment. */
export function nextSplitDay(last?: SplitDay): SplitDay {
  if (!last) return 'upper';
  return last === 'upper' ? 'lower' : 'upper';
}

export function suggestedSplitDay(last?: SplitDay): SplitDay {
  return nextSplitDay(last);
}

export function splitDaySuggestion(last?: SplitDay): string {
  if (!last) return 'Pick upper or lower — we’ll remember what you log.';
  const suggested = suggestedSplitDay(last);
  return `If you’re alternating, ${SPLIT_DAY_LABEL[suggested].toLowerCase()} is a common follow-up to your last split.`;
}

/** @deprecated Use nextSplitDay — kept for imports during transition. */
export function nextSplitDirection(last?: SplitDay): SplitDay {
  return nextSplitDay(last);
}
