/**
 * Curated form cues + embeddable YouTube demos (external content; IDs are
 * instructional references, not hosted by Gymbros).
 */

export interface ExerciseMedia {
  /** YouTube video ID for iframe embed (youtube-nocookie.com/embed/{id}). */
  youtubeVideoId?: string;
  /** Fallback when no embed ID is set. */
  watchUrl?: string;
  tips: string[];
  /** Shown under the video in small type. */
  credit?: string;
}

const DEFAULT: ExerciseMedia = {
  tips: ['Move with control — quality beats sloppy reps.', 'Stop the set before form breaks down.'],
  watchUrl: 'https://www.youtube.com/results?search_query=exercise+form+tutorial',
};

/** Per-exercise defaults; optional rung name → override for that variation. */
const MEDIA: Record<string, ExerciseMedia & { rungs?: Record<string, Partial<ExerciseMedia>> }> = {
  pullup: {
    youtubeVideoId: 'eGo4IYlbE5g',
    credit: 'Demo: Calisthenicmovement (YouTube)',
    tips: [
      'Start from a dead hang — shoulders packed, ribs down.',
      'Pull elbows toward your hips; chin over the bar without craning the neck.',
      'Lower under control to full extension each rep.',
    ],
  },
  pike_pushup: {
    youtubeVideoId: '0mdSHXsgj4Y',
    credit: 'Demo: Calisthenicmovement (YouTube)',
    tips: [
      'Hips high, head between arms — think inverted V.',
      'Elbows track back, not flared wide.',
      'Only go as deep as you can press back up with control.',
    ],
  },
  inverted_row: {
    youtubeVideoId: '9fItzuh9Iok',
    credit: 'Demo: Calisthenicmovement (YouTube)',
    tips: [
      'Body straight from heels to shoulders — no sagging hips.',
      'Pull chest to the bar; squeeze shoulder blades at the top.',
      'Adjust foot position to match the prescribed difficulty.',
    ],
  },
  pushup: {
    youtubeVideoId: 'IODxDxX7oi4',
    credit: 'Demo: Calisthenicmovement (YouTube)',
    tips: [
      'Hands under shoulders, core tight, glutes engaged.',
      'Lower until chest nearly touches — elbows ~45° from torso.',
      'Full lockout at the top without losing a straight line.',
    ],
  },
  front_lever: {
    youtubeVideoId: 'uA0jySD4R8k',
    credit: 'Demo: THENX — front lever progressions (YouTube)',
    tips: [
      'Depress and protract shoulders — push the bar away from you.',
      'Posterior pelvic tilt; keep body rigid like a board.',
      'Use the rung on your ladder — don’t jump ahead of what you can hold cleanly.',
    ],
  },
  dip: {
    youtubeVideoId: 'yN6Q1UI_xkE',
    credit: 'Demo: Calisthenicmovement (YouTube)',
    tips: [
      'Shoulders down and back before you descend.',
      'Elbows back, not straight out — depth where you can press out safely.',
      'Stop if you feel sharp shoulder pain — reset or use an easier rung.',
    ],
  },
  handstand: {
    youtubeVideoId: '_gntsmIZvbI',
    credit: 'Demo: THENX — handstand hold progressions (YouTube)',
    tips: [
      'Stack wrists, shoulders, hips — squeeze glutes and quads.',
      'Look at the floor between your hands; balance with fingers.',
      'Bail safely (cartwheel out) if you lose control.',
    ],
  },
  lsit: {
    youtubeVideoId: '16a529mtX68',
    credit: 'Demo: GMB — L-sit progressions (YouTube)',
    tips: [
      'Push the floor away; depress shoulders hard.',
      'Point toes, legs tight — hollow body, not relaxed pike.',
      'Start with tucked L if full L collapses your posture.',
    ],
  },
  hollow: {
    youtubeVideoId: 'LlDNef_Ztsc',
    credit: 'Demo: hollow body hold progression (YouTube)',
    tips: [
      'Low back glued to the floor — if it arches, shorten the lever.',
      'Ribs down, chin slightly tucked.',
      'Breathe shallow; don’t hold breath until you’re dizzy.',
    ],
  },
  pistol: {
    youtubeVideoId: 'vq5-vdgJc0I',
    credit: 'Demo: pistol squat progressions (YouTube)',
    tips: [
      'Sit back on the working leg; opposite leg forward for counterbalance.',
      'Keep heel down; knee tracks over mid-foot.',
      'Use assistance (doorframe, box) until you own the full ROM.',
    ],
  },
  nordic: {
    youtubeVideoId: 'NZ31eKoPeIo',
    credit: 'Demo: Nordic curl (YouTube)',
    tips: [
      'Anchor feet securely; body straight from knees to head.',
      'Lower as slowly as possible — catch with hands if needed at first.',
      'Hips extended — don’t break at the waist.',
    ],
  },
  hanging: {
    youtubeVideoId: '0HBhuaD_S7M',
    credit: 'Demo: dead hang / decompression (YouTube)',
    tips: [
      'Relax grip slightly between sets if forearms pump up.',
      'Let shoulders rise naturally on a passive hang; active hang if prescribed.',
      'Step down — don’t drop from height.',
    ],
  },
  lat_pulldown: {
    youtubeVideoId: 'CAwf7n6Luuc',
    credit: 'Demo: lat pulldown form (YouTube)',
    tips: [
      'Chest up, slight lean back; pull bar to upper chest.',
      'Drive elbows down and back — feel lats, not just arms.',
      'Control the return; don’t let the stack slam.',
    ],
  },
  shoulder_press: {
    youtubeVideoId: 'B-aVuyhvLHU',
    credit: 'Demo: overhead press (YouTube)',
    tips: [
      'Ribs down, glutes tight — no excessive back arch.',
      'Bar path close to face; lock out over mid-foot.',
      'Warm up lighter sets before working weight.',
    ],
  },
  cable_row: {
    youtubeVideoId: 'GZbfZ033f74',
    credit: 'Demo: seated cable row (YouTube)',
    tips: [
      'Sit tall; don’t round then yank with low back.',
      'Pull to lower ribs; squeeze shoulder blades together.',
      'Full stretch at the start without rolling shoulders forward.',
    ],
  },
  bench_press: {
    youtubeVideoId: 'rT7DgCr-3pg',
    credit: 'Demo: bench press setup (YouTube)',
    tips: [
      'Feet planted, shoulder blades pinched into the bench.',
      'Bar to mid-chest; elbows ~45° — not flared 90°.',
      'Use safeties or a spotter at limit weights.',
    ],
  },
  db_high_pull: {
    youtubeVideoId: 'Li4g5p6s2eM',
    credit: 'Demo: high pull (KB; same hip-drive pull as DB high pull)',
    tips: [
      'Lead with elbows; wrists relaxed — not a shrug-only motion.',
      'Keep bar/dumbbells close to the body.',
      'Use a weight you can control without shrugging into your ears.',
    ],
  },
  weighted_dip: {
    youtubeVideoId: 'yN6Q1UI_xkE',
    credit: 'Demo: dip form (YouTube)',
    tips: [
      'Same dip form as bodyweight — added load demands tighter core.',
      'Start light when adding weight; full ROM you can own.',
      'Stop if shoulders feel impinged at the bottom.',
    ],
  },
  deadlift: {
    youtubeVideoId: 'ytGaGIn3SjE',
    credit: 'Demo: deadlift form (YouTube)',
    tips: [
      'Bar over mid-foot; shins to bar, hips not squat-low.',
      'Lats tight — “protect your armpits”.',
      'Push the floor away; lock hips and knees together at the top.',
    ],
  },
  glute_bridge: {
    tips: [
      'Ribs down — don’t hyperextend the lower back at the top.',
      'Drive through heels; pause 1 s at full hip extension.',
      'Add load with vest, backpack, or barbell when bodyweight is easy.',
    ],
  },
  single_leg_rdl: {
    tips: [
      'Soft knee on the working leg; hinge until hamstring tension, not pain.',
      'Hips stay square — imagine a glass of water on your lower back.',
      'Use a wall or rack for balance if needed.',
    ],
  },
  step_up_glute: {
    tips: [
      'Lean slightly forward — think “drive through the top foot’s heel”.',
      'Control the descent; don’t bounce off the floor leg.',
      'Box height: knee roughly 90° at the top.',
    ],
  },
  quadruped_kickback: {
    tips: [
      'Keep core braced — don’t arch the back as the leg extends.',
      'Squeeze glute at the top; slow return.',
      'Band: anchor low, kick back in line with the hip.',
    ],
  },
  side_hip_abduction: {
    tips: [
      'Small range, glute doing the work — not rocking the pelvis.',
      'Clamshell: feet stay together, open at the knee.',
      'Band above knees for lateral walks between sets if you want extra volume.',
    ],
  },
  hip_thrust: {
    tips: [
      'Upper back on bench; chin tucked at lockout.',
      'Shins vertical at the top; pause and squeeze.',
      'Progress load when you hit the top of the rep range on all sets.',
    ],
  },
  romanian_deadlift: {
    tips: [
      'Hinge — bar stays close; feel stretch in hamstrings.',
      'Slight knee bend, fixed throughout the set.',
      'Stop before lower back rounds.',
    ],
  },
  cable_kickback: {
    tips: [
      'Stand tall; kick back without rotating the hips open.',
      'Full extension, controlled return — no swinging.',
    ],
  },
  hip_abduction_machine: {
    tips: [
      'Sit neutral; press knees out through the pads.',
      'Control the return — don’t let the weight slam.',
    ],
  },
  jump_rope: {
    tips: [
      'Stay on the balls of your feet — small, quiet hops.',
      'Elbows in, wrists turn the rope; keep shoulders relaxed.',
      'Easy pace only before strength — you should feel warm, not smoked.',
    ],
  },
  norwegian_4x4: {
    tips: [
      'Hard = ~85–95% max HR: heavy breathing but form stays controlled.',
      'Take the full ~3 min easy between intervals — walk or very light spin.',
      'Run, row, bike, or incline walk work best; rope is OK for fitness but hard to hold true 4×4 on rope alone.',
    ],
  },
};

export function resolveExerciseMedia(exerciseId: string, rungName?: string): ExerciseMedia {
  const entry = MEDIA[exerciseId];
  if (!entry) return DEFAULT;

  const rungPatch = rungName && entry.rungs?.[rungName];
  const base: ExerciseMedia = {
    youtubeVideoId: entry.youtubeVideoId,
    watchUrl: entry.watchUrl,
    tips: entry.tips,
    credit: entry.credit,
  };

  if (!rungPatch) return base;

  return {
    ...base,
    ...rungPatch,
    tips: rungPatch.tips ?? base.tips,
  };
}

export const VIDEO_POSTER_FALLBACK = '/ui/video-poster-fallback.svg';

/** Local fallback when YouTube has no real thumbnail (404 still returns a 120×90 grey JPEG). */
export function isYoutubePlaceholderPoster(naturalWidth: number, naturalHeight: number): boolean {
  return naturalWidth > 0 && naturalWidth <= 120 && naturalHeight <= 90;
}

export function youtubePosterUrl(videoId: string, quality: 'maxres' | 'hq' | 'sd' = 'hq'): string {
  const file = quality === 'maxres' ? 'maxresdefault.jpg' : quality === 'sd' ? 'sddefault.jpg' : 'hqdefault.jpg';
  return `https://img.youtube.com/vi/${videoId}/${file}`;
}
