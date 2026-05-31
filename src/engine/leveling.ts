import { getExercise } from '../content/exercises';
import type { ExerciseState } from '../content/workouts';
import type { LoggedEntry, ProgressAnswer } from './types';

// Sessions in a row at the rep ceiling before a level-up unlocks (spec section 5,
// "2-3 consecutive sessions"). Tunable — see spec section 14.
export const CEILING_WINDOW = 2;

/** True when every working set reached the top of the prescribed range. */
export function entryHitCeiling(entry: LoggedEntry): boolean {
  if (entry.sets.length < entry.target.sets) return false;
  return entry.sets.every((s) => s.value >= entry.target.high);
}

/** Self-report that agrees it is getting easier (spec section 5, channel 2). */
function isPositiveProgress(answer: ProgressAnswer): boolean {
  return answer === 'easier' || answer === 'more_reps' || answer === 'cleaner_form';
}

/** "more weight" / "harder variation" — the user already climbed; trust them. */
function isOverride(answer: ProgressAnswer): boolean {
  return answer === 'more_weight' || answer === 'harder_variation';
}

function atMax(exerciseId: string, rungIndex: number): boolean {
  const ex = getExercise(exerciseId);
  if (ex.track === 'gym') return false; // weight can always climb
  return rungIndex >= ex.ladder.length - 1;
}

export interface LevelUpPrompt {
  exerciseId: string;
  name: string;
  currentRungName: string;
  nextRungName: string;
}

function rungName(exerciseId: string, rungIndex: number, weightKg?: number): string {
  const ex = getExercise(exerciseId);
  if (ex.track === 'gym') return `${weightKg ?? ex.weight!.startKg} kg`;
  return ex.ladder[rungIndex]?.name ?? '';
}

function nextRungName(exerciseId: string, rungIndex: number, weightKg?: number): string {
  const ex = getExercise(exerciseId);
  if (ex.track === 'gym') {
    return `${(weightKg ?? ex.weight!.startKg) + ex.weight!.incrementKg} kg`;
  }
  return ex.ladder[rungIndex + 1]?.name ?? '';
}

export interface ProgressResult {
  state: ExerciseState;
  prompts: LevelUpPrompt[];
}

/**
 * Fold a finished session into per-exercise progress. Updates ceiling streaks
 * and flags any exercise that has earned a level-up prompt (spec section 5).
 * Does NOT auto-advance — the user confirms via the prompt.
 */
export function applyProgress(
  state: ExerciseState,
  entries: LoggedEntry[],
  progress: ProgressAnswer,
): ProgressResult {
  const next: ExerciseState = { ...state };
  const prompts: LevelUpPrompt[] = [];

  for (const entry of entries) {
    const prev = state[entry.exerciseId] ?? {};
    const hit = entryHitCeiling(entry);
    const streak = hit ? (prev.ceilingStreak ?? 0) + 1 : 0;
    const maxed = atMax(entry.exerciseId, entry.rungIndex);

    const eligible =
      !maxed &&
      hit &&
      (isOverride(progress) || (streak >= CEILING_WINDOW && isPositiveProgress(progress)));

    next[entry.exerciseId] = {
      ...prev,
      rung: prev.rung ?? (entry.track === 'gym' ? undefined : entry.rungIndex),
      weightKg: prev.weightKg ?? entry.weightKg,
      ceilingStreak: streak,
      pendingLevelUp: eligible || prev.pendingLevelUp,
    };

    if (eligible && !prev.pendingLevelUp) {
      prompts.push({
        exerciseId: entry.exerciseId,
        name: getExercise(entry.exerciseId).name,
        currentRungName: rungName(entry.exerciseId, entry.rungIndex, entry.weightKg),
        nextRungName: nextRungName(entry.exerciseId, entry.rungIndex, entry.weightKg),
      });
    }
  }

  return { state: next, prompts };
}

/** Climb one rung (calisthenics) or add one increment (gym). Manual or confirmed. */
export function climb(state: ExerciseState, exerciseId: string): ExerciseState {
  const ex = getExercise(exerciseId);
  const prev = state[exerciseId] ?? {};
  if (ex.track === 'gym') {
    const weightKg = (prev.weightKg ?? ex.weight!.startKg) + ex.weight!.incrementKg;
    return { ...state, [exerciseId]: { ...prev, weightKg, ceilingStreak: 0, pendingLevelUp: false } };
  }
  const rung = Math.min((prev.rung ?? 0) + 1, ex.ladder.length - 1);
  return { ...state, [exerciseId]: { ...prev, rung, ceilingStreak: 0, pendingLevelUp: false } };
}

/** Step back down a rung / increment — manual override (spec section 5). */
export function stepDown(state: ExerciseState, exerciseId: string): ExerciseState {
  const ex = getExercise(exerciseId);
  const prev = state[exerciseId] ?? {};
  if (ex.track === 'gym') {
    const weightKg = Math.max((prev.weightKg ?? ex.weight!.startKg) - ex.weight!.incrementKg, 0);
    return { ...state, [exerciseId]: { ...prev, weightKg, ceilingStreak: 0, pendingLevelUp: false } };
  }
  const rung = Math.max((prev.rung ?? 0) - 1, 0);
  return { ...state, [exerciseId]: { ...prev, rung, ceilingStreak: 0, pendingLevelUp: false } };
}

/** "Not yet" — stay on the rung for another cycle (spec section 5). */
export function declineLevelUp(state: ExerciseState, exerciseId: string): ExerciseState {
  const prev = state[exerciseId] ?? {};
  return { ...state, [exerciseId]: { ...prev, ceilingStreak: 0, pendingLevelUp: false } };
}
