'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { GameBoyShell } from '@/components/GameBoyShell';
import { useAuthGameBoyNavigation } from '@/hooks/useAuthGameBoyNavigation';
import { gameBoyPress } from '@/lib/gameboy-motion';
import { useApp } from '../state/store';

type Mode = 'in' | 'up' | 'forgot';

export function AuthScreen() {
  const { signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('in');
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [busy, setBusy] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const forgotRef = useRef<HTMLButtonElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(undefined);
    setInfo(undefined);
    if (next === 'forgot') setPassword('');
  }

  const getFocusables = useCallback(() => {
    if (mode === 'forgot') {
      return [emailRef.current, submitRef.current, toggleRef.current];
    }
    if (mode === 'up') {
      return [emailRef.current, passwordRef.current, submitRef.current, toggleRef.current];
    }
    return [
      emailRef.current,
      passwordRef.current,
      forgotRef.current,
      submitRef.current,
      toggleRef.current,
    ];
  }, [mode]);

  const onEnter = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active?.tagName === 'BUTTON' && active !== submitRef.current) {
      gameBoyPress(active);
      active.click();
      return;
    }
    formRef.current?.requestSubmit();
  }, []);

  const onBack = useCallback(() => {
    if (mode === 'forgot' || mode === 'up') {
      switchMode('in');
      return;
    }
    (document.activeElement as HTMLElement | null)?.blur();
  }, [mode]);

  const { handlePad, handleEnter, handleBack } = useAuthGameBoyNavigation({
    focusables: getFocusables,
    onEnter,
    onBack,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setInfo(undefined);
    setBusy(true);

    if (mode === 'forgot') {
      const { error: err } = await resetPasswordForEmail(email);
      setBusy(false);
      if (err) setError(err);
      else setInfo('Check your email for a reset link.');
      return;
    }

    const fn = mode === 'in' ? signInWithEmail : signUpWithEmail;
    const { error: err } = await fn(email, password);
    setBusy(false);
    if (err) setError(err);
    else if (mode === 'up') setInfo('Check your email to confirm, then sign in.');
  }

  const formLabel =
    mode === 'forgot' ? 'Reset' : mode === 'up' ? 'Sign up' : 'Sign in';
  const submitLabel =
    mode === 'forgot' ? 'Send reset link' : mode === 'in' ? 'Sign in' : 'Create account';
  const toggleLabel =
    mode === 'forgot'
      ? 'Back to sign in'
      : mode === 'in'
        ? 'No account? Sign up.'
        : 'Have an account? Sign in.';

  return (
    <GameBoyShell
      onPad={handlePad}
      onEnter={handleEnter}
      onBack={handleBack}
      sessionActive={false}
    >
      <div className="auth-llplay__screen-inner">
        <Image
          src="/ui/login/logo-barbell.svg"
          alt=""
          width={79}
          height={79}
          className="auth-llplay__logo"
          priority
        />

        <h1 className="auth-llplay__tagline">
          Two bros.
          <br />
          One rivalry.
          <br />
          Infinite gains.
        </h1>

        <form ref={formRef} className="auth-llplay__form" onSubmit={submit}>
          <div className="auth-llplay__form-fields">
            <p className="auth-llplay__form-label">{formLabel}</p>
            <input
              ref={emailRef}
              className="auth-llplay__field"
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {mode !== 'forgot' && (
              <input
                ref={passwordRef}
                className="auth-llplay__field"
                type="password"
                placeholder="Password"
                value={password}
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
            {mode === 'in' && (
              <button
                ref={forgotRef}
                type="button"
                className="auth-llplay__link auth-llplay__pressable"
                onClick={(e) => {
                  gameBoyPress(e.currentTarget);
                  switchMode('forgot');
                }}
              >
                Forgot password?
              </button>
            )}
            {error && <p className="auth-llplay__error">{error}</p>}
            {info && <p className="auth-llplay__info">{info}</p>}
          </div>

          <div className="auth-llplay__actions">
            <button
              ref={submitRef}
              className="auth-llplay__submit auth-llplay__pressable"
              disabled={busy}
              type="submit"
              onClick={(e) => gameBoyPress(e.currentTarget)}
            >
              {submitLabel}
            </button>
            <button
              ref={toggleRef}
              type="button"
              className="auth-llplay__toggle auth-llplay__pressable"
              onClick={(e) => {
                gameBoyPress(e.currentTarget);
                if (mode === 'forgot') switchMode('in');
                else switchMode(mode === 'in' ? 'up' : 'in');
              }}
            >
              {toggleLabel}
            </button>
          </div>
        </form>

      </div>
    </GameBoyShell>
  );
}
