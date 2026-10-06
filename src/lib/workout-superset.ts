import type { WorkoutItem } from '@/content/workouts';

/** One exercise logged alone (warmup, core finisher, …). */
export type SupersetSoloBlock = { type: 'solo'; index: number };

/** Alternate sets: A set 1 → B set 1 → A set 2 → … (active rest, no idle blocks). */
export type SupersetPairBlock = { type: 'pair'; a: number; b: number };

export type SupersetBlock = SupersetSoloBlock | SupersetPairBlock;

function isWarmupSolo(item: WorkoutItem): boolean {
  return item.exerciseId === 'jump_rope';
}

/** Group workout items into superset pairs in list order (pull then push, etc.). */
export function buildSupersetBlocks(items: WorkoutItem[]): SupersetBlock[] {
  const blocks: SupersetBlock[] = [];
  let i = 0;
  while (i < items.length) {
    const cur = items[i]!;
    if (isWarmupSolo(cur)) {
      blocks.push({ type: 'solo', index: i });
      i += 1;
      continue;
    }
    const next = items[i + 1];
    if (next && !isWarmupSolo(next)) {
      blocks.push({ type: 'pair', a: i, b: i + 1 });
      i += 2;
      continue;
    }
    blocks.push({ type: 'solo', index: i });
    i += 1;
  }
  return blocks;
}

export function roundsForBlock(
  block: SupersetBlock,
  items: WorkoutItem[],
): number {
  if (block.type === 'solo') return items[block.index]!.sets;
  const a = items[block.a]!;
  const b = items[block.b]!;
  return Math.max(a.sets, b.sets);
}

export function useSupersetFlow(input: {
  mode: 'home' | 'gym';
  routine: string;
}): boolean {
  return input.mode === 'home' && input.routine === 'main';
}
