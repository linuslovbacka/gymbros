import { RARITY_COLOR, SLOT_LABEL, type Cosmetic } from '../content/cosmetics';

// Placeholder cosmetic art (spec section 15: build against placeholders, never
// block on real sprites). Real grid icons resolve via cosmetics.current_image_id
// at Phase 8; until then we draw a deterministic rarity-tinted slot glyph.
const SLOT_GLYPH: Record<string, string> = {
  head: 'HD', torso: 'TR', hands: 'HD', waist: 'WST', legs: 'LG', feet: 'FT',
  aura: 'AUR', companion: 'CMP', special: 'SPC', title: 'TTL',
};

export function CosmeticIcon({ cosmetic, size = 56 }: { cosmetic: Cosmetic; size?: number }) {
  const color = RARITY_COLOR[cosmetic.rarity];
  return (
    <div
      className="cosmetic-icon"
      style={{ width: size, height: size, borderColor: color, boxShadow: `inset 0 0 ${size / 3}px ${color}33` }}
      title={`${cosmetic.name} — ${SLOT_LABEL[cosmetic.slot]}`}
    >
      <span className="cosmetic-glyph" style={{ color }}>{SLOT_GLYPH[cosmetic.slot] ?? '?'}</span>
    </div>
  );
}
