'use client';

import Image from 'next/image';
import { gameBoyPress } from '@/lib/gameboy-motion';
import { LoginDpad } from '@/components/login-dpad';

export function GameBoyControls({
  onPad,
  onEnter,
  onBack,
  onStart,
  onDetails,
}: {
  onPad: (dir: 'up' | 'down' | 'left' | 'right', el: HTMLButtonElement | null) => void;
  onEnter: (el: HTMLButtonElement | null) => void;
  onBack: (el: HTMLButtonElement | null) => void;
  onStart?: (el: HTMLButtonElement | null) => void;
  onDetails?: (el: HTMLButtonElement | null) => void;
}) {
  function pressControl(el: HTMLElement) {
    gameBoyPress(el);
  }

  return (
    <div className="auth-llplay__controls" aria-label="Game controls">
      <div className="auth-llplay__controls-stage">
        <div className="auth-llplay__vs-anchor">
          <button
            type="button"
            className="auth-llplay__vs auth-llplay__pressable"
            aria-hidden="true"
            tabIndex={-1}
            onClick={(e) => pressControl(e.currentTarget)}
          >
            VS
          </button>
        </div>

        <div className="auth-llplay__controls-center" aria-hidden="true">
          <Image
            src="/ui/login/decor-hero.svg"
            alt=""
            width={109}
            height={138}
            className="auth-llplay__deco auth-llplay__deco--hero"
            unoptimized
          />
          <div className="auth-llplay__pills-deferred">
            <button
              type="button"
              className="auth-llplay__pill auth-llplay__pressable"
              tabIndex={onStart ? 0 : -1}
              onClick={(e) => {
                pressControl(e.currentTarget);
                onStart?.(e.currentTarget);
              }}
            >
              Start
            </button>
            <button
              type="button"
              className="auth-llplay__pill auth-llplay__pressable"
              tabIndex={onDetails ? 0 : -1}
              onClick={(e) => {
                pressControl(e.currentTarget);
                onDetails?.(e.currentTarget);
              }}
            >
              Details
            </button>
          </div>
        </div>

        <Image
          src="/ui/login/decor-cat-head.svg"
          alt=""
          width={63}
          height={85}
          className="auth-llplay__deco auth-llplay__deco--cat"
          unoptimized
        />
        <Image
          src="/ui/login/decor-kettlebell.svg"
          alt=""
          width={152}
          height={152}
          className="auth-llplay__deco auth-llplay__deco--kettlebell"
          unoptimized
        />

        <LoginDpad onPad={onPad} />

        <Image
          src="/ui/login/decor-handstand.svg"
          alt=""
          width={38}
          height={48}
          className="auth-llplay__deco auth-llplay__deco--handstand"
          unoptimized
        />

        <button
          type="button"
          className="auth-llplay__action auth-llplay__action--enter auth-llplay__pressable"
          aria-label="A"
          onClick={(e) => onEnter(e.currentTarget)}
        >
          <img src="/ui/login/btn-enter.svg" alt="" />
        </button>
        <button
          type="button"
          className="auth-llplay__action auth-llplay__action--back auth-llplay__pressable"
          aria-label="B"
          onClick={(e) => onBack(e.currentTarget)}
        >
          <img src="/ui/login/btn-back.svg" alt="" />
        </button>
      </div>
    </div>
  );
}
