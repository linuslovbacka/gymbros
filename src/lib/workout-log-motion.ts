import gsap from 'gsap';
import { prefersReducedMotion } from '@/lib/nothing-motion';

/** Same timing as details LCD morph in LlPlayLcdFrame. */
export const WORKOUT_LOG_DURATION = 0.45;
export const WORKOUT_LOG_EASE = 'power2.out';

export const LCD_EXPANDED_CLASS = 'auth-llplay__screen--expanded';
export const LCD_LOG_TWEEN_CLASS = 'auth-llplay__screen--log-tween';
export const LCD_LOG_LIVE_CLASS = 'auth-llplay__screen--log-live';

const LCD_CLASSES = [LCD_EXPANDED_CLASS, LCD_LOG_TWEEN_CLASS, LCD_LOG_LIVE_CLASS] as const;
const CLEAR_PROPS =
  'width,height,maxHeight,minHeight,overflow,borderRadius,zIndex,x,y,top,left,right,bottom,margin,position,transform,transformOrigin';

export function queryWorkoutChrome(device: HTMLElement | null): HTMLElement[] {
  if (!device) return [];
  return Array.from(
    device.querySelectorAll<HTMLElement>(
      '.auth-llplay__sticker, .auth-llplay__controls, .auth-llplay__logotype-btn, .auth-llplay__logotype, .auth-llplay__session-dot',
    ),
  );
}

function allTargets(screen: HTMLElement, chrome: HTMLElement[]): HTMLElement[] {
  return [screen, ...chrome];
}

function kill(targets: HTMLElement[]) {
  if (targets.length === 0) return;
  gsap.killTweensOf(targets);
}

function shellEl(screen: HTMLElement): HTMLElement {
  return (
    screen.closest<HTMLElement>('.auth-llplay__device') ??
    screen.closest<HTMLElement>('.auth-llplay') ??
    screen
  );
}

function radiusPx(screen: HTMLElement): number {
  const raw = getComputedStyle(screen).borderTopLeftRadius;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 56;
}

function restoreLcdClasses(
  screen: HTMLElement,
  saved: { expanded: boolean; tween: boolean; live: boolean },
) {
  screen.classList.toggle(LCD_EXPANDED_CLASS, saved.expanded);
  screen.classList.toggle(LCD_LOG_TWEEN_CLASS, saved.tween);
  screen.classList.toggle(LCD_LOG_LIVE_CLASS, saved.live);
}

export function measureWorkoutLcd(screen: HTMLElement): {
  collapsedH: number;
  collapsedW: number;
  detailsH: number;
  logW: number;
  logH: number;
} {
  const saved = {
    expanded: screen.classList.contains(LCD_EXPANDED_CLASS),
    tween: screen.classList.contains(LCD_LOG_TWEEN_CLASS),
    live: screen.classList.contains(LCD_LOG_LIVE_CLASS),
  };
  for (const c of LCD_CLASSES) screen.classList.remove(c);

  const collapsed = screen.getBoundingClientRect();
  screen.classList.add(LCD_EXPANDED_CLASS);
  const detailsH = screen.getBoundingClientRect().height;
  screen.classList.remove(LCD_EXPANDED_CLASS);
  const shell = shellEl(screen).getBoundingClientRect();
  restoreLcdClasses(screen, saved);

  return {
    collapsedH: collapsed.height,
    collapsedW: collapsed.width,
    detailsH,
    logW: shell.width,
    logH: shell.height,
  };
}

export function applyWorkoutLogStatic(
  screen: HTMLElement,
  chrome: HTMLElement[],
  logLayer: HTMLElement | null,
  log: boolean,
) {
  kill(allTargets(screen, chrome));
  screen.classList.remove(LCD_LOG_TWEEN_CLASS, LCD_EXPANDED_CLASS);
  screen.classList.toggle(LCD_LOG_LIVE_CLASS, log);
  gsap.set(screen, { clearProps: CLEAR_PROPS });
  if (chrome.length) gsap.set(chrome, { autoAlpha: log ? 0 : 1, y: 0, x: 0 });
  if (logLayer) gsap.set(logLayer, { autoAlpha: 1, y: 0 });
}

function pinFixed(screen: HTMLElement, rect: DOMRect, radius: number) {
  gsap.set(screen, {
    position: 'fixed',
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    maxHeight: rect.height,
    margin: 0,
    borderRadius: radius,
    overflow: 'hidden',
    zIndex: 8,
    x: 0,
    y: 0,
  });
}

export function playWorkoutLogEnter(opts: {
  screen: HTMLElement;
  chrome: HTMLElement[];
  logLayer: HTMLElement | null;
}): Promise<void> {
  const { screen, chrome, logLayer } = opts;
  if (prefersReducedMotion()) {
    applyWorkoutLogStatic(screen, chrome, logLayer, true);
    return Promise.resolve();
  }

  kill(allTargets(screen, chrome));

  screen.classList.remove(LCD_EXPANDED_CLASS, LCD_LOG_LIVE_CLASS);
  const first = screen.getBoundingClientRect();
  const shell = shellEl(screen).getBoundingClientRect();
  const last = {
    left: shell.left,
    top: 0,
    width: shell.width,
    height: window.innerHeight,
  };
  const fromRadius = radiusPx(screen);

  screen.classList.add(LCD_LOG_TWEEN_CLASS);
  pinFixed(screen, first, fromRadius);
  if (logLayer) gsap.set(logLayer, { autoAlpha: 1, y: 0 });
  if (chrome.length) gsap.set(chrome, { autoAlpha: 1, y: 0 });

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      screen.classList.remove(LCD_LOG_TWEEN_CLASS);
      screen.classList.add(LCD_LOG_LIVE_CLASS);
      gsap.set(screen, { clearProps: CLEAR_PROPS });
      if (chrome.length) gsap.set(chrome, { autoAlpha: 0, y: 0 });
      resolve();
    };

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(
      screen,
      {
        left: last.left,
        top: last.top,
        width: last.width,
        height: last.height,
        maxHeight: last.height,
        borderRadius: 0,
        duration: WORKOUT_LOG_DURATION,
        ease: WORKOUT_LOG_EASE,
      },
      0,
    );
    if (chrome.length) {
      tl.to(
        chrome,
        { autoAlpha: 0, duration: WORKOUT_LOG_DURATION * 0.75, ease: WORKOUT_LOG_EASE },
        0,
      );
    }
    window.setTimeout(finish, (WORKOUT_LOG_DURATION + 0.12) * 1000);
  });
}

export function playWorkoutLogExit(opts: {
  screen: HTMLElement;
  chrome: HTMLElement[];
  logLayer: HTMLElement | null;
}): Promise<void> {
  const { screen, chrome, logLayer } = opts;
  if (prefersReducedMotion()) {
    applyWorkoutLogStatic(screen, chrome, logLayer, false);
    return Promise.resolve();
  }

  kill(allTargets(screen, chrome));
  const first = screen.getBoundingClientRect();

  gsap.set(screen, { clearProps: CLEAR_PROPS });
  screen.classList.remove(LCD_EXPANDED_CLASS, LCD_LOG_LIVE_CLASS);
  screen.classList.add(LCD_LOG_TWEEN_CLASS);
  const last = screen.getBoundingClientRect();
  const toRadius = radiusPx(screen);

  pinFixed(screen, first, 0);
  if (logLayer) gsap.set(logLayer, { autoAlpha: 1, y: 0 });
  if (chrome.length) gsap.set(chrome, { autoAlpha: 0, y: 0 });

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      applyWorkoutLogStatic(screen, chrome, logLayer, false);
      resolve();
    };

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(
      screen,
      {
        left: last.left,
        top: last.top,
        width: last.width,
        height: last.height,
        maxHeight: last.height,
        borderRadius: toRadius,
        duration: WORKOUT_LOG_DURATION,
        ease: WORKOUT_LOG_EASE,
      },
      0,
    );
    if (chrome.length) {
      tl.to(
        chrome,
        { autoAlpha: 1, duration: WORKOUT_LOG_DURATION, ease: WORKOUT_LOG_EASE },
        0,
      );
    }
    window.setTimeout(finish, (WORKOUT_LOG_DURATION + 0.12) * 1000);
  });
}
