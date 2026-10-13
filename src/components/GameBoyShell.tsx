'use client';

import Image from 'next/image';
import type { RefObject } from 'react';
import { GameBoyControls } from '@/components/GameBoyControls';
import { gameBoyPress } from '@/lib/gameboy-motion';

export function GameBoyShell({
  children,
  onPad,
  onEnter,
  onBack,
  onStart,
  onDetails,
  sessionActive = false,
  onLogout,
  screenVariant = 'default',
  detailsExpand = false,
  onLogotypeClick,
  screenRef,
  deviceRef,
  logTween = false,
  logLive = false,
}: {
  children: React.ReactNode;
  onPad: (dir: 'up' | 'down' | 'left' | 'right', el: HTMLButtonElement | null) => void;
  onEnter: (el: HTMLButtonElement | null) => void;
  onBack: (el: HTMLButtonElement | null) => void;
  onStart?: (el: HTMLButtonElement | null) => void;
  onDetails?: (el: HTMLButtonElement | null) => void;
  /** Red dot when true (logged in); black when false */
  sessionActive?: boolean;
  onLogout?: () => void;
  screenVariant?: 'default' | 'expanded';
  /** Details: LCD grows and pushes controls down. Home/workout never set this. */
  detailsExpand?: boolean;
  onLogotypeClick?: () => void;
  screenRef?: RefObject<HTMLDivElement | null>;
  deviceRef?: RefObject<HTMLDivElement | null>;
  /** Workout log GSAP owns LCD size; do not snap CSS expand. */
  logTween?: boolean;
  /** Workout log finished scale-out; full-bleed LCD. */
  logLive?: boolean;
}) {
  const canLogout = sessionActive && onLogout;

  return (
    <div className="auth-llplay">
      <div
        ref={deviceRef}
        className={`auth-llplay__device${detailsExpand ? ' auth-llplay__device--details-expand' : ''}`}
      >
        <div className="auth-llplay__top">
          <button
            type="button"
            className={`auth-llplay__session-dot${sessionActive ? ' is-active' : ''}`}
            aria-label={canLogout ? 'Sign out' : 'Not signed in'}
            disabled={!canLogout}
            onClick={(e) => {
              if (!canLogout) return;
              gameBoyPress(e.currentTarget);
              onLogout();
            }}
          />
          <Image
            src="/ui/login/sticker-gb.png"
            alt=""
            width={319}
            height={332}
            className="auth-llplay__sticker"
            unoptimized
          />
          <div
            ref={screenRef}
            className={`auth-llplay__screen${screenVariant === 'expanded' ? ' auth-llplay__screen--expanded' : ''}${logTween ? ' auth-llplay__screen--log-tween' : ''}${logLive ? ' auth-llplay__screen--log-live' : ''}`}
          >
            {children}
            {onLogotypeClick ? (
              <button
                type="button"
                className="auth-llplay__logotype-btn"
                aria-label="Back to home"
                onClick={(e) => {
                  gameBoyPress(e.currentTarget);
                  onLogotypeClick();
                }}
              >
                <Image
                  src="/ui/login/logotype-gymbros.svg"
                  alt=""
                  width={144}
                  height={21}
                  className="auth-llplay__logotype"
                  priority
                />
              </button>
            ) : (
              <Image
                src="/ui/login/logotype-gymbros.svg"
                alt="GYMBROS"
                width={144}
                height={21}
                className="auth-llplay__logotype"
                priority
              />
            )}
          </div>
        </div>
        <GameBoyControls
          onPad={onPad}
          onEnter={onEnter}
          onBack={onBack}
          onStart={onStart}
          onDetails={onDetails}
        />
      </div>
    </div>
  );
}
