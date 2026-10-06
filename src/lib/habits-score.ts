import type { HabitsToday } from '@/state/types';

/** Daily habit score — when sick, training is excused; diet + water still count (3 max). */
export function habitScore(habits: HabitsToday, trainedToday: boolean): { done: number; total: number } {
  const diet =
    (habits.no_sugar ? 1 : 0) +
    (habits.protein_met ? 1 : 0) +
    (habits.water_met ? 1 : 0) +
    (habits.steps_met ? 1 : 0);
  if (habits.sick) return { done: diet, total: 4 };
  const training = trainedToday ? 1 : 0;
  return { done: diet + training, total: 5 };
}
