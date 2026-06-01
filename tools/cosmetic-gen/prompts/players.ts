// Per-player identity layer (generation-spec §5/§6). Identity is physique-agnostic:
// it describes the face/hair/skin/build personality that must stay constant across
// every tier so the character still reads as "the same guy" as he transforms.

export type PlayerSlug = 'linus' | 'oskar';

export interface Player {
  slug: PlayerSlug;
  name: string;
  /** Which screen side this player occupies (drives facing/mirroring). */
  side: 'left' | 'right';
  /** Identity prompt fragment — face, hair, skin, age. NO physique (that is per-tier). */
  identity: string;
}

export const PLAYERS: Record<PlayerSlug, Player> = {
  linus: {
    slug: 'linus',
    name: 'Linus',
    side: 'right',
    identity: [
      'Young man, late teens to early twenties, youthful soft features (not rugged, not older).',
      'Short mid-brown hair (#3A2510), flat tan skin, simple rounded head shape.',
      'Same minimal face every frame.',
    ].join(' '),
  },
  oskar: {
    slug: 'oskar',
    name: 'Oskar',
    side: 'left',
    identity: [
      'Young man, late teens to early twenties, youthful features with a slightly squarer jaw to read distinct from Linus.',
      'Short dark-blond hair (#6B5A38), flat fair skin, simple head shape.',
      'Same minimal face every frame.',
    ].join(' '),
  },
};

export function getPlayer(slug: string): Player {
  const p = PLAYERS[slug as PlayerSlug];
  if (!p) throw new Error(`Unknown player "${slug}". Known: ${Object.keys(PLAYERS).join(', ')}`);
  return p;
}
