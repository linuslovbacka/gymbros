// Pro Mode escalating header (spec section 7). Press only goes up, never down.
// The fixed sequence stays grounded then tips into chaos around level 5; past the
// end of the list it keeps escalating with generated nonsense.

export const PRO_MODE_LABELS: string[] = [
  'GYM BROS',
  'PRO BROS',
  'ULTRA BROS',
  'BEAST BROS',
  'MONSTER BROS',
  'UNCHAINED BROS',
  'TRANSCENDENT BROS',
  'GODS FEAR YOU',
  'REALITY BENDING',
  'THE GYM IS INSIDE YOU NOW',
];

const OVERFLOW_PREFIXES = [
  'POST-HUMAN',
  'GALAXY-CORE',
  'TIME-DESTROYER',
  'OMNIVERSAL',
  'CONCEPT-OF-A',
  'FORBIDDEN',
  'UNSPEAKABLE',
  'LAW-OF-PHYSICS-VIOLATING',
];

/** Header text for a given press level (0-indexed). */
export function proModeLabel(level: number): string {
  if (level < PRO_MODE_LABELS.length) return PRO_MODE_LABELS[level];
  const overflow = level - PRO_MODE_LABELS.length;
  const prefix = OVERFLOW_PREFIXES[overflow % OVERFLOW_PREFIXES.length];
  const cycle = Math.floor(overflow / OVERFLOW_PREFIXES.length) + 1;
  return cycle > 1 ? `${prefix} BROS x${cycle}` : `${prefix} BROS`;
}

/** Chaos styling kicks in at "UNCHAINED BROS" (spec section 7). */
export function isChaos(level: number): boolean {
  return level >= 5;
}
