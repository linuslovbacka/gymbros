import type { Exercise, Rung } from './types';

// Compact rung builder. low/high are reps, or seconds when `timed`.
function r(
  name: string,
  prescription: string,
  low: number,
  high: number,
  ironMultiplier: number,
  opts: { timed?: boolean; perSide?: boolean; sets?: number } = {},
): Rung {
  return {
    name,
    sets: opts.sets ?? 3,
    prescription,
    low,
    high,
    ironMultiplier,
    timed: opts.timed,
    perSide: opts.perSide,
  };
}

// ─── Calisthenics ladders (spec section 6) ──────────────────────────────────

const pullUp: Exercise = {
  id: 'pullup',
  name: 'Pull-up',
  track: 'calisthenics',
  body: 'upper',
  category: 'Home: Up Pull',
  ladder: [
    r('Dead hang', '3 x 30 s', 30, 30, 0.5, { timed: true }),
    r('Scapular pull-up', '3 x 8-12', 8, 12, 0.7),
    r('Band pull-up (thick)', '3 x 6-10', 6, 10, 1.0),
    r('Band pull-up (medium)', '3 x 8-12', 8, 12, 1.2),
    r('Band pull-up (light)', '3 x 8-12', 8, 12, 1.4),
    r('Eccentric pull-up (5 s negatives)', '3 x 3-6', 3, 6, 1.6),
    r('Negative + jump', '3 x 5-8', 5, 8, 1.8),
    r('Full pull-up', '3 x 3-8', 3, 8, 2.0),
    r('Full pull-up', '3 x 8-15', 8, 15, 2.3),
    r('Weighted +5 kg', '3 x 5-10', 5, 10, 2.8),
    r('Weighted +10 kg', '3 x 5-10', 5, 10, 3.5),
    r('Weighted +20 kg', '3 x 3-8', 3, 8, 4.5),
    r('Archer pull-up', '3 x 3-6 each', 3, 6, 5.0, { perSide: true }),
    r('Typewriter pull-up', '3 x 3-6', 3, 6, 5.5),
    r('Assisted one-arm', '3 x 2-4 each', 2, 4, 6.5, { perSide: true }),
    r('One-arm pull-up', '3 x 1-3 each', 1, 3, 8.0, { perSide: true }),
  ],
};

const pikePushup: Exercise = {
  id: 'pike_pushup',
  name: 'Pike push-up -> HSPU',
  track: 'calisthenics',
  body: 'upper',
  category: 'Home: Up Push',
  ladder: [
    r('Pike hold', '3 x 20 s', 20, 20, 0.8, { timed: true }),
    r('Pike push-up (feet on floor)', '3 x 5-10', 5, 10, 1.2),
    r('Elevated pike push-up (feet on box)', '3 x 5-10', 5, 10, 1.5),
    r('Wall handstand hold', '3 x 30 s', 30, 30, 1.7, { timed: true }),
    r('Wall HSPU (partial ROM)', '3 x 3-6', 3, 6, 2.5),
    r('Wall HSPU (full ROM)', '3 x 3-8', 3, 8, 3.0),
    r('Wall HSPU (deficit, parallettes)', '3 x 3-6', 3, 6, 3.5),
    r('Freestanding HSPU progression', '3 x 1-3', 1, 3, 5.0),
  ],
};

const invertedRow: Exercise = {
  id: 'inverted_row',
  name: 'Inverted row',
  track: 'calisthenics',
  body: 'upper',
  category: 'Home: Forward Pull',
  ladder: [
    r('Incline inverted row (high)', '3 x 8-15', 8, 15, 0.6),
    r('Inverted row (parallel to floor)', '3 x 8-15', 8, 15, 1.0),
    r('Inverted row', '3 x 15-20', 15, 20, 1.2),
    r('Feet-elevated inverted row', '3 x 8-15', 8, 15, 1.5),
    r('Archer inverted row', '3 x 5-10 each', 5, 10, 2.0, { perSide: true }),
    r('One-arm inverted row', '3 x 3-8 each', 3, 8, 3.0, { perSide: true }),
    r('Front lever row progression', '3 x 3-6', 3, 6, 4.0),
  ],
};

const pushup: Exercise = {
  id: 'pushup',
  name: 'Push-up',
  track: 'calisthenics',
  body: 'upper',
  category: 'Home: Forward Push',
  ladder: [
    r('Incline push-up (high)', '3 x 8-15', 8, 15, 0.7),
    r('Incline push-up (low)', '3 x 8-15', 8, 15, 0.9),
    r('Push-up', '3 x 8-15', 8, 15, 1.0),
    r('Push-up', '3 x 15-25', 15, 25, 1.2),
    r('Rings push-up', '3 x 8-15', 8, 15, 1.5),
    r('Diamond push-up', '3 x 8-15', 8, 15, 1.5),
    r('Archer push-up', '3 x 5-10 each', 5, 10, 2.0, { perSide: true }),
    r('Pseudo planche push-up', '3 x 5-10', 5, 10, 2.5),
    r('One-arm push-up', '3 x 3-8 each', 3, 8, 3.5, { perSide: true }),
    r('Planche push-up progression', '3 x 1-3', 1, 3, 4.5),
  ],
};

const frontLever: Exercise = {
  id: 'front_lever',
  name: 'Front lever',
  track: 'calisthenics',
  body: 'upper',
  category: 'Home: Down Pull',
  ladder: [
    r('Tuck front lever', '3 x 10 s', 10, 10, 1.5, { timed: true }),
    r('Tuck front lever', '3 x 20 s', 20, 20, 1.8, { timed: true }),
    r('Advanced tuck (back flat)', '3 x 10 s', 10, 10, 2.5, { timed: true }),
    r('Advanced tuck', '3 x 20 s', 20, 20, 3.0, { timed: true }),
    r('Single-leg front lever', '3 x 10 s each', 10, 10, 4.0, { timed: true, perSide: true }),
    r('Straddle front lever', '3 x 5 s', 5, 5, 5.0, { timed: true }),
    r('Straddle front lever', '3 x 15 s', 15, 15, 6.0, { timed: true }),
    r('Full front lever', '3 x 5 s', 5, 5, 7.5, { timed: true }),
    r('Full front lever', '3 x 15 s', 15, 15, 9.0, { timed: true }),
    r('Front lever pull-up', '3 x 1-3', 1, 3, 10.0),
  ],
};

const dip: Exercise = {
  id: 'dip',
  name: 'Dip',
  track: 'calisthenics',
  body: 'upper',
  category: 'Home: Down Push',
  ladder: [
    r('Bench dip', '3 x 8-15', 8, 15, 0.6),
    r('Negative dip (3 s lower)', '3 x 3-6', 3, 6, 0.9),
    r('Band-assisted dip', '3 x 5-10', 5, 10, 1.2),
    r('Parallel bar dip', '3 x 5-10', 5, 10, 1.5),
    r('Parallel bar dip', '3 x 10-20', 10, 20, 1.8),
    r('Ring dip (turned in)', '3 x 5-10', 5, 10, 2.2),
    r('Ring dip (RTO)', '3 x 5-10', 5, 10, 2.8),
    r('Weighted +5 kg', '3 x 5-10', 5, 10, 2.5),
    r('Weighted +10 kg', '3 x 5-10', 5, 10, 3.2),
    r('Weighted +20 kg', '3 x 5-8', 5, 8, 4.2),
    r('Bulgarian dip', '3 x 3-6', 3, 6, 4.5),
    r('Korean dip', '3 x 3-6', 3, 6, 5.0),
  ],
};

const handstand: Exercise = {
  id: 'handstand',
  name: 'Handstand progression',
  track: 'calisthenics',
  body: 'skill',
  category: 'Skill',
  ladder: [
    r('Wall plank (face away)', '3 x 30 s', 30, 30, 1.0, { timed: true }),
    r('Wall handstand (back to wall)', '3 x 20-30 s', 20, 30, 1.5, { timed: true }),
    r('Wall handstand (chest to wall)', '3 x 30-60 s', 30, 60, 2.0, { timed: true }),
    r('Wall HS shoulder taps', '3 x 6-10 each', 6, 10, 2.5, { perSide: true }),
    r('Freestanding kick-up attempts', '5 x 30 s', 30, 30, 3.0, { timed: true, sets: 5 }),
    r('Freestanding handstand', '3 x 5-10 s', 5, 10, 4.0, { timed: true }),
    r('Freestanding handstand', '3 x 20-30 s', 20, 30, 5.5, { timed: true }),
    r('Press handstand progression', '3 x 1-3', 1, 3, 7.0),
  ],
};

const lsit: Exercise = {
  id: 'lsit',
  name: 'L-sit / V-sit',
  track: 'calisthenics',
  body: 'core',
  category: 'Core',
  ladder: [
    r('Tuck L-sit on floor', '3 x 10 s', 10, 10, 0.8, { timed: true }),
    r('Tuck L-sit on parallettes', '3 x 15-20 s', 15, 20, 1.0, { timed: true }),
    r('One-leg extended L-sit', '3 x 10 s each', 10, 10, 1.5, { timed: true, perSide: true }),
    r('L-sit (legs straight)', '3 x 10 s', 10, 10, 2.0, { timed: true }),
    r('L-sit', '3 x 20-30 s', 20, 30, 2.5, { timed: true }),
    r('V-sit progression', '3 x 5-10 s', 5, 10, 3.5, { timed: true }),
    r('Manna progression', '3 x 3-10 s', 3, 10, 5.0, { timed: true }),
  ],
};

const hollow: Exercise = {
  id: 'hollow',
  name: 'Hollow body hold',
  track: 'calisthenics',
  body: 'core',
  category: 'Core',
  ladder: [
    r('Tuck hollow hold', '3 x 20 s', 20, 20, 0.5, { timed: true }),
    r('One-leg hollow hold', '3 x 20 s each', 20, 20, 0.7, { timed: true, perSide: true }),
    r('Hollow hold (knees bent)', '3 x 30 s', 30, 30, 1.0, { timed: true }),
    r('Full hollow hold', '3 x 30 s', 30, 30, 1.5, { timed: true }),
    r('Full hollow hold', '3 x 60 s', 60, 60, 2.0, { timed: true }),
    r('Hollow rocks', '3 x 20', 20, 20, 2.0),
    r('Weighted hollow hold', '3 x 30 s', 30, 30, 2.5, { timed: true }),
  ],
};

const pistol: Exercise = {
  id: 'pistol',
  name: 'Pistol squat',
  track: 'calisthenics',
  body: 'lower',
  category: 'Legs',
  ladder: [
    r('Assisted pistol (TRX/rings)', '3 x 5-8 each', 5, 8, 1.0, { perSide: true }),
    r('Box pistol (high box)', '3 x 5-8 each', 5, 8, 1.5, { perSide: true }),
    r('Box pistol (low box)', '3 x 5-8 each', 5, 8, 2.0, { perSide: true }),
    r('Counterweighted pistol', '3 x 3-6 each', 3, 6, 2.5, { perSide: true }),
    r('Full pistol squat', '3 x 3-8 each', 3, 8, 3.0, { perSide: true }),
    r('Pistol', '3 x 8-12 each', 8, 12, 3.5, { perSide: true }),
    r('Weighted pistol +5 kg', '3 x 5 each', 5, 5, 4.0, { perSide: true }),
    r('Weighted pistol +10 kg', '3 x 3-5 each', 3, 5, 4.5, { perSide: true }),
    r('Shrimp squat progression', '3 x 3-6 each', 3, 6, 5.0, { perSide: true }),
  ],
};

const nordic: Exercise = {
  id: 'nordic',
  name: 'Nordic curl',
  track: 'calisthenics',
  body: 'lower',
  category: 'Legs',
  ladder: [
    r('Assisted Nordic (heavy band)', '3 x 3-6', 3, 6, 1.5),
    r('Assisted Nordic (medium band)', '3 x 3-6', 3, 6, 2.0),
    r('Negative-only Nordic (3 s)', '3 x 3-5', 3, 5, 2.5),
    r('Negative Nordic (5 s)', '3 x 3-5', 3, 5, 3.0),
    r('Negative + small push-back', '3 x 3-5', 3, 5, 3.5),
    r('Full Nordic curl', '3 x 3-6', 3, 6, 4.5),
    r('Weighted Nordic', '3 x 3-6', 3, 6, 5.5),
  ],
};

const hanging: Exercise = {
  id: 'hanging',
  name: 'Hanging (decompression)',
  track: 'calisthenics',
  body: 'upper',
  category: 'Decompression',
  ladder: [
    r('Passive hang (feet assisted)', '3 x 20 s', 20, 20, 0.3, { timed: true }),
    r('Dead hang', '3 x 30 s', 30, 30, 0.5, { timed: true }),
    r('Dead hang', '3 x 60 s', 60, 60, 0.7, { timed: true }),
    r('Active hang', '3 x 30 s', 30, 30, 0.9, { timed: true }),
    r('One-arm assisted hang', '3 x 20 s each', 20, 20, 1.5, { timed: true, perSide: true }),
  ],
};

// ─── Gym lifts (pure weight progression, spec section 6 bottom) ──────────────

function gymLift(
  id: string,
  name: string,
  category: string,
  body: 'upper' | 'lower',
  scheme: 'compound' | 'isolation',
  startKg: number,
): Exercise {
  const isCompound = scheme === 'compound';
  return {
    id,
    name,
    track: 'gym',
    body,
    category,
    ladder: [],
    weight: {
      low: isCompound ? 5 : 8,
      high: isCompound ? 10 : 12,
      incrementKg: isCompound ? 5 : 2.5,
      startKg,
    },
  };
}

const latPulldown = gymLift('lat_pulldown', 'Lat pulldown', 'Gym: Up Pull', 'upper', 'compound', 30);
const shoulderPress = gymLift('shoulder_press', 'Shoulder press', 'Gym: Up Push', 'upper', 'compound', 20);
const cableRow = gymLift('cable_row', 'Cable row', 'Gym: Forward Pull', 'upper', 'compound', 30);
const benchPress = gymLift('bench_press', 'Bench press', 'Gym: Forward Push', 'upper', 'compound', 30);
const dbHighPull = gymLift('db_high_pull', 'DB high pull', 'Gym: Down Pull', 'upper', 'isolation', 10);
const weightedDipGym = gymLift('weighted_dip', 'Weighted dip', 'Gym: Down Push', 'upper', 'compound', 0);
const deadlift = gymLift('deadlift', 'Deadlift', 'Gym: Legs', 'lower', 'compound', 40);

// ─── Glute / accessory (home + gym templates) ───────────────────────────────

const gluteBridge: Exercise = {
  id: 'glute_bridge',
  name: 'Glute bridge / hip thrust (floor)',
  track: 'calisthenics',
  body: 'lower',
  category: 'Glutes: Home',
  ladder: [
    r('Bodyweight bridge', '4 x 12-15', 12, 15, 1.0),
    r('Single-leg bridge', '4 x 8-12 each', 8, 12, 1.4, { perSide: true }),
    r('Feet-elevated bridge', '4 x 10-15', 10, 15, 1.6),
    r('Weighted (vest / backpack)', '4 x 8-12', 8, 12, 2.0),
    r('Shoulders on bench — hip thrust', '4 x 8-12', 8, 12, 2.5),
  ],
};

const singleLegRdl: Exercise = {
  id: 'single_leg_rdl',
  name: 'Single-leg RDL',
  track: 'calisthenics',
  body: 'lower',
  category: 'Glutes: Home',
  ladder: [
    r('Bodyweight — reach to shin', '3 x 8-10 each', 8, 10, 1.2, { perSide: true }),
    r('DB / KB / backpack', '3 x 6-10 each', 6, 10, 1.8, { perSide: true }),
    r('Heavy DB / KB', '3 x 6-8 each', 6, 8, 2.2, { perSide: true }),
  ],
};

const stepUpGlute: Exercise = {
  id: 'step_up_glute',
  name: 'Glute-bias step-up',
  track: 'calisthenics',
  body: 'lower',
  category: 'Glutes',
  ladder: [
    r('Low box — bodyweight', '3 x 8-10 each', 8, 10, 1.2, { perSide: true }),
    r('High box — slow eccentric', '3 x 6-10 each', 6, 10, 1.6, { perSide: true }),
    r('Weighted vest / DB goblet', '3 x 6-8 each', 6, 8, 2.0, { perSide: true }),
  ],
};

const quadrupedKickback: Exercise = {
  id: 'quadruped_kickback',
  name: 'Quadruped / band kickback',
  track: 'calisthenics',
  body: 'lower',
  category: 'Glutes: Home',
  ladder: [
    r('Quadruped kickback', '3 x 12-15 each', 12, 15, 0.9, { perSide: true }),
    r('Band kickback (anchored low)', '3 x 12-15 each', 12, 15, 1.2, { perSide: true }),
    r('Ankle weights / light band', '3 x 15 each', 15, 15, 1.4, { perSide: true }),
  ],
};

const sideHipAbduction: Exercise = {
  id: 'side_hip_abduction',
  name: 'Side-lying abduction / clamshell',
  track: 'calisthenics',
  body: 'lower',
  category: 'Glutes: Home',
  ladder: [
    r('Side-lying leg raise', '3 x 12-20 each', 12, 20, 0.8, { perSide: true }),
    r('Clamshell', '3 x 15-20 each', 15, 20, 1.0, { perSide: true }),
    r('Banded lateral walk + clamshell', '3 x 12-15 each', 12, 15, 1.3, { perSide: true }),
  ],
};

const jumpRope: Exercise = {
  id: 'jump_rope',
  name: 'Jump rope (warmup)',
  track: 'calisthenics',
  body: 'core',
  category: 'Warmup',
  ladder: [
    r('Easy continuous', '1 x 3-5 min', 180, 300, 0.35, { timed: true, sets: 1 }),
    r('Easy + mobility', '1 x 5 min', 240, 300, 0.4, { timed: true, sets: 1 }),
  ],
};

const norwegian4x4: Exercise = {
  id: 'norwegian_4x4',
  name: 'Norwegian 4×4 interval',
  track: 'calisthenics',
  body: 'core',
  category: 'Conditioning',
  ladder: [
    r('Hard interval', '4 x 4 min hard', 240, 240, 1.2, { timed: true, sets: 4 }),
  ],
};

const mobilityPrep: Exercise = {
  id: 'mobility_prep',
  name: 'Mobility prep',
  track: 'calisthenics',
  body: 'core',
  category: 'Mobility',
  ladder: [
    r('Cat-cow + arm circles', '1 x 90 s', 90, 90, 0.15, { timed: true, sets: 1 }),
    r('Longer prep', '1 x 120 s', 120, 120, 0.2, { timed: true, sets: 1 }),
  ],
};

const mobilityPike: Exercise = {
  id: 'mobility_pike',
  name: 'Pike stretch',
  track: 'calisthenics',
  body: 'lower',
  category: 'Mobility',
  ladder: [
    r('Standing forward fold', '1 x 45 s', 45, 45, 0.15, { timed: true, sets: 1 }),
    r('Seated pike (knees bent OK)', '1 x 60 s', 60, 60, 0.18, { timed: true, sets: 1 }),
    r('Seated pike (legs straight)', '1 x 75 s', 75, 75, 0.2, { timed: true, sets: 1 }),
  ],
};

const mobilityPancake: Exercise = {
  id: 'mobility_pancake',
  name: 'Pancake / straddle',
  track: 'calisthenics',
  body: 'lower',
  category: 'Mobility',
  ladder: [
    r('Butterfly sit', '1 x 45 s', 45, 45, 0.15, { timed: true, sets: 1 }),
    r('Wide seated straddle', '1 x 60 s', 60, 60, 0.18, { timed: true, sets: 1 }),
    r('Pancake fold', '1 x 75 s', 75, 75, 0.2, { timed: true, sets: 1 }),
  ],
};

const mobilityFrontSplit: Exercise = {
  id: 'mobility_front_split',
  name: 'Front split progression',
  track: 'calisthenics',
  body: 'lower',
  category: 'Mobility',
  ladder: [
    r('Half-kneeling hip flexor', '1 x 45 s each', 45, 45, 0.15, { timed: true, sets: 1, perSide: true }),
    r('Low lunge + blocks', '1 x 60 s each', 60, 60, 0.18, { timed: true, sets: 1, perSide: true }),
    r('Split hold (as low as clean)', '1 x 75 s each', 75, 75, 0.2, { timed: true, sets: 1, perSide: true }),
  ],
};

const mobilitySideSplit: Exercise = {
  id: 'mobility_side_split',
  name: 'Side split / straddle lean',
  track: 'calisthenics',
  body: 'lower',
  category: 'Mobility',
  ladder: [
    r('Wide stance lean', '1 x 45 s', 45, 45, 0.15, { timed: true, sets: 1 }),
    r('Supported straddle sit', '1 x 60 s', 60, 60, 0.18, { timed: true, sets: 1 }),
    r('Side split progression', '1 x 75 s', 75, 75, 0.2, { timed: true, sets: 1 }),
  ],
};

const mobilityPigeon: Exercise = {
  id: 'mobility_pigeon',
  name: 'Pigeon / figure-4',
  track: 'calisthenics',
  body: 'lower',
  category: 'Mobility',
  ladder: [
    r('Seated figure-4', '1 x 45 s each', 45, 45, 0.15, { timed: true, sets: 1, perSide: true }),
    r('Floor pigeon (shallow)', '1 x 60 s each', 60, 60, 0.18, { timed: true, sets: 1, perSide: true }),
    r('Floor pigeon (deeper)', '1 x 75 s each', 75, 75, 0.2, { timed: true, sets: 1, perSide: true }),
  ],
};

const hipThrust = gymLift('hip_thrust', 'Barbell hip thrust', 'Glutes: Gym', 'lower', 'compound', 40);
const romanianDeadlift = gymLift('romanian_deadlift', 'Romanian deadlift', 'Glutes: Gym', 'lower', 'compound', 30);
const cableKickback = gymLift('cable_kickback', 'Cable kickback', 'Glutes: Gym', 'lower', 'isolation', 5);
const hipAbductionMachine = gymLift(
  'hip_abduction_machine',
  'Hip abduction machine',
  'Glutes: Gym',
  'lower',
  'isolation',
  20,
);

export const EXERCISES: Exercise[] = [
  pullUp, pikePushup, invertedRow, pushup, frontLever, dip,
  handstand, lsit, hollow, pistol, nordic, hanging,
  jumpRope, norwegian4x4,
  mobilityPrep, mobilityPike, mobilityPancake, mobilityFrontSplit, mobilitySideSplit, mobilityPigeon,
  gluteBridge, singleLegRdl, stepUpGlute, quadrupedKickback, sideHipAbduction,
  latPulldown, shoulderPress, cableRow, benchPress, dbHighPull, weightedDipGym, deadlift,
  hipThrust, romanianDeadlift, cableKickback, hipAbductionMachine,
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export function getExercise(id: string): Exercise {
  const ex = EXERCISE_BY_ID[id];
  if (!ex) throw new Error(`Unknown exercise: ${id}`);
  return ex;
}
