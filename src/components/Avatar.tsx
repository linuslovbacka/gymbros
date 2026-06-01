// Placeholder pixel avatar. Real Nanobanan sprites get swapped in at Phase 8
// behind this same interface (spec section 3 + generation spec): when the art
// resolver returns a loadout bake we render it through SpriteAnimator; until
// then we draw a single-tier SVG silhouette and composite equipped cosmetics as
// rarity-tinted placeholder layers.
//
// v1 rendering decision (spec section 3): the avatar is ONE combined sprite per
// side driven by a SINGLE derived physique tier. Upper/lower stay split in the
// levelling data only — never drawn as independent body halves.
//
// Z-order (spec section 8): base/bake → aura → companion; Special replaces the
// whole stack and disables the normal slots.

import { getCosmetic, RARITY_COLOR, type CosmeticSlot } from '../content/cosmetics';
import type { EquipMap } from '../state/types';
import { SpriteAnimator, type AtlasMeta } from './SpriteAnimator';

interface AvatarProps {
  /** The single derived physique tier (see derivePhysiqueTier). */
  tier: number;
  side: 'left' | 'right';
  flexing?: boolean;
  /** Equipped set has gone rusty after a lapse (spec section 9) — dull it. */
  rusty?: boolean;
  /** Equipped cosmetics by slot (drawn as placeholders until Phase 8 art). */
  equipped?: EquipMap;
  /** Resolved loadout bake; when present it replaces the SVG placeholder. */
  sprite?: { imageUrl: string; atlas: AtlasMeta | null } | null;
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

/** Rarity tint for an equipped slot, or the default body colour. */
function slotColor(equipped: EquipMap | undefined, slot: CosmeticSlot, fallback: string): string {
  const slug = equipped?.[slot];
  if (!slug) return fallback;
  const c = getCosmetic(slug);
  return c ? RARITY_COLOR[c.rarity] : fallback;
}

export function Avatar({ tier, side, flexing, rusty, equipped, sprite }: AvatarProps) {
  const t = Math.max(1, Math.min(10, tier));
  const filter = [
    rusty ? 'grayscale(0.85) brightness(0.7) sepia(0.35)' : '',
    flexing && !rusty ? 'drop-shadow(0 0 10px rgba(232,160,75,0.5))' : '',
  ].filter(Boolean).join(' ') || undefined;

  // Approved loadout bake available → render it (Phase 8 path).
  if (sprite) {
    return (
      <div style={{ width: '100%', height: '100%', filter, opacity: rusty ? 0.85 : 1, transition: 'all 0.3s ease' }}>
        <SpriteAnimator imageUrl={sprite.imageUrl} atlas={sprite.atlas} clip={flexing ? 'flex' : 'idle'} flip={side === 'right'} />
      </div>
    );
  }

  const special = equipped?.special ? getCosmetic(equipped.special) : undefined;
  const specialColor = special ? RARITY_COLOR[special.rarity] : undefined;
  const auraColor = equipped?.aura ? slotColor(equipped, 'aura', '#000') : undefined;
  const hasCompanion = Boolean(equipped?.companion);

  const shoulder = 22 + t * 3.2;
  const arm = 6 + t * 1.1;
  const thigh = 9 + t * 1.0;
  const cx = 60;

  // Special = full replacement: recolour the whole silhouette and drop slot tints.
  const torso = special ? specialColor! : slotColor(equipped, 'torso', PALETTE.shirt);
  const legs = special ? specialColor! : slotColor(equipped, 'legs', PALETTE.pants);
  const shoes = special ? PALETTE.outline : slotColor(equipped, 'feet', PALETTE.shoe);
  const headGear = !special && equipped?.head ? slotColor(equipped, 'head', PALETTE.skin) : undefined;
  const handGear = !special && equipped?.hands ? slotColor(equipped, 'hands', PALETTE.skin) : undefined;
  const beltGear = !special && equipped?.waist ? slotColor(equipped, 'waist', PALETTE.pants) : undefined;

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
      <defs>
        {auraColor && (
          <radialGradient id={`aura-${side}`} cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor={auraColor} stopOpacity="0.55" />
            <stop offset="70%" stopColor={auraColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={auraColor} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>

      {/* aura layer (behind the body) */}
      {auraColor && <ellipse cx={cx} cy={110} rx={shoulder * 1.3} ry={92} fill={`url(#aura-${side})`} />}

      {/* ground shadow */}
      <ellipse cx={cx} cy={192} rx={shoulder * 0.9} ry={6} fill="#000" opacity="0.35" />

      {/* legs */}
      <rect x={cx - thigh - 2} y={120} width={thigh} height={58} fill={legs} stroke={PALETTE.outline} strokeWidth="2" />
      <rect x={cx + 2} y={120} width={thigh} height={58} fill={legs} stroke={PALETTE.outline} strokeWidth="2" />
      {/* shoes */}
      <rect x={cx - thigh - 4} y={176} width={thigh + 4} height={10} fill={shoes} stroke={PALETTE.outline} strokeWidth="2" />
      <rect x={cx} y={176} width={thigh + 4} height={10} fill={shoes} stroke={PALETTE.outline} strokeWidth="2" />

      {/* torso */}
      <rect x={cx - shoulder / 2} y={70} width={shoulder} height={52} rx="3" fill={torso} stroke={PALETTE.outline} strokeWidth="2" />
      <rect x={cx} y={70} width={shoulder / 2} height={52} fill={PALETTE.shirtShade} opacity="0.35" />
      {/* waist / belt */}
      {beltGear && <rect x={cx - shoulder / 2} y={114} width={shoulder} height={8} fill={beltGear} stroke={PALETTE.outline} strokeWidth="2" />}

      {/* arms */}
      <rect x={cx - shoulder / 2 - arm} y={flexing ? 58 : 72} width={arm} height={flexing ? 40 : 50} rx="3" fill={PALETTE.skin} stroke={PALETTE.outline} strokeWidth="2" />
      <rect x={cx + shoulder / 2} y={72} width={arm} height={50} rx="3" fill={PALETTE.skinShade} stroke={PALETTE.outline} strokeWidth="2" />
      {/* hand gear (wristbands/chalk) */}
      {handGear && <>
        <rect x={cx - shoulder / 2 - arm} y={flexing ? 92 : 116} width={arm} height={7} fill={handGear} stroke={PALETTE.outline} strokeWidth="2" />
        <rect x={cx + shoulder / 2} y={116} width={arm} height={7} fill={handGear} stroke={PALETTE.outline} strokeWidth="2" />
      </>}

      {/* neck + head */}
      <rect x={cx - 6} y={58} width={12} height={12} fill={PALETTE.skinShade} stroke={PALETTE.outline} strokeWidth="2" />
      <rect x={cx - 13} y={30} width={26} height={30} rx="4" fill={special ? specialColor! : PALETTE.skin} stroke={PALETTE.outline} strokeWidth="2" />
      {/* head gear or default hair */}
      {headGear
        ? <rect x={cx - 14} y={26} width={28} height={11} fill={headGear} stroke={PALETTE.outline} strokeWidth="2" />
        : <rect x={cx - 13} y={28} width={26} height={9} fill={PALETTE.outline} />}

      {/* companion layer (in front) */}
      {hasCompanion && (
        <g>
          <circle cx={cx + shoulder / 2 + 18} cy={64} r="9" fill={slotColor(equipped, 'companion', '#7fa6cf')} stroke={PALETTE.outline} strokeWidth="2" />
          <circle cx={cx + shoulder / 2 + 18} cy={64} r="3" fill="#0b0d10" />
        </g>
      )}
    </svg>
  );
}
