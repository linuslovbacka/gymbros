import { proModeLabel, isChaos } from '../content/proMode';

// The escalating header behind the avatars, driven by the Pro Mode button
// (spec section 7). Press only escalates — never reverses.
export function ProModeHeader({ level, onPress }: { level: number; onPress: () => void }) {
  const label = proModeLabel(level);
  const chaos = isChaos(level);
  return (
    <button
      className={`promode${chaos ? ' chaos' : ''}`}
      onClick={onPress}
      aria-label="Pro Mode"
      title="Press for more. There is no going back."
    >
      <span className="promode-label">{label}</span>
      {level > 0 && <span className="promode-lvl">PRO LV.{level}</span>}
    </button>
  );
}
