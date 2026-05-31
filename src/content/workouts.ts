import type { Direction, Mode } from './types';
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
  prescription: string;
}

export const BEGINNER_PROGRAM: Record<'w1' | 'w2' | 'w3', BeginnerItem[]> = {
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
  splitDirection?: Direction;
}

/** The current workout, based on where the user is (spec sections 2, 4, 5). */
export function buildWorkout(opts: BuildOptions): WorkoutItem[] {
  const { mode, stage, state, kind, splitDirection } = opts;

  // Home beginners follow the fixed W1->W2->W3 block.
  if (mode === 'home' && stage !== 'standard') {
    return fromBeginner(BEGINNER_PROGRAM[stage]);
  }

  const framework = mode === 'home' ? HOME_FRAMEWORK : GYM_FRAMEWORK;

  if (kind === 'split') {
    const dir = splitDirection ?? 'up';
    const { pull, push } = framework[dir];
    return [resolve(pull, state), resolve(push, state), resolve(SUPPLEMENTARY.core[0], state)];
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

/** Next split direction cycles Up -> Forward -> Down based on the last one. */
export function nextSplitDirection(last?: Direction): Direction {
  if (!last) return 'up';
  const i = DIRECTION_ORDER.indexOf(last);
  return DIRECTION_ORDER[(i + 1) % DIRECTION_ORDER.length];
}
