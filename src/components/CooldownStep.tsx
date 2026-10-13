'use client';

import gsap from 'gsap';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { LlPlayExerciseLog } from '@/components/LlPlayExerciseLog';
import {
  cooldownStretches,
  type CooldownVariant,
} from '@/content/mobility';
import { NOTHING_EASE, prefersReducedMotion } from '@/lib/nothing-motion';

const SPLASH_WORD = 'COOLDOWN';
const LETTER_STAGGER = 0.1;
const LETTER_DURATION = 0.12;
const SPLASH_HOLD = 0.35;

export function CooldownStep({
  variant,
  onBack,
  onSkip: _onSkip,
  onComplete,
  screenRef,
  onRegisterPrimary,
  sessionStartedAt,
}: {
  variant: CooldownVariant;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
  screenRef?: RefObject<HTMLDivElement | null>;
  onRegisterPrimary?: (fn: () => void) => void;
  sessionStartedAt?: number;
}) {
  void _onSkip;
  const stretches = cooldownStretches(variant);
  const [showSplash, setShowSplash] = useState(true);
  const [idx, setIdx] = useState(0);
  const wordRef = useRef<HTMLSpanElement>(null);
  const finishedRef = useRef(false);
  const busyRef = useRef(false);

  const finishSplash = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    gsap.killTweensOf(wordRef.current?.querySelectorAll('span') ?? []);
    setShowSplash(false);
  }, []);

  useLayoutEffect(() => {
    if (!showSplash) return;
    const letters = wordRef.current?.querySelectorAll('span');
    if (!letters?.length) {
      finishSplash();
      return;
    }
    if (prefersReducedMotion()) {
      gsap.set(letters, { autoAlpha: 1 });
      const t = window.setTimeout(finishSplash, SPLASH_HOLD * 1000);
      return () => window.clearTimeout(t);
    }
    gsap.set(letters, { autoAlpha: 0 });
    const tl = gsap.timeline({ onComplete: finishSplash });
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
  }, [showSplash, finishSplash]);

  const stretch = stretches[idx];
  const isLast = idx >= stretches.length - 1;

  const goNext = useCallback(() => {
    if (busyRef.current) return;
    if (isLast || !stretch) {
      onComplete();
      return;
    }
    setIdx((i) => i + 1);
  }, [isLast, onComplete, stretch]);

  const runPrimary = useCallback(() => {
    if (showSplash) {
      finishSplash();
      return;
    }
  }, [finishSplash, showSplash]);

  useEffect(() => {
    onRegisterPrimary?.(showSplash ? runPrimary : () => {});
  }, [onRegisterPrimary, runPrimary, showSplash]);

  if (showSplash) {
    return (
      <div className="auth-llplay__screen-inner llplay-workout llplay-workout--log" ref={screenRef}>
        <button
          type="button"
          className="llplay-cooldown-splash"
          onClick={finishSplash}
          aria-label="Continue to cooldown"
        >
          <span className="llplay-cooldown-splash__word" ref={wordRef} aria-hidden>
            {SPLASH_WORD.split('').map((ch, i) => (
              <span key={`${ch}-${i}`} className="llplay-cooldown-splash__letter">
                {ch}
              </span>
            ))}
          </span>
        </button>
      </div>
    );
  }

  if (!stretch) {
    onComplete();
    return null;
  }

  return (
    <LlPlayExerciseLog
      screenRef={screenRef}
      onBack={idx === 0 ? onBack : () => setIdx((i) => Math.max(0, i - 1))}
      kicker="Cooldown"
      title={stretch.name}
      exerciseId={stretch.exerciseId}
      rungName={stretch.name}
      timed
      jumpAllocatedSec={stretch.durationSec}
      onTimedComplete={goNext}
      nextLabel={isLast ? 'Finish' : 'Next'}
      onNext={goNext}
      onRegisterPrimary={onRegisterPrimary}
      primaryBusy={busyRef}
      sessionStartedAt={sessionStartedAt}
    />
  );
}
