import { getExercise } from './exercises';
import type { Direction, Mode } from './types';
import {
  BEGINNER_PROGRAM,
  buildWorkout,
  DIRECTION_ORDER,
  GYM_FRAMEWORK,
  HOME_FRAMEWORK,
  nextSplitDirection,
  SUPPLEMENTARY,
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
  lastSplitDirection?: Direction;
}

export function todayPreview(opts: TodayPreviewOptions): WorkoutItem[] {
  const splitDirection = opts.kind === 'split' ? nextSplitDirection(opts.lastSplitDirection) : undefined;
  return buildWorkout({
    mode: opts.mode,
    stage: opts.stage,
    state: opts.state,
    kind: opts.kind,
    splitDirection,
  });
}

export function describeBeginnerWeek(stage: 'w1' | 'w2' | 'w3') {
  return BEGINNER_PROGRAM[stage].map((it) => ({
    ...it,
    name: getExercise(it.exerciseId).name,
  }));
}

export function describeSplitDay(mode: Mode, direction: Direction) {
  const framework = mode === 'home' ? HOME_FRAMEWORK : GYM_FRAMEWORK;
  const { pull, push } = framework[direction];
  return {
    direction,
    pull: getExercise(pull).name,
    push: getExercise(push).name,
    core: getExercise(SUPPLEMENTARY.core[0]).name,
  };
}

export function describeFullSession(opts: BuildOptions): WorkoutItem[] {
  return buildWorkout(opts);
}

export { DIRECTION_ORDER, nextSplitDirection };
