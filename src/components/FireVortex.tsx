import type { VortexStage, VortexTint } from '../engine/vortex';

// The §10 fire vortex as a reusable overlay. Rendered as TWO layers so the
// avatar sits inside the column: `base` draws behind the avatar, `front` draws
// the upper flames over it. One neutral effect, tinted per currency. Stage 1→5
// scales the column up; CSS owns the motion (cheaper than a particle system).
export function FireVortex({ stage, tint, layer }: {
  stage: VortexStage;
  tint: VortexTint;
  layer: 'base' | 'front';
}) {
  return (
    <div
      className={`vortex vortex-${layer} vtint-${tint} vstage-${stage}`}
      aria-hidden
    />
  );
}
