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
  BEGINNER_ONBOARDING,
} from './workouts';
import { buildRoutineWorkout, ROUTINE_LABELS, type WorkoutRoutine } from './routines';
import { canShowGluteRoutine } from '@/lib/personal-routines';
import type { Profile } from '@/state/types';

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

export type ScheduleProgramRow =
  | { kind: 'beginner'; sub: string }
  | { kind: 'block'; title: string; sub: string };

export type ScheduleModeProgramCard = {
  mode: Mode;
  heading: string;
  rows: ScheduleProgramRow[];
};

function joinNames(names: string[], max = 5): string {
  if (names.length === 0) return '';
  if (names.length <= max) return names.join(' · ');
  return [...names.slice(0, max), `+${names.length - max} more`].join(' · ');
}

function beginnerStageFromProgram(stage: ProgramStage): BeginnerStage {
  if (stage === 'w2' || stage === 'w3') return stage;
  return 'w1';
}

function beginnerSubline(stage: ProgramStage, mode: Mode): string {
  const rampStage = stage !== 'standard' ? stage : 'w1';
  const items = describeBeginnerWeek(beginnerStageFromProgram(rampStage), mode);
  const names = joinNames(
    items.slice(0, 2).map((it) => it.name),
    2,
  );
  return names || BEGINNER_ONBOARDING.advanceDetail;
}

function buildOpts(profile: Profile, mode: Mode): BuildOptions & { mode: Mode } {
  return {
    mode,
    stage: profile.program_stage,
    state: profile.exercise_state ?? {},
    kind: 'split',
    splitDay: 'upper',
  };
}

function extraRoutineRows(
  profile: Profile,
  mode: Mode,
  showGlutes: boolean,
): ScheduleProgramRow[] {
  const extras: Exclude<WorkoutRoutine, 'main'>[] = showGlutes
    ? ['skills', 'glutes', 'mobility', 'conditioning']
    : ['skills', 'mobility', 'conditioning'];
  const opts = buildOpts(profile, mode);

  return extras.map((id) => {
    const { title } = ROUTINE_LABELS[id];
    const names = joinNames(buildRoutineWorkout(id, opts).map((it) => it.name), 8);
    return { kind: 'block' as const, title, sub: names };
  });
}

function modeProgramCard(profile: Profile, mode: Mode, showGlutes: boolean): ScheduleModeProgramCard {
  const opts = buildOpts(profile, mode);
  const stage = profile.program_stage;
  const rows: ScheduleProgramRow[] = [];

  rows.push({
    kind: 'beginner',
    sub: beginnerSubline(stage, mode),
  });

  if (mode === 'gym') {
    const fullItems = buildWorkout({
      ...opts,
      kind: 'full',
      stage: stage === 'standard' ? 'standard' : stage,
    });
    rows.push({
      kind: 'block',
      title: 'Full body',
      sub: joinNames(fullItems.map((it) => it.name), 12),
    });
  }

  for (const day of SPLIT_DAY_ORDER) {
    const split = describeSplitDay(mode, day);
    rows.push({
      kind: 'block',
      title: split.label,
      sub: joinNames(split.exercises, 12),
    });
  }

  rows.push(...extraRoutineRows(profile, mode, showGlutes));

  return {
    mode,
    heading: mode === 'home' ? 'Home Gym' : 'Gym',
    rows,
  };
}

/** Reference program lists for Schedule (llplay) — live exercise names, no placeholders. */
export function buildScheduleProgramOverview(
  profile: Profile,
  userId?: string,
): { home: ScheduleModeProgramCard; gym: ScheduleModeProgramCard } {
  const showGlutes = canShowGluteRoutine(userId);
  return {
    home: modeProgramCard(profile, 'home', showGlutes),
    gym: modeProgramCard(profile, 'gym', showGlutes),
  };
}

export {
  SPLIT_DAY_ORDER,
  nextSplitDay,
  SPLIT_DAY_LABEL,
  splitDaySuggestion,
  suggestedSplitDay,
  BEGINNER_ONBOARDING,
} from './workouts';

/** Schedule — how TRAIN options fit the week (prose, not a menu list). */
export const SCHEDULE_TRAIN_LEAD =
  'Muscle grows when you train consistently, eat enough protein, and slowly do a bit more — heavier, harder, or more reps with the same form. Hit your Main sessions, progress when sets feel solid, and use rest or lighter days when recovery lags instead of maxing out every time.';

/** LL PLAY Details — Schedule tab general block (Figma 1898:5830). */
export const SCHEDULE_GENERAL_LEAD =
  'Random hard days don’t build muscle — repeated overload on the basics does. Protect recovery and protein first, then show up for Main and add weight or difficulty only when your logged sets say you’re ready.';

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
    'TRAIN → Skills, Mobility, or easy Conditioning still count as showing up without hammering the same muscles.',
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
