// Placeholder pixel avatar. Real Nanobanan sprites get swapped in at Phase 5
// behind this same single-tier interface (spec section 3, generation spec).
//
// v1 rendering decision (spec section 3): the avatar is ONE combined sprite per
// side driven by a SINGLE derived physique tier. Upper/lower stay split in the
// levelling data only — never drawn as independent body halves.

interface AvatarProps {
  /** The single derived physique tier (see derivePhysiqueTier). */
  tier: number;
  side: 'left' | 'right';
  flexing?: boolean;
  /** Equipped set has gone rusty after a lapse (spec section 9) — dull it. */
  rusty?: boolean;
}

/**
 * Collapse the separately-tracked upper/lower levelling tiers into the one
 * physique tier the sprite is rendered from. Using the lower of the two keeps a
 * skipped leg day honest (it holds the whole physique back) without drawing the
 * body as two independent halves.
 */
export function derivePhysiqueTier(upperTier: number, lowerTier: number): number {
  return Math.max(1, Math.min(10, Math.min(upperTier, lowerTier)));
}

const PALETTE = {
  skin: '#b9876a',
  skinShade: '#8f6149',
  shirt: '#5a6168',
  shirtShade: '#3f454b',
  pants: '#39414b',
  pantsShade: '#272d34',
  shoe: '#23262b',
  outline: '#0b0d10',
};

export function Avatar({ tier, side, flexing, rusty }: AvatarProps) {
  // One derived physique tier (1..10) drives the whole silhouette.
  const t = Math.max(1, Math.min(10, tier));
  const shoulder = 22 + t * 3.2;
  const arm = 6 + t * 1.1;
  const thigh = 9 + t * 1.0;
  const cx = 60;

  // Rust is a visual treatment over the (here: whole placeholder) avatar, never
  // a separate asset — desaturate + dull. Flex glow is suppressed while rusty.
  const filter = [
    rusty ? 'grayscale(0.85) brightness(0.7) sepia(0.35)' : '',
    flexing && !rusty ? 'drop-shadow(0 0 10px rgba(232,160,75,0.5))' : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <svg
      viewBox="0 0 120 200"
      width="100%"
      height="100%"
      shapeRendering="crispEdges"
      style={{
        imageRendering: 'pixelated',
        transform: side === 'right' ? 'scaleX(-1)' : undefined,
        filter,
        opacity: rusty ? 0.85 : 1,
        transition: 'all 0.3s ease',
      }}
    >
      {/* ground shadow */}
      <ellipse cx={cx} cy={192} rx={shoulder * 0.9} ry={6} fill="#000" opacity="0.35" />

      {/* legs */}
      <rect x={cx - thigh - 2} y={120} width={thigh} height={58} fill={PALETTE.pants} stroke={PALETTE.outline} strokeWidth="2" />
      <rect x={cx + 2} y={120} width={thigh} height={58} fill={PALETTE.pantsShade} stroke={PALETTE.outline} strokeWidth="2" />
      {/* shoes */}
      <rect x={cx - thigh - 4} y={176} width={thigh + 4} height={10} fill={PALETTE.shoe} stroke={PALETTE.outline} strokeWidth="2" />
      <rect x={cx} y={176} width={thigh + 4} height={10} fill={PALETTE.shoe} stroke={PALETTE.outline} strokeWidth="2" />

      {/* torso */}
      <rect
        x={cx - shoulder / 2}
        y={70}
        width={shoulder}
        height={52}
        rx="3"
        fill={PALETTE.shirt}
        stroke={PALETTE.outline}
        strokeWidth="2"
      />
      {/* torso shade */}
      <rect x={cx} y={70} width={shoulder / 2} height={52} fill={PALETTE.shirtShade} opacity="0.5" />

      {/* arms */}
      <rect
        x={cx - shoulder / 2 - arm}
        y={flexing ? 58 : 72}
        width={arm}
        height={flexing ? 40 : 50}
        rx="3"
        fill={PALETTE.skin}
        stroke={PALETTE.outline}
        strokeWidth="2"
      />
      <rect
        x={cx + shoulder / 2}
        y={72}
        width={arm}
        height={50}
        rx="3"
        fill={PALETTE.skinShade}
        stroke={PALETTE.outline}
        strokeWidth="2"
      />

      {/* neck + head */}
      <rect x={cx - 6} y={58} width={12} height={12} fill={PALETTE.skinShade} stroke={PALETTE.outline} strokeWidth="2" />
      <rect x={cx - 13} y={30} width={26} height={30} rx="4" fill={PALETTE.skin} stroke={PALETTE.outline} strokeWidth="2" />
      {/* hair */}
      <rect x={cx - 13} y={28} width={26} height={9} fill={PALETTE.outline} />
    </svg>
  );
}
