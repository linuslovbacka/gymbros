'use client';

import gsap from 'gsap';
import { Suspense, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { GameBoyShell } from '@/components/GameBoyShell';
import { LlPlayRoot } from '@/components/LlPlayRoot';
import { DetailsScreen, type DetailsTab } from '@/screens/DetailsScreen';
import { StartScreen } from '@/screens/StartScreen';
import {
  LLPLAY_CARD_SELECTOR,
  useHomeGameBoyNavigation,
} from '@/hooks/useHomeGameBoyNavigation';
import { MVP_MODE } from '@/lib/mvp';
import { prefersReducedMotion } from '@/lib/nothing-motion';
import { useApp } from '@/state/store';

const EXPANDED_CLASS = 'auth-llplay__screen--expanded';
const DURATION = 0.45;
const EASE = 'power2.out';
const SLIDE_PX = 12;

function isDetailsPath(pathname: string) {
  return pathname === '/details' || pathname.startsWith('/details/');
}

function measureScreenHeights(screen: HTMLElement): { collapsed: number; expanded: number } {
  screen.classList.remove(EXPANDED_CLASS);
  const collapsed = screen.getBoundingClientRect().height;
  screen.classList.add(EXPANDED_CLASS);
  const expanded = screen.getBoundingClientRect().height;
  screen.classList.remove(EXPANDED_CLASS);
  return { collapsed, expanded };
}

function LlPlayLcdFrameInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signOut, habitsToday } = useApp();
  const detailsRoute = isDetailsPath(pathname);

  const [detailsExpand, setDetailsExpand] = useState(detailsRoute);
  const [screenExpanded, setScreenExpanded] = useState(detailsRoute);
  const [tab, setTab] = useState<DetailsTab>(
    () => (searchParams.get('tab') === 'schedule' ? 'schedule' : 'diet'),
  );
  const [homeOnTop, setHomeOnTop] = useState(!detailsRoute);

  const shellScreenRef = useRef<HTMLDivElement>(null);
  const homeLayerRef = useRef<HTMLDivElement>(null);
  const detailsLayerRef = useRef<HTMLDivElement>(null);
  const homeScrollRef = useRef<HTMLDivElement>(null);
  const detailsScrollRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const didMountRef = useRef(false);
  const prevPathRef = useRef(pathname);

  const applyStatic = useCallback((details: boolean) => {
    const screen = shellScreenRef.current;
    const home = homeLayerRef.current;
    const detailsEl = detailsLayerRef.current;
    if (!screen || !home || !detailsEl) return;

    gsap.killTweensOf([screen, home, detailsEl]);
    if (details) {
      screen.classList.add(EXPANDED_CLASS);
      gsap.set(home, { autoAlpha: 0, y: 0 });
      gsap.set(detailsEl, { autoAlpha: 1, y: 0 });
    } else {
      screen.classList.remove(EXPANDED_CLASS);
      gsap.set(home, { autoAlpha: 1, y: 0 });
      gsap.set(detailsEl, { autoAlpha: 0, y: 0 });
    }
    gsap.set(screen, { clearProps: 'height,maxHeight,overflow' });
    setDetailsExpand(details);
    setScreenExpanded(details);
    setHomeOnTop(!details);
  }, []);

  useLayoutEffect(() => {
    const details = isDetailsPath(pathname);
    const screen = shellScreenRef.current;
    const home = homeLayerRef.current;
    const detailsEl = detailsLayerRef.current;
    if (!screen || !home || !detailsEl) return;

    if (!didMountRef.current) {
      didMountRef.current = true;
      prevPathRef.current = pathname;
      applyStatic(details);
      return;
    }

    if (prevPathRef.current === pathname) return;
    const wasDetails = isDetailsPath(prevPathRef.current);
    prevPathRef.current = pathname;
    if (wasDetails === details) {
      applyStatic(details);
      return;
    }

    if (prefersReducedMotion()) {
      applyStatic(details);
      return;
    }

    if (busyRef.current) {
      applyStatic(details);
      return;
    }

    busyRef.current = true;
    gsap.killTweensOf([screen, home, detailsEl]);

    const fromH = screen.getBoundingClientRect().height;
    const { collapsed, expanded } = measureScreenHeights(screen);
    const toH = details ? expanded : collapsed;
    const outgoing = details ? home : detailsEl;
    const incoming = details ? detailsEl : home;

    setScreenExpanded(false);
    setDetailsExpand(true);
    setHomeOnTop(!details);
    screen.classList.remove(EXPANDED_CLASS);

    gsap.set(screen, { height: fromH, maxHeight: fromH, overflow: 'hidden' });
    gsap.set(outgoing, { autoAlpha: 1, y: 0 });
    gsap.set(incoming, { autoAlpha: 0, y: details ? SLIDE_PX : -SLIDE_PX });

    const tl = gsap.timeline({
      onComplete: () => {
        if (details) screen.classList.add(EXPANDED_CLASS);
        else screen.classList.remove(EXPANDED_CLASS);
        gsap.set(screen, { clearProps: 'height,maxHeight,overflow' });
        gsap.set(outgoing, { autoAlpha: 0, y: 0 });
        gsap.set(incoming, { autoAlpha: 1, y: 0 });
        setScreenExpanded(details);
        setDetailsExpand(details);
        setHomeOnTop(!details);
        busyRef.current = false;
      },
    });

    tl.to(
      screen,
      { height: toH, maxHeight: toH, duration: DURATION, ease: EASE },
      0,
    );
    tl.to(
      outgoing,
      { autoAlpha: 0, y: details ? -SLIDE_PX : SLIDE_PX, duration: DURATION, ease: EASE },
      0,
    );
    tl.to(
      incoming,
      { autoAlpha: 1, y: 0, duration: DURATION, ease: EASE },
      0,
    );
  }, [pathname, applyStatic]);

  const goHome = useCallback(() => {
    if (busyRef.current) return;
    if (!isDetailsPath(pathname)) return;
    router.push('/');
  }, [pathname, router]);

  const goDetails = useCallback(() => {
    if (busyRef.current) return;
    if (isDetailsPath(pathname)) {
      setTab((t) => (t === 'diet' ? 'schedule' : 'diet'));
      return;
    }
    router.push('/details');
  }, [pathname, router]);

  const goTrain = useCallback(() => {
    if (busyRef.current) return;
    if (habitsToday?.sick) return;
    router.push('/workout');
  }, [habitsToday?.sick, router]);

  const getFocusables = useCallback(() => {
    const root = isDetailsPath(pathname) ? detailsLayerRef.current : homeLayerRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        `${LLPLAY_CARD_SELECTOR}, button:not([disabled]), a, input, select, textarea`,
      ),
    );
  }, [pathname]);

  const onBack = useCallback(() => {
    if (isDetailsPath(pathname)) {
      goHome();
      return;
    }
    (document.activeElement as HTMLElement | null)?.blur();
  }, [pathname, goHome]);

  const { handlePad, handleEnter, handleBack } = useHomeGameBoyNavigation({
    focusables: getFocusables,
    onBack,
  });

  if (!MVP_MODE) return <>{children}</>;

  return (
    <LlPlayRoot>
      <GameBoyShell
        onPad={handlePad}
        onEnter={handleEnter}
        onBack={handleBack}
        onStart={goTrain}
        onDetails={goDetails}
        sessionActive
        onLogout={() => void signOut()}
        screenVariant={screenExpanded ? 'expanded' : 'default'}
        detailsExpand={detailsExpand}
        screenRef={shellScreenRef}
        onLogotypeClick={goHome}
      >
        <div className="llplay-lcd-layers">
          <StartScreen
            framed
            layerRef={homeLayerRef}
            scrollBodyRef={homeScrollRef}
            layerZ={homeOnTop ? 2 : 1}
            onTrain={goTrain}
          />
          <DetailsScreen
            framed
            tab={tab}
            onTab={setTab}
            onHome={goHome}
            layerRef={detailsLayerRef}
            scrollBodyRef={detailsScrollRef}
            layerZ={homeOnTop ? 1 : 2}
          />
        </div>
      </GameBoyShell>
    </LlPlayRoot>
  );
}

export function LlPlayLcdFrame({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LlPlayLcdFrameInner>{children}</LlPlayLcdFrameInner>
    </Suspense>
  );
}
