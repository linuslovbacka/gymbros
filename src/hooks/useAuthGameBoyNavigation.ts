'use client';

import { useCallback, useEffect, useRef } from 'react';
import { gameBoyPress } from '@/lib/gameboy-motion';

type PadDirection = 'up' | 'down' | 'left' | 'right';

export function useAuthGameBoyNavigation({
  focusables,
  onEnter,
  onBack,
  enabled = true,
}: {
  focusables: () => (HTMLElement | null)[];
  onEnter: () => void;
  onBack: () => void;
  enabled?: boolean;
}) {
  const lastFieldFocusRef = useRef<HTMLElement | null>(null);

  const moveFocus = useCallback(
    (direction: PadDirection) => {
      const list = focusables().filter(Boolean) as HTMLElement[];
      if (list.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      let idx = list.findIndex((el) => el === active);
      if (idx < 0 && lastFieldFocusRef.current) {
        idx = list.findIndex((el) => el === lastFieldFocusRef.current);
      }
      if (idx < 0) idx = 0;

      let delta = 0;
      if (direction === 'up') delta = -1;
      else if (direction === 'down') delta = 1;
      else if (direction === 'left') delta = -1;
      else if (direction === 'right') delta = 1;

      const next = (idx + delta + list.length) % list.length;
      const target = list[next];
      target?.focus();
      if (target) lastFieldFocusRef.current = target;
    },
    [focusables],
  );

  const handlePad = useCallback(
    (direction: PadDirection, _el: HTMLElement | null) => {
      moveFocus(direction);
    },
    [moveFocus],
  );

  const handleEnter = useCallback(
    (el: HTMLElement | null) => {
      gameBoyPress(el);
      onEnter();
    },
    [onEnter],
  );

  const handleBack = useCallback(
    (el: HTMLElement | null) => {
      gameBoyPress(el);
      onBack();
    },
    [onBack],
  );

  useEffect(() => {
    if (!enabled) return;

    function onFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const list = focusables().filter(Boolean) as HTMLElement[];
      if (list.includes(target)) lastFieldFocusRef.current = target;
    }

    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [enabled, focusables]);

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveFocus('up');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveFocus('down');
        return;
      }
      if (e.key === 'ArrowLeft' && !inInput) {
        e.preventDefault();
        moveFocus('left');
        return;
      }
      if (e.key === 'ArrowRight' && !inInput) {
        e.preventDefault();
        moveFocus('right');
        return;
      }
      if (e.key === 'Enter' && !(e.target as HTMLElement)?.closest('.auth-llplay__pad')) {
        if (inInput) return;
        e.preventDefault();
        onEnter();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, moveFocus, onEnter, onBack]);

  return { handlePad, handleEnter, handleBack, moveFocus };
}
