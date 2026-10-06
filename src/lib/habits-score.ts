import type { HabitsToday } from '@/state/types';

/** Daily habit score — when sick, training is excused; lifestyle habits still count (7 max). */
export function habitScore(habits: HabitsToday, trainedToday: boolean): { done: number; total: number } {
  const lifestyle =
    (habits.sleep_met ? 1 : 0) +
    (habits.no_sugar ? 1 : 0) +
    (habits.protein_met ? 1 : 0) +
    (habits.water_met ? 1 : 0) +
    (habits.steps_met ? 1 : 0) +
    (habits.creatine_met ? 1 : 0) +
    (habits.mobility_met ? 1 : 0);
  if (habits.sick) return { done: lifestyle, total: 7 };
  const training = trainedToday ? 1 : 0;
  return { done: lifestyle + training, total: 8 };
}
