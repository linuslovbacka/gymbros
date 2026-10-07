import { getExercise } from './exercises';
import type { Mode, SplitDay } from './types';
import {
  beginnerProgramFor,
  buildWorkout,
  SPLIT_DAY_LABEL,
  SPLIT_DAY_ORDER,
  SPLIT_WORKOUT,
  type BeginnerStage,
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
  /** Required when kind is split — from UI toggle, not lastSplitDay. */
  splitDay?: SplitDay;
}

export function todayPreview(opts: TodayPreviewOptions): WorkoutItem[] {
  const splitDay = opts.kind === 'split' ? opts.splitDay : undefined;
  return buildWorkout({
    mode: opts.mode,
    stage: opts.stage,
    state: opts.state,
    kind: opts.kind,
    splitDay,
  });
}

export function describeBeginnerWeek(stage: BeginnerStage, mode: Mode = 'home') {
  return beginnerProgramFor(mode, stage).map((it) => ({
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

export {
  SPLIT_DAY_ORDER,
  nextSplitDay,
  SPLIT_DAY_LABEL,
  splitDaySuggestion,
  suggestedSplitDay,
  BEGINNER_ONBOARDING,
} from './workouts';

/** Static reference — when to train vs rest (Schedule screen). */
export const SICK_TRAINING_GUIDE = {
  title: 'Train vs rest',
  disclaimer:
    'Rough guide, not medical advice. When unsure, rest and mark “I’m sick” on home — training is excused.',
  skipTitle: 'Skip the gym',
  skip: [
    'Fever, chills, or flu-like fatigue and body aches.',
    'Below the neck: chest cough, wheezing, or stomach bug (nausea, vomiting, diarrhea).',
    'Heart racing at rest, chest pain, or breathing clearly worse with effort.',
  ],
  easyTitle: 'Maybe easy movement only',
  easy: [
    'Mild cold above the neck (congestion, sneezing) and you feel roughly 80%+ normal.',
    'Short session, lighter weights, no PRs or hard HIIT — stop if warm-ups feel wrong.',
    'If you feel worse the next day, you went too hard.',
  ],
  comebackTitle: 'Coming back',
  comeback: [
    'Wait until you’re fever-free 24–48 h and energy is returning.',
    'First sessions back at ~50–70% volume — don’t catch up missed days; rejoin today’s schedule.',
  ],
} as const;
