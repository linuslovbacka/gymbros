import { useState } from 'react';
import { proModeLabel, isChaos } from '../content/proMode';

// The escalating header behind the avatars, driven by the Pro Mode button
// (spec section 7). Press only escalates — never reverses. The very first press
// (level 0 -> 1) asks for confirmation, because the whole joke is that it's
// permanent; subsequent presses are instant (you already committed).
export function ProModeHeader({ level, onPress }: { level: number; onPress: () => void }) {
  const label = proModeLabel(level);
  const chaos = isChaos(level);
  const [confirming, setConfirming] = useState(false);

  function handle() {
    if (level === 0) { setConfirming(true); return; }
    onPress();
  }

  return (
    <>
      <button
        className={`promode${chaos ? ' chaos' : ''}`}
        onClick={handle}
        aria-label="Pro Mode"
        title="Press for more. There is no going back."
      >
        <span className="promode-label">{label}</span>
        {level > 0 && <span className="promode-lvl">PRO LV.{level}</span>}
      </button>

      {confirming && (
        <div className="sheet-backdrop" onClick={() => setConfirming(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-name">There is no going back.</div>
            <p className="sheet-desc">
              Pro Mode only escalates. Once you press it, you can never un-press it. Ever. Are you bro enough?
            </p>
            <button
              className="btn btn-primary btn-block"
              onClick={() => { onPress(); setConfirming(false); }}
            >
              Become PRO BROS
            </button>
            <button className="btn btn-block" onClick={() => setConfirming(false)}>Not yet</button>
          </div>
        </div>
      )}
    </>
  );
}
