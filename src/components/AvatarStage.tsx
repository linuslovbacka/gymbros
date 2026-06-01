import { Avatar, derivePhysiqueTier } from './Avatar';
import { FireVortex } from './FireVortex';
import { useAvatarSprite } from './useAvatarSprite';
import { vortexIntensity, vortexStage, vortexTint } from '../engine/vortex';
import type { Profile } from '../state/types';

// Composes the §10 fire vortex around the §3 single-tier avatar: vortex base
// (behind) → avatar (with equipped cosmetics + rust) → vortex front. The vortex
// intensity is derived from levelling progress and tinted by currency lane.
export function AvatarStage({ profile, opponentIron, flexing }: {
  profile: Profile;
  opponentIron: number | null;
  flexing?: boolean;
}) {
  const tier = derivePhysiqueTier(profile.upper_tier, profile.lower_tier);
  const intensity = vortexIntensity(profile.exercise_state);
  const stage = vortexStage(intensity);
  const tint = vortexTint(profile.iron, opponentIron);
  const rusty = profile.rust_state?.rusty ?? false;
  const sprite = useAvatarSprite(profile, tier);

  return (
    <div className="avatar-stage">
      <FireVortex stage={stage} tint={tint} layer="base" />
      <div className="avatar-layer">
        <Avatar
          tier={tier}
          side={profile.side ?? 'left'}
          flexing={flexing}
          rusty={rusty}
          equipped={profile.equipped}
          sprite={sprite}
        />
      </div>
      <FireVortex stage={stage} tint={tint} layer="front" />
    </div>
  );
}
