'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GameBoyShell } from '@/components/GameBoyShell';
import { useAuthGameBoyNavigation } from '@/hooks/useAuthGameBoyNavigation';
import { gameBoyPress } from '@/lib/gameboy-motion';
import { useApp } from '../state/store';

export function UpdatePasswordScreen() {
  const router = useRouter();
  const { updatePassword, signOut } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [busy, setBusy] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const getFocusables = useCallback(
    () => [passwordRef.current, confirmRef.current, submitRef.current, cancelRef.current],
    [],
  );

  const onEnter = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active?.tagName === 'BUTTON' && active !== submitRef.current) {
      gameBoyPress(active);
      active.click();
      return;
    }
    formRef.current?.requestSubmit();
  }, []);

  const goCancel = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const onBack = useCallback(() => {
    void goCancel();
  }, [goCancel]);

  const { handlePad, handleEnter, handleBack } = useAuthGameBoyNavigation({
    focusables: getFocusables,
    onEnter,
    onBack,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setInfo(undefined);
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setInfo('Password saved.');
    window.setTimeout(() => router.replace('/'), 400);
  }

  return (
    <GameBoyShell onPad={handlePad} onEnter={handleEnter} onBack={handleBack} sessionActive={false}>
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
            <p className="auth-llplay__form-label">New password</p>
            <input
              ref={passwordRef}
              className="auth-llplay__field"
              type="password"
              placeholder="New password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <input
              ref={confirmRef}
              className="auth-llplay__field"
              type="password"
              placeholder="Confirm password"
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
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
              Save password
            </button>
            <button
              ref={cancelRef}
              type="button"
              className="auth-llplay__toggle auth-llplay__pressable"
              disabled={busy}
              onClick={(e) => {
                gameBoyPress(e.currentTarget);
                void goCancel();
              }}
            >
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </GameBoyShell>
  );
}
