import { useApp } from '../state/store';
import { Avatar, derivePhysiqueTier } from '../components/Avatar';
import { ProModeHeader } from '../components/ProModeHeader';
import type { Profile } from '../state/types';

function Fighter({ p, side }: { p: Profile; side: 'left' | 'right' }) {
  const rusty = p.rust_state?.rusty ?? false;
  return (
    <div className="fighter">
      <div className="fighter-figure">
        <Avatar tier={derivePhysiqueTier(p.upper_tier, p.lower_tier)} side={side} rusty={rusty} />
      </div>
      <div className="fighter-name">{p.display_name ?? 'Bro'}</div>
      {rusty && <div className="rust-badge">RUSTY</div>}
      <div className="fighter-tiers">
        <span className="tier-badge">UP {p.upper_tier}</span>
        <span className="tier-badge">LO {p.lower_tier}</span>
      </div>
    </div>
  );
}

function RestTokens({ count }: { count: number }) {
  return (
    <div className="rest-tokens" title="Rest tokens — buffer before your gear rusts">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`token ${i < count ? 'on' : 'off'}`} />
      ))}
    </div>
  );
}

export function StartScreen({ onTrain, onLocker }: { onTrain: () => void; onLocker: () => void }) {
  const { profile, partner, pressProMode, signOut } = useApp();
  if (!profile) return null;

  const mySide: 'left' | 'right' = profile.side ?? 'left';
  const left = mySide === 'left' ? profile : partner;
  const right = mySide === 'left' ? partner : profile;

  return (
    <div className="screen">
      <div className="topbar">
        <div className="chips">
          <span className="chip iron"><span className="dot" />{profile.iron} IRON</span>
          <span className="chip grit"><span className="dot" />{profile.grit} GRIT</span>
          <RestTokens count={profile.rest_tokens} />
        </div>
        <button className="back" onClick={() => void signOut()}>Sign out</button>
      </div>

      <ProModeHeader level={profile.pro_mode_level} onPress={pressProMode} />

      <div className="vs">
        <div className="days-trained">
          <div className="num">{profile.days_trained}</div>
          <div className="lbl">DAYS TRAINED</div>
        </div>

        {left ? <Fighter p={left} side="left" /> : <WaitingSide />}
        <div className="vs-mark">VS</div>
        {right ? <Fighter p={right} side="right" /> : <WaitingSide />}
      </div>

      <button className="btn btn-primary btn-train" onClick={onTrain}>TRAIN</button>
      <button className="btn btn-block" style={{ marginTop: 10 }} onClick={onLocker}>LOCKER</button>
    </div>
  );
}

function WaitingSide() {
  return (
    <div className="empty-side">
      <div className="fighter-figure" style={{ opacity: 0.3 }}>
        <Avatar tier={1} side="right" />
      </div>
      <div className="tiny">waiting for bro</div>
    </div>
  );
}
