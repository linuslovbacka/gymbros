'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { resolveExerciseMedia, illustrationForExercise } from '@/content/exercise-media';
import { NOTHING_DURATION_MED, prefersReducedMotion } from '@/lib/nothing-motion';
import { playTimerAlarm, stopTimerAlarm, unlockTimerAlarm } from '@/lib/timer-alarm';

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function formatMmSs(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

function useElapsedSince(startedAt?: number) {
  const originRef = useRef(startedAt ?? Date.now());
  if (startedAt != null) originRef.current = startedAt;
  const origin = originRef.current;
  const [elapsed, setElapsed] = useState(() => Math.max(0, Math.floor((Date.now() - origin) / 1000)));
  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - origin) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [origin]);
  return elapsed;
}

function FlipCard({
  flipped,
  onToggle,
  front,
  back,
  className,
  label,
}: {
  flipped: boolean;
  onToggle: () => void;
  front: ReactNode;
  back: ReactNode;
  className: string;
  label: string;
}) {
  const instant = prefersReducedMotion();
  return (
    <button
      type="button"
      className={`llplay-exlog-flip llplay-card ${className}${flipped ? ' is-flipped' : ''}${instant ? ' is-instant' : ''}`}
      data-llplay-card
      aria-pressed={flipped}
      aria-label={label}
      onClick={onToggle}
    >
      <span className="llplay-exlog-flip__inner" style={{ transitionDuration: `${NOTHING_DURATION_MED}s` }}>
        <span className="llplay-exlog-flip__face llplay-exlog-flip__face--front">{front}</span>
        <span className="llplay-exlog-flip__face llplay-exlog-flip__face--back">{back}</span>
      </span>
    </button>
  );
}

export function LlPlayExerciseLog({
  screenRef,
  motionRef,
  onBack,
  kicker,
  title,
  hint,
  exerciseId,
  rungName,
  jumpRope = false,
  timed = false,
  jumpAllocatedSec = 300,
  onJumpComplete,
  onTimedComplete,
  reps,
  nextLabel,
  onNext,
  badge = '?',
  ceiling,
  onRegisterPrimary,
  primaryBusy,
  sessionStartedAt,
}: {
  screenRef?: RefObject<HTMLDivElement | null>;
  motionRef?: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  kicker: string;
  title: string;
  hint?: string;
  exerciseId: string;
  rungName: string;
  jumpRope?: boolean;
  timed?: boolean;
  jumpAllocatedSec?: number;
  onJumpComplete?: () => void;
  onTimedComplete?: () => void;
  reps?: { current: number; target: number; onDec: () => void; onInc: () => void };
  nextLabel: string;
  onNext: () => void;
  badge?: string;
  ceiling?: ReactNode;
  onRegisterPrimary?: (fn: () => void) => void;
  primaryBusy?: RefObject<boolean>;
  sessionStartedAt?: number;
}) {
  const isTimed = timed || jumpRope;
  const elapsed = useElapsedSince(sessionStartedAt);
  const media = resolveExerciseMedia(exerciseId, rungName);
  const art = illustrationForExercise(exerciseId);
  const [mediaFlipped, setMediaFlipped] = useState(false);
  const [titleFlipped, setTitleFlipped] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerLeft, setTimerLeft] = useState(jumpAllocatedSec);
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    setMediaFlipped(false);
    setTitleFlipped(false);
    setTipIndex(0);
    setTimerStarted(false);
    setTimerDone(false);
    setTimerLeft(jumpAllocatedSec);
  }, [exerciseId, rungName, jumpAllocatedSec]);

  useEffect(() => {
    if (!isTimed || !timerStarted || timerDone) return;
    const t = setInterval(() => {
      setTimerLeft((left) => {
        if (left <= 1) {
          setTimerDone(true);
          setTimerStarted(false);
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isTimed, timerStarted, timerDone]);

  const videoId = media.youtubeVideoId;
  const start = media.youtubeStartSec;
  const embedQuery = start != null && start > 0 ? `?rel=0&start=${start}` : '?rel=0';
  const tips = media.tips.length ? media.tips : ['Move with control.'];

  const showDone = isTimed && timerDone;
  const lastTen = isTimed && timerStarted && timerLeft <= 10 && timerLeft > 0;
  const headerTimed = jumpRope || isTimed;
  const sessionClock = formatMmSs(elapsed);

  const finishTimed = useCallback(() => {
    if (primaryBusy?.current) return;
    (onTimedComplete ?? onJumpComplete)?.();
  }, [onJumpComplete, onTimedComplete, primaryBusy]);
  const finishTimedRef = useRef(finishTimed);
  finishTimedRef.current = finishTimed;

  const startTimer = useCallback(() => {
    unlockTimerAlarm();
    setTimerStarted(true);
  }, []);

  const skipTimer = useCallback(() => {
    stopTimerAlarm();
    finishTimed();
  }, [finishTimed]);

  const runPrimary = useCallback(() => {
    if (primaryBusy?.current) return;
    if (isTimed) {
      if (timerDone) {
        finishTimed();
        return;
      }
      if (!timerStarted) {
        startTimer();
        return;
      }
      skipTimer();
      return;
    }
    onNext();
  }, [finishTimed, isTimed, onNext, primaryBusy, skipTimer, startTimer, timerDone, timerStarted]);

  useEffect(() => {
    onRegisterPrimary?.(runPrimary);
  }, [onRegisterPrimary, runPrimary]);

  useEffect(() => {
    if (!timerDone) return;
    void playTimerAlarm(5);
    const t = window.setTimeout(() => finishTimedRef.current(), 1600);
    return () => window.clearTimeout(t);
  }, [timerDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I' || e.key === '?') {
        e.preventDefault();
        setMediaFlipped((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="auth-llplay__screen-inner llplay-workout llplay-workout--log" ref={screenRef}>
      <div className={`llplay-exlog exercise-card${headerTimed ? ' llplay-exlog--warmup' : ''}`} ref={motionRef}>
        <div className="llplay-exlog__header">
          {headerTimed ? (
            <>
              <p className="llplay-exlog__clock-label">Total time training</p>
              <p className="llplay-exlog__clock">{sessionClock}</p>
            </>
          ) : (
            <>
              <button type="button" className="llplay-exlog__back llplay-card" data-llplay-card onClick={onBack}>
                Back
              </button>
              <p className="llplay-exlog__clock">{sessionClock}</p>
            </>
          )}
        </div>

        <FlipCard
          flipped={mediaFlipped}
          onToggle={() => setMediaFlipped((v) => !v)}
          className="llplay-exlog__media"
          label={mediaFlipped ? 'Show illustration' : 'Show demo video'}
          front={
            <>
              <Image src={art} alt="" width={263} height={263} className="llplay-exlog__art" unoptimized priority />
              <span className="llplay-exlog__badge" aria-hidden>
                {isTimed ? 'i' : badge}
              </span>
            </>
          }
          back={
            <>
              {videoId && mediaFlipped ? (
                <iframe
                  title={`${rungName} demo`}
                  className="llplay-exlog__video"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}${embedQuery}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <span className="llplay-exlog__video-fallback">Demo coming soon</span>
              )}
              <span className="llplay-exlog__badge llplay-exlog__badge--ghost" aria-hidden>
                {isTimed ? 'i' : badge}
              </span>
            </>
          }
        />

        {showDone ? (
          <button type="button" className="llplay-exlog__done llplay-card" data-llplay-card onClick={finishTimed}>
            DONE
          </button>
        ) : lastTen ? (
          <div className="llplay-exlog__last10" aria-live="assertive">
            {timerLeft}
          </div>
        ) : (
          <>
            <FlipCard
              flipped={titleFlipped}
              onToggle={() => setTitleFlipped((v) => !v)}
              className="llplay-exlog__title"
              label={titleFlipped ? 'Show exercise name' : 'Show steps'}
              front={
                <>
                  <p className="llplay-exlog__kicker">{kicker}</p>
                  <p className="llplay-exlog__name">{title}</p>
                  {hint ? <p className="llplay-exlog__hint">{hint}</p> : null}
                </>
              }
              back={
                <>
                  <span className="llplay-exlog__step">
                    <span className="llplay-exlog__step-n">{tipIndex + 1}</span>
                    <span className="llplay-exlog__step-t">{tips[tipIndex]}</span>
                  </span>
                  <span
                    className="llplay-exlog__dots"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTipIndex((i) => (i + 1) % tips.length);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setTipIndex((i) => (i + 1) % tips.length);
                      }
                    }}
                    role="presentation"
                  >
                    {tips.map((_, i) => (
                      <span key={i} className={`llplay-exlog__dot${i === tipIndex ? ' is-on' : ''}`} />
                    ))}
                  </span>
                </>
              }
            />

            {isTimed ? (
              <>
                <div className="llplay-exlog__timer">{formatMmSs(timerLeft)}</div>
                {!timerStarted ? (
                  <button
                    type="button"
                    className="llplay-exlog__start llplay-card"
                    data-llplay-card
                    onClick={runPrimary}
                  >
                    Start
                  </button>
                ) : (
                  <button
                    type="button"
                    className="llplay-exlog__start llplay-card"
                    data-llplay-card
                    onClick={skipTimer}
                  >
                    Skip
                  </button>
                )}
              </>
            ) : (
              <>
                {reps ? (
                  <div className="llplay-exlog__reps">
                    <button type="button" className="llplay-exlog__stepper llplay-card" data-llplay-card onClick={reps.onDec} aria-label="Decrease">
                      −
                    </button>
                    <div className="llplay-exlog__count">
                      {reps.current}/{reps.target}
                    </div>
                    <button type="button" className="llplay-exlog__stepper llplay-card" data-llplay-card onClick={reps.onInc} aria-label="Increase">
                      +
                    </button>
                  </div>
                ) : null}
                <button type="button" className="llplay-exlog__next llplay-card" data-llplay-card onClick={runPrimary}>
                  {nextLabel}
                </button>
              </>
            )}
          </>
        )}
        {ceiling ? <div className="llplay-exlog__ceiling">{ceiling}</div> : null}
      </div>
    </div>
  );
}
