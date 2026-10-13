'use client';

import { useCallback } from 'react';
import { useAuthGameBoyNavigation } from '@/hooks/useAuthGameBoyNavigation';
import { gameBoyPress } from '@/lib/gameboy-motion';

export const LLPLAY_CARD_SELECTOR = '[data-llplay-card]';

function scrollCardIntoView(el: HTMLElement | null) {
  if (!el) return;
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/** A / Enter on a habit card (toggle row, train, sick, or first protein quick-add). */
export function activateLlPlayCard(focused: HTMLElement) {
  const card = focused.closest<HTMLElement>(LLPLAY_CARD_SELECTOR) ?? focused;
  if (!card.matches(LLPLAY_CARD_SELECTOR)) return;

  if (card.matches('button:not([disabled])')) {
    gameBoyPress(card);
    card.click();
    return;
  }

  const action =
    card.querySelector<HTMLButtonElement>('.protein-llplay-add:not([disabled])') ??
    card.querySelector<HTMLButtonElement>('.protein-llplay-chip:not([disabled])') ??
    card.querySelector<HTMLButtonElement>('.protein-calc-add-btn:not([disabled])') ??
    card.querySelector<HTMLButtonElement>('.protein-calc-chip:not([disabled])');
  if (action) {
    gameBoyPress(action);
    action.click();
  }
}

export function useHomeGameBoyNavigation({
  focusables,
  onBack,
}: {
  focusables: () => (HTMLElement | null)[];
  onBack: () => void;
}) {
  const onEnter = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active?.closest(LLPLAY_CARD_SELECTOR)) {
      activateLlPlayCard(active);
      return;
    }
    if (active?.tagName === 'BUTTON') {
      gameBoyPress(active);
      active.click();
    }
  }, []);

  const { handlePad: basePad, handleEnter, handleBack } = useAuthGameBoyNavigation({
    focusables,
    onEnter,
    onBack,
  });

  const handlePad = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', el: HTMLButtonElement | null) => {
      basePad(direction, el);
      requestAnimationFrame(() => {
        scrollCardIntoView(document.activeElement as HTMLElement | null);
      });
    },
    [basePad],
  );

  const handleEnterWrapped = useCallback(
    (el: HTMLElement | null) => {
      gameBoyPress(el);
      onEnter();
    },
    [onEnter],
  );

  return { handlePad, handleEnter: handleEnterWrapped, handleBack };
}
