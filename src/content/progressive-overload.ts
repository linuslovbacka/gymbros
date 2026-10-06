import { getExercise } from './exercises';
import type { WorkoutItem } from './workouts';

export function workingSetsHitCeiling(setValues: number[], targetSets: number, high: number): boolean {
  if (setValues.length < targetSets) return false;
  return setValues.slice(0, targetSets).every((v) => v >= high);
}

export function ceilingPromptCopy(item: WorkoutItem, track: 'calisthenics' | 'gym'): {
  title: string;
  body: string;
} {
  if (track === 'gym') {
    return {
      title: 'You maxed the rep range',
      body: `Progressive overload: add a little weight (about +2.5–5 kg on this lift) while staying in ${item.low}–${item.high} reps with clean form. Log the heavier weight below when you’re ready.`,
    };
  }
  return {
    title: 'You maxed the rep range',
    body: `Progressive overload: make the movement harder — use a heavier band, less assistance, a harder variation, or add vest/backpack weight. Hit ${item.low}–${item.high} again at the new level before climbing again.`,
  };
}

export function nextRungWorkoutItem(item: WorkoutItem): WorkoutItem | null {
  const ex = getExercise(item.exerciseId);
  if (ex.track === 'gym') return null;
  const nextIndex = item.rungIndex + 1;
  if (nextIndex >= ex.ladder.length) return null;
  const rung = ex.ladder[nextIndex]!;
  return {
    ...item,
    rungIndex: nextIndex,
    rungName: rung.name,
    sets: rung.sets,
    low: rung.low,
    high: rung.high,
    timed: rung.timed,
    perSide: rung.perSide,
    prescription: rung.prescription,
  };
}

export function suggestedGymBumpKg(exerciseId: string, currentKg: number): number {
  const ex = getExercise(exerciseId);
  const inc = ex.weight?.incrementKg ?? 2.5;
  return Math.max(0, currentKg + inc);
}
