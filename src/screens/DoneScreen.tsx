import { useState } from 'react';
import { useApp } from '../state/store';
import { Avatar, derivePhysiqueTier } from '../components/Avatar';
import { FEEL_OPTIONS, CALISTHENICS_PROGRESS, GYM_PROGRESS, type Feel, type ProgressAnswer } from '../engine/types';
import type { LevelUpPrompt } from '../engine/leveling';
import type { PR } from '../engine/pr';
import type { AchievementUnlock } from '../engine/achievements';
import type { SessionDraft } from './WorkoutScreen';

interface ResultState {
  iron: number;
  grit: number;
  prompts: LevelUpPrompt[];
  prs: PR[];
  achievements: AchievementUnlock[];
}

export function DoneScreen({ draft, onClose }: { draft: SessionDraft; onClose: () => void }) {
  const { profile, completeSession, climbExercise, declineExercise } = useApp();
  const [feel, setFeel] = useState<Feel>();
  const [progress, setProgress] = useState<ProgressAnswer>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState>();

  const progressOptions = draft.mode === 'gym' ? GYM_PROGRESS : CALISTHENICS_PROGRESS;

  async function submit() {
    if (!feel || !progress) return;
    setBusy(true);
    const r = await completeSession({ ...draft, feel, progress });
    setBusy(false);
    setResult({ iron: r.ironEarned, grit: r.gritEarned, prompts: r.prompts, prs: r.prs, achievements: r.achievements });
  }

  // ── Result view ───────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="screen">
        <div className="done-hero">
          <div className="figure">
            <Avatar
              tier={derivePhysiqueTier(profile?.upper_tier ?? 1, profile?.lower_tier ?? 1)}
              side={profile?.side ?? 'left'}
              flexing
            />
          </div>
          <h1 className="done-title">SESSION LOGGED</h1>
        </div>

        <div className="reward">
          <div className="text-center">
            <div className="amt iron">+{result.iron}</div>
            <div className="tiny">IRON</div>
          </div>
          <div className="text-center">
            <div className="amt grit">+{result.grit}</div>
            <div className="tiny">GRIT</div>
          </div>
        </div>

        {result.prs.length > 0 && (
          <div className="banner-list">
            {result.prs.map((pr) => (
              <div className="pr-banner" key={pr.exerciseId}>
                <span className="pr-tag">PR</span>
                <span className="pr-name">{pr.name}</span>
                <span className="pr-detail">{pr.detail}</span>
              </div>
            ))}
          </div>
        )}

        {result.achievements.length > 0 && (
          <div className="banner-list">
            {result.achievements.map((a) => (
              <div className="ach-banner" key={a.id}>
                <div className="ach-head">
                  <span className="ach-name">{a.name}</span>
                  <span className={`ach-amt ${a.currency.toLowerCase()}`}>+{a.amount} {a.currency}</span>
                </div>
                <div className="ach-desc">{a.description}</div>
              </div>
            ))}
          </div>
        )}

        <LevelUps
          prompts={result.prompts}
          onClimb={climbExercise}
          onDecline={declineExercise}
        />

        <div className="spacer" />
        <button className="btn btn-primary btn-block" onClick={onClose}>Back to start</button>
      </div>
    );
  }

  // ── Questions view ────────────────────────────────────────────────────
  return (
    <div className="screen">
      <div className="done-hero">
        <h1 className="done-title">NICE WORK</h1>
      </div>

      <div className="q-label">How did it feel?</div>
      <div className="q-options">
        {FEEL_OPTIONS.map((o) => (
          <button key={o.id} className={`q-opt ${feel === o.id ? 'active' : ''}`} onClick={() => setFeel(o.id)}>
            {o.label}
          </button>
        ))}
      </div>

      <div className="q-label">Did you progress?</div>
      <div className="q-options" style={{ flexWrap: 'wrap' }}>
        {progressOptions.map((o) => (
          <button
            key={o.id}
            className={`q-opt ${progress === o.id ? 'active' : ''}`}
            style={{ flexBasis: 'calc(50% - 4px)' }}
            onClick={() => setProgress(o.id as ProgressAnswer)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="spacer" />
      <button className="btn btn-primary btn-block" disabled={!feel || !progress || busy} onClick={() => void submit()}>
        {busy ? 'Saving...' : 'Log it'}
      </button>
    </div>
  );
}

function LevelUps({ prompts, onClimb, onDecline }: {
  prompts: LevelUpPrompt[];
  onClimb: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const visible = prompts.filter((p) => !handled.has(p.exerciseId));
  if (visible.length === 0) return null;

  function mark(id: string) { setHandled((s) => new Set(s).add(id)); }

  return (
    <div className="stack">
      {visible.map((p) => (
        <div className="levelup" key={p.exerciseId}>
          <h3>You've maxed {p.currentRungName}</h3>
          <div className="next">{p.name} → ready to try <b>{p.nextRungName}</b>?</div>
          <div className="row">
            <button className="btn btn-primary grow" onClick={() => { onClimb(p.exerciseId); mark(p.exerciseId); }}>Yes, climb</button>
            <button className="btn grow" onClick={() => { onDecline(p.exerciseId); mark(p.exerciseId); }}>Not yet</button>
          </div>
        </div>
      ))}
    </div>
  );
}
