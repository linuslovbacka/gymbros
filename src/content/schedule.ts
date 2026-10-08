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
    'Rough guide, not medical advice. When unsure, rest and mark “I’m sick” on home — training is excused. Muscle soreness after training (not illness) — see Soreness & training again above.',
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

/** Static reference — soreness vs injury, same muscle group (Schedule screen). */
export const SORENESS_TRAINING_GUIDE = {
  title: 'Soreness & training again',
  disclaimer:
    'Rough guide, not medical advice. Sharp or joint pain is not “normal soreness.” When unsure, see a clinician.',
  okTitle: 'Usually OK (normal muscle soreness)',
  ok: [
    'Dull stiffness 24–72 h after a hard or new session — often called DOMS (delayed-onset muscle soreness).',
    'You don’t need zero soreness before training that group again — normal or slightly easier volume is fine.',
    'If it eases after warm-up and sets feel OK, training the same group again is normal.',
  ],
  swapTitle: 'Smarter swap today',
  swap: [
    'Upper still tight? Pick lower (or the other split day) — or gym full if that fits the day.',
    'Skills, Mobility, or easy Conditioning still count as showing up without hammering the same muscles.',
    'Beginner W1–W3 only advances when you finish a Main session (home or gym).',
  ],
  backOffTitle: 'Go easy or skip that group',
  backOff: [
    'Sharp, stabbing, or joint pain; swelling or bruising; pain that gets worse during warm-up sets.',
    'Clear drop in strength or range vs your last session on that movement — not just “heavy legs.”',
    'Whole-body crash (bad sleep + wiped out) — rest or a lighter day, not a PR attempt on sore muscles.',
  ],
  appNote:
    'You always choose upper, lower, or full — split suggestions from your last session are hints only. “I’m sick” on home excuses Main; other habits still count.',
} as const;
