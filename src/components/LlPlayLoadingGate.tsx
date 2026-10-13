'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/lib/nothing-motion';

const EXIT_DURATION = 0.85;
const EXIT_EASE = 'power5.inOut';
const LOADER_ACTIVE_CLASS = 'auth-llplay-loading-active';

/** LL PLAY loader — white frame + black column slide up (1903:7735), page transparent underneath. */
export function LlPlayLoadingGate({
  blocking,
  message,
  children,
}: {
  blocking: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  const [loaderMounted, setLoaderMounted] = useState(blocking);
  const [canPortal, setCanPortal] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const exitStartedRef = useRef(false);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (loaderMounted) {
      root.classList.add(LOADER_ACTIVE_CLASS);
    } else {
      root.classList.remove(LOADER_ACTIVE_CLASS);
    }
    return () => root.classList.remove(LOADER_ACTIVE_CLASS);
  }, [loaderMounted]);

  useEffect(() => {
    if (blocking) {
      exitStartedRef.current = false;
      setLoaderMounted(true);
      const slide = slideRef.current;
      if (slide) gsap.set(slide, { y: 0, force3D: true });
      return;
    }

    if (!loaderMounted || exitStartedRef.current) return;

    const slide = slideRef.current;
    exitStartedRef.current = true;

    if (!slide || prefersReducedMotion()) {
      setLoaderMounted(false);
      return;
    }

    const tween = gsap.to(slide, {
      y: () => -(slide.offsetHeight || window.innerHeight),
      duration: EXIT_DURATION,
      ease: EXIT_EASE,
      force3D: true,
      onComplete: () => setLoaderMounted(false),
    });

    return () => {
      tween.kill();
    };
  }, [blocking, loaderMounted]);

  const loader = loaderMounted ? (
    <div className="auth-llplay-loading-portal">
      <div ref={slideRef} className="auth-llplay-loading__slide">
        <div className="auth-llplay-loading auth-llplay-loading--gate">
          <div className="auth-llplay-loading__panel">
            <Image
              src="/ui/login/logo-barbell.svg"
              alt=""
              width={79}
              height={79}
              className="auth-llplay-loading__logo"
              priority
            />
            {message ? <span className="auth-llplay-loading__sr">{message}</span> : null}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {!blocking ? children : null}
      {canPortal && loader ? createPortal(loader, document.body) : null}
    </>
  );
}
