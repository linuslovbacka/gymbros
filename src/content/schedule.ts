import { getExercise } from './exercises';
import type { Mode, SplitDay } from './types';
import {
  BEGINNER_PROGRAM,
  buildWorkout,
  nextSplitDay,
  SPLIT_DAY_LABEL,
  SPLIT_DAY_ORDER,
  SPLIT_WORKOUT,
  type BuildOptions,
  type ExerciseState,
  type ProgramStage,
  type WorkoutItem,
} from './workouts';

export interface TodayPreviewOptions {
  mode: Mode;
  kind: 'full' | 'split';
  stage: ProgramStage;
  state: ExerciseState;
  lastSplitDay?: SplitDay;
}

export function todayPreview(opts: TodayPreviewOptions): WorkoutItem[] {
  const splitDay = opts.kind === 'split' ? nextSplitDay(opts.lastSplitDay) : undefined;
  return buildWorkout({
    mode: opts.mode,
    stage: opts.stage,
    state: opts.state,
    kind: opts.kind,
    splitDay,
  });
}

export function describeBeginnerWeek(stage: 'w1' | 'w2' | 'w3') {
  return BEGINNER_PROGRAM[stage].map((it) => ({
    ...it,
    name: getExercise(it.exerciseId).name,
  }));
}

export function describeSplitDay(mode: Mode, day: SplitDay) {
  const ids = SPLIT_WORKOUT[mode][day];
  return {
    day,
    label: SPLIT_DAY_LABEL[day],
    exercises: ids.map((id) => getExercise(id).name),
  };
}

export function describeFullSession(opts: BuildOptions): WorkoutItem[] {
  return buildWorkout(opts);
}

export { SPLIT_DAY_ORDER, nextSplitDay, SPLIT_DAY_LABEL };
