// Placeholder pixel avatar. Real Nanobanan sprites get swapped in at Phase 5
// (spec section 3). Shoulder/arm width scales with upper tier; legs with lower
// tier, so a skipped leg day is immediately visible.

interface AvatarProps {
  upperTier: number;
  lowerTier: number;
  side: 'left' | 'right';
  flexing?: boolean;
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

export function Avatar({ upperTier, lowerTier, side, flexing }: AvatarProps) {
  // 1..10 tiers -> growth factors
  const u = Math.max(1, Math.min(10, upperTier));
  const l = Math.max(1, Math.min(10, lowerTier));
  const shoulder = 22 + u * 3.2;
  const arm = 6 + u * 1.1;
  const thigh = 9 + l * 1.0;
  const cx = 60;

  return (
    <svg
      viewBox="0 0 120 200"
      width="100%"
      height="100%"
      shapeRendering="crispEdges"
      style={{
        imageRendering: 'pixelated',
        transform: side === 'right' ? 'scaleX(-1)' : undefined,
        filter: flexing ? 'drop-shadow(0 0 10px rgba(232,160,75,0.5))' : undefined,
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
