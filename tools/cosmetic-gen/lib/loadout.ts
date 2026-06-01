// Mirrors src/engine/art.ts loadoutHash + src/content/cosmetics.ts BODY_SLOTS so
// the bake cache key the pipeline writes matches what the app resolves at runtime.
// Keep this in sync with the app if BODY_SLOTS order ever changes.

import { getCosmeticPrompt } from '../prompts/cosmetics.ts';

export const BODY_SLOTS = ['head', 'torso', 'hands', 'waist', 'legs', 'feet'] as const;
export type BodySlot = (typeof BODY_SLOTS)[number];
export type Loadout = Partial<Record<BodySlot, string>>;

/** Stable hash identical to the app's loadoutHash(equipped). */
export function loadoutHash(loadout: Loadout): string {
  return BODY_SLOTS.map((s) => loadout[s] ?? '_').join('|');
}

export const EMPTY_LOADOUT_HASH = loadoutHash({});

/** Parse `--loadout head=snapback,torso=tank_black` into a validated Loadout. */
export function parseLoadout(spec: string | undefined): Loadout {
  const out: Loadout = {};
  if (!spec) return out;
  for (const pair of spec.split(',')) {
    const [slot, slug] = pair.split('=').map((s) => s.trim());
    if (!slot || !slug) throw new Error(`Bad --loadout entry "${pair}". Use slot=slug.`);
    if (!(BODY_SLOTS as readonly string[]).includes(slot)) {
      throw new Error(`"${slot}" is not a body slot. Body slots: ${BODY_SLOTS.join(', ')}`);
    }
    const cp = getCosmeticPrompt(slug);
    if (cp.slot !== slot) throw new Error(`Cosmetic "${slug}" is a ${cp.slot} item, not ${slot}.`);
    out[slot as BodySlot] = slug;
  }
  return out;
}

/** The worn-item prompt fragments for a loadout, in slot order. */
export function loadoutFragments(loadout: Loadout): string[] {
  return BODY_SLOTS.filter((s) => loadout[s]).map((s) => getCosmeticPrompt(loadout[s]!).fragment);
}
