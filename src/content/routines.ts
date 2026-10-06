import type { Mode } from './types';
import { getExercise } from './exercises';
import type { ExerciseState, WorkoutItem } from './workouts';
import { buildWorkout, type BuildOptions } from './workouts';

export type WorkoutRoutine = 'main' | 'skills' | 'glutes';

export const ROUTINE_LABELS: Record<WorkoutRoutine, { title: string; sub: string }> = {
  main: {
    title: 'Main program',
    sub: 'Full or split — shared Gymbros progression',
  },
  skills: {
    title: 'Skills',
    sub: 'Handstand, lever, L-sit — technique & holds',
  },
  glutes: {
    title: 'Glute day',
    sub: 'Hypertrophy focus — home or gym variants',
  },
};

function fixedItem(
  exerciseId: string,
  overrides: Partial<WorkoutItem> & Pick<WorkoutItem, 'sets' | 'low' | 'high' | 'prescription'>,
  state: ExerciseState,
): WorkoutItem {
  const ex = getExercise(exerciseId);
  const rungIndex = Math.min(state[exerciseId]?.rung ?? 0, Math.max(ex.ladder.length - 1, 0));
  const rung = ex.ladder[rungIndex];
  const weightKg =
    overrides.weightKg ??
    (ex.track === 'gym' ? (state[exerciseId]?.weightKg ?? ex.weight?.startKg) : undefined);

  return {
    exerciseId,
    name: ex.name,
    rungName: overrides.rungName ?? rung?.name ?? (weightKg != null ? `${weightKg} kg` : 'Working'),
    rungIndex: ex.track === 'gym' ? 0 : rungIndex,
    weightKg,
    sets: overrides.sets,
    low: overrides.low,
    high: overrides.high,
    timed: overrides.timed ?? rung?.timed,
    perSide: overrides.perSide ?? rung?.perSide,
    prescription: overrides.prescription,
  };
}

/** Skills session — same at home or gym (bodyweight / rings). */
function buildSkillsWorkout(state: ExerciseState): WorkoutItem[] {
  return [
    fixedItem('handstand', { sets: 3, low: 20, high: 45, prescription: '3 x 20-45 s hold', timed: true }, state),
    fixedItem('front_lever', { sets: 3, low: 10, high: 30, prescription: '3 x 10-30 s (progression hold)', timed: true }, state),
    fixedItem('lsit', { sets: 3, low: 10, high: 30, prescription: '3 x 10-30 s', timed: true }, state),
    fixedItem('hanging', { sets: 3, low: 30, high: 60, prescription: '3 x 30-60 s decompress', timed: true }, state),
  ];
}

/** Home glutes — rings, vest, DB/KB, furniture; no machines. */
function buildGlutesHomeWorkout(state: ExerciseState): WorkoutItem[] {
  return [
    fixedItem(
      'glute_bridge',
      { sets: 4, low: 10, high: 15, prescription: '4 x 10-15 (vest / backpack optional)' },
      state,
    ),
    fixedItem(
      'single_leg_rdl',
      { sets: 3, low: 6, high: 10, perSide: true, prescription: '3 x 6-10 each (DB/KB/backpack)' },
      state,
    ),
    fixedItem(
      'step_up_glute',
      { sets: 3, low: 6, high: 10, perSide: true, prescription: '3 x 6-10 each — slow, glute bias' },
      state,
    ),
    fixedItem(
      'quadruped_kickback',
      { sets: 3, low: 12, high: 15, perSide: true, prescription: '3 x 12-15 each (band optional)' },
      state,
    ),
    fixedItem(
      'side_hip_abduction',
      { sets: 3, low: 12, high: 20, perSide: true, prescription: '3 x 12-20 each (band / clamshell)' },
      state,
    ),
  ];
}

/** Gym glute day — machines + barbell pattern from your template. */
function buildGlutesGymWorkout(state: ExerciseState): WorkoutItem[] {
  return [
    fixedItem('hip_thrust', { sets: 4, low: 8, high: 12, prescription: '4 x 8-12 @ working weight' }, state),
    fixedItem('romanian_deadlift', { sets: 3, low: 6, high: 10, prescription: '3 x 6-10 @ working weight' }, state),
    fixedItem(
      'step_up_glute',
      { sets: 3, low: 6, high: 10, perSide: true, prescription: '3 x 6-10 each — supported step-up' },
      state,
    ),
    fixedItem(
      'cable_kickback',
      { sets: 3, low: 12, high: 15, perSide: true, prescription: '3 x 12-15 each' },
      state,
    ),
    fixedItem('hip_abduction_machine', { sets: 3, low: 12, high: 15, prescription: '3 x 12-15' }, state),
  ];
}

export function buildRoutineWorkout(
  routine: WorkoutRoutine,
  opts: BuildOptions & { mode: Mode },
): WorkoutItem[] {
  const { mode, state } = opts;
  if (routine === 'main') return buildWorkout(opts);
  if (routine === 'skills') return buildSkillsWorkout(state);
  if (routine === 'glutes') {
    return mode === 'gym' ? buildGlutesGymWorkout(state) : buildGlutesHomeWorkout(state);
  }
  return buildWorkout(opts);
}
