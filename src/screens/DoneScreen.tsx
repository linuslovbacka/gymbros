'use client';

import gsap from 'gsap';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { GameBoyShell } from '@/components/GameBoyShell';
import { LlPlayRoot } from '@/components/LlPlayRoot';
import { MVP_MODE } from '@/lib/mvp';
import {
  LLPLAY_CARD_SELECTOR,
  useHomeGameBoyNavigation,
} from '@/hooks/useHomeGameBoyNavigation';
import { NOTHING_EASE, llplayCardsEnter, llplayCardsExit, nothingTap, prefersReducedMotion } from '@/lib/nothing-motion';
import { useApp } from '../state/store';
import { AvatarStage } from '../components/AvatarStage';
import {
  FEEL_OPTIONS,
  CALISTHENICS_PROGRESS,
  GYM_PROGRESS,
  type Feel,
  type ProgressAnswer,
} from '../engine/types';
import type { LevelUpPrompt } from '../engine/leveling';
import type { PR } from '../engine/pr';
import type { AchievementUnlock } from '../engine/achievements';
import type { SessionDraft } from './WorkoutScreen';

const FEEL_ORDER: Feel[] = ['good', 'easy', 'dead'];
const LLPLAY_CALISTHENICS_PROGRESS = CALISTHENICS_PROGRESS.filter((o) => o.id !== 'easier');

const LOGGED_WORD = 'LOGGED';
const LETTER_STAGGER = 0.1;
const LETTER_DURATION = 0.12;
const SPLASH_HOLD = 0.35;

type DoneStep = 'feel' | 'progress' | 'logged';

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function formatMmSs(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

interface ResultState {
  iron: number;
  grit: number;
  prompts: LevelUpPrompt[];
  prs: PR[];
  achievements: AchievementUnlock[];
}

function LegacyDoneScreen({ draft, onClose }: { draft: SessionDraft; onClose: () => void }) {
  const { profile, completeSession, climbExercise, declineExercise } = useApp();
  const [feel, setFeel] = useState<Feel>();
  const [progress, setProgress] = useState<ProgressAnswer>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState>();

  const useGymProgress =
    draft.mode === 'gym' &&
    draft.routine !== 'skills' &&
    draft.routine !== 'conditioning' &&
    draft.routine !== 'mobility';
  const progressOptions = useGymProgress ? GYM_PROGRESS : CALISTHENICS_PROGRESS;

  async function submit() {
    if (!feel || !progress) return;
    setBusy(true);
    const r = await completeSession({ ...draft, feel, progress });
    setBusy(false);

    const hasFanfare =
      r.prompts.length > 0 ||
      r.prs.length > 0 ||
      r.achievements.length > 0 ||
      r.ironEarned > 0 ||
      r.gritEarned > 0;

    if (!hasFanfare) {
      onClose();
      return;
    }

    setResult({
      iron: r.ironEarned,
      grit: r.gritEarned,
      prompts: r.prompts,
      prs: r.prs,
      achievements: r.achievements,
    });
  }

  if (result) {
    return (
      <div className="screen">
        <div className="done-hero">
          <div className="figure">
            {profile && <AvatarStage profile={profile} opponentIron={null} flexing />}
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

        <LevelUps prompts={result.prompts} onClimb={climbExercise} onDecline={declineExercise} />

        <div className="spacer" />
        <button className="btn btn-primary btn-block" onClick={onClose}>
          Back to start
        </button>
      </div>
    );
  }

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
            style={{ flexBasis: o.id === 'no_progress' ? '100%' : 'calc(50% - 4px)' }}
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

function LlPlayDoneScreen({ draft, onClose }: { draft: SessionDraft; onClose: () => void }) {
  const router = useRouter();
  const { completeSession, signOut } = useApp();
  const [step, setStep] = useState<DoneStep>('feel');
  const [feel, setFeel] = useState<Feel>();
  const [saving, setSaving] = useState(false);

  const screenRef = useRef<HTMLDivElement>(null);
  const lcdRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const shellBackRef = useRef<() => void>(() => {});
  const shellEnterRef = useRef<(() => void) | null>(null);
  const loggedWordRef = useRef<HTMLSpanElement>(null);
  const loggedFinishedRef = useRef(false);

  const useGymProgress =
    draft.mode === 'gym' &&
    draft.routine !== 'skills' &&
    draft.routine !== 'conditioning' &&
    draft.routine !== 'mobility';
  const progressOptions = useGymProgress ? GYM_PROGRESS : LLPLAY_CALISTHENICS_PROGRESS;
  const sessionClock = formatMmSs(draft.elapsedSec ?? 0);

  const feelOptions = FEEL_ORDER.map((id) => FEEL_OPTIONS.find((o) => o.id === id)!);

  const finishLogged = useCallback(() => {
    if (loggedFinishedRef.current) return;
    loggedFinishedRef.current = true;
    gsap.killTweensOf(loggedWordRef.current?.querySelectorAll('span') ?? []);
    onClose();
  }, [onClose]);

  const goStep = useCallback((next: DoneStep) => {
    if (busyRef.current || step === next) return;
    busyRef.current = true;
    const cards = screenRef.current?.querySelectorAll('[data-llplay-card]') ?? [];
    void llplayCardsExit(cards).then(() => {
      setStep(next);
    });
  }, [step]);

  const pickFeel = useCallback(
    (id: Feel) => {
      if (busyRef.current) return;
      setFeel(id);
      goStep('progress');
    },
    [goStep],
  );

  const pickProgress = useCallback(
    (id: ProgressAnswer) => {
      if (busyRef.current || !feel || saving) return;
      busyRef.current = true;
      const cards = screenRef.current?.querySelectorAll('[data-llplay-card]') ?? [];
      void llplayCardsExit(cards).then(async () => {
        setSaving(true);
        try {
          await completeSession({ ...draft, feel, progress: id });
          loggedFinishedRef.current = false;
          setStep('logged');
        } catch {
          busyRef.current = false;
          setSaving(false);
          void llplayCardsEnter(screenRef.current?.querySelectorAll('[data-llplay-card]') ?? []);
          return;
        }
        setSaving(false);
        busyRef.current = false;
      });
    },
    [completeSession, draft, feel, saving],
  );

  useLayoutEffect(() => {
    if (step === 'logged') return;
    busyRef.current = true;
    void llplayCardsEnter(screenRef.current?.querySelectorAll('[data-llplay-card]') ?? []).then(() => {
      busyRef.current = false;
    });
  }, [step]);

  useLayoutEffect(() => {
    if (step !== 'logged') return;
    const letters = loggedWordRef.current?.querySelectorAll('span');
    if (!letters?.length) {
      finishLogged();
      return;
    }
    if (prefersReducedMotion()) {
      gsap.set(letters, { autoAlpha: 1 });
      const t = window.setTimeout(finishLogged, SPLASH_HOLD * 1000);
      return () => window.clearTimeout(t);
    }
    gsap.set(letters, { autoAlpha: 0 });
    const tl = gsap.timeline({ onComplete: finishLogged });
    tl.to(letters, {
      autoAlpha: 1,
      duration: LETTER_DURATION,
      stagger: LETTER_STAGGER,
      ease: NOTHING_EASE,
    });
    tl.to({}, { duration: SPLASH_HOLD });
    return () => {
      tl.kill();
    };
  }, [step, finishLogged]);

  const handleShellBack = useCallback(() => {
    if (busyRef.current || saving) return;
    if (step === 'logged') {
      finishLogged();
      return;
    }
    if (step === 'progress') {
      goStep('feel');
      return;
    }
    onClose();
  }, [finishLogged, goStep, onClose, saving, step]);

  shellBackRef.current = handleShellBack;

  const skipLoggedSplash = useCallback(() => {
    if (step !== 'logged') return;
    finishLogged();
  }, [finishLogged, step]);

  useEffect(() => {
    shellEnterRef.current = step === 'logged' ? skipLoggedSplash : null;
  }, [skipLoggedSplash, step]);

  const getFocusables = useCallback(() => {
    const root = screenRef.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(LLPLAY_CARD_SELECTOR));
  }, []);

  const { handlePad, handleEnter, handleBack } = useHomeGameBoyNavigation({
    focusables: getFocusables,
    onBack: () => shellBackRef.current(),
  });

  const handleShellEnter = useCallback(
    (el: HTMLButtonElement | null) => {
      if (step === 'logged') {
        skipLoggedSplash();
        return;
      }
      handleEnter(el);
    },
    [handleEnter, skipLoggedSplash, step],
  );

  let inner: ReactNode;

  if (step === 'logged') {
    inner = (
      <div className="auth-llplay__screen-inner llplay-workout llplay-workout--log" ref={screenRef}>
        <button
          type="button"
          className="llplay-cooldown-splash"
          onClick={finishLogged}
          aria-label="Workout logged — continue home"
        >
          <span className="llplay-cooldown-splash__word" ref={loggedWordRef} aria-hidden>
            {LOGGED_WORD.split('').map((ch, i) => (
              <span key={`${ch}-${i}`} className="llplay-cooldown-splash__letter">
                {ch}
              </span>
            ))}
          </span>
        </button>
      </div>
    );
  } else {
    const prompt =
      step === 'feel' ? (
        <>
          Nice work!
          <br />
          How did it feel?
        </>
      ) : (
        'Did you progress?'
      );

    const pills =
      step === 'feel'
        ? feelOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              className="llplay-choice-pill nothing-press llplay-card llplay-done__pill"
              data-llplay-card
              disabled={saving}
              onClick={(e) => {
                nothingTap(e.currentTarget);
                pickFeel(o.id);
              }}
            >
              <span className="llplay-choice-pill__label">{o.label}</span>
            </button>
          ))
        : progressOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`llplay-choice-pill nothing-press llplay-card llplay-done__pill${o.id === 'harder_variation' ? ' llplay-done__pill--tall' : ''}`}
              data-llplay-card
              disabled={saving}
              onClick={(e) => {
                nothingTap(e.currentTarget);
                void pickProgress(o.id as ProgressAnswer);
              }}
            >
              <span className="llplay-choice-pill__label">{o.label}</span>
            </button>
          ));

    inner = (
      <div className="auth-llplay__screen-inner llplay-workout llplay-workout--log" ref={screenRef}>
        <div className="llplay-done">
          <div className="llplay-done__header llplay-card" data-llplay-card>
            <p className="llplay-exlog__clock-label">Total time training</p>
            <p className="llplay-exlog__clock">{sessionClock}</p>
          </div>
          <div className="llplay-done__prompt llplay-card" data-llplay-card>
            <p className="llplay-done__prompt-text">{prompt}</p>
          </div>
          <div className="llplay-done__choices">{pills}</div>
        </div>
      </div>
    );
  }

  return (
    <LlPlayRoot>
      <GameBoyShell
        onPad={handlePad}
        onEnter={handleShellEnter}
        onBack={handleBack}
        onStart={() => {
          if (busyRef.current) return;
          router.push('/');
        }}
        onDetails={() => {
          if (busyRef.current) return;
          router.push('/details');
        }}
        sessionActive
        onLogout={() => void signOut()}
        logLive={step === 'logged'}
        screenRef={lcdRef}
        deviceRef={deviceRef}
      >
        {inner}
      </GameBoyShell>
    </LlPlayRoot>
  );
}

export function DoneScreen({ draft, onClose }: { draft: SessionDraft; onClose: () => void }) {
  if (MVP_MODE) {
    return <LlPlayDoneScreen draft={draft} onClose={onClose} />;
  }
  return <LegacyDoneScreen draft={draft} onClose={onClose} />;
}

function LevelUps({ prompts, onClimb, onDecline }: {
  prompts: LevelUpPrompt[];
  onClimb: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const visible = prompts.filter((p) => !handled.has(p.exerciseId));
  if (visible.length === 0) return null;

  function mark(id: string) {
    setHandled((s) => new Set(s).add(id));
  }

  return (
    <div className="stack">
      {visible.map((p) => (
        <div className="levelup" key={p.exerciseId}>
          <h3>You've maxed {p.currentRungName}</h3>
          <div className="next">
            {p.name} → ready to try <b>{p.nextRungName}</b>?
          </div>
          <div className="row">
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={() => {
                onClimb(p.exerciseId);
                mark(p.exerciseId);
              }}
            >
              Yes, climb
            </button>
            <button
              type="button"
              className="btn grow"
              onClick={() => {
                onDecline(p.exerciseId);
                mark(p.exerciseId);
              }}
            >
              Not yet
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
