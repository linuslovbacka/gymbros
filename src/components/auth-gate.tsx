'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/state/store';
import { LoadingGate } from '@/components/loading-gate';

type GateMode = 'guest' | 'auth' | 'paired';

export function AuthGate({ mode, children }: { mode: GateMode; children: React.ReactNode }) {
  const { ready, user, profile, passwordRecovery } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    if (passwordRecovery) {
      router.replace('/update-password');
      return;
    }

    if (mode === 'guest') {
      if (user) router.replace(profile?.pair_id ? '/' : '/pair');
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!profile) return;

    if (mode === 'auth') {
      if (profile.pair_id) router.replace('/');
      return;
    }

    if (mode === 'paired' && !profile.pair_id) {
      router.replace('/pair');
    }
  }, [ready, user, profile, passwordRecovery, mode, router]);

  if (!ready) return <LoadingGate />;

  if (passwordRecovery && mode !== 'guest') return <LoadingGate message="Redirecting…" />;

  if (mode === 'guest') {
    if (user) return <LoadingGate message="Redirecting…" />;
    return <>{children}</>;
  }

  if (!user) return <LoadingGate message="Redirecting…" />;
  if (!profile) return <LoadingGate message="Loading your locker…" />;

  if (mode === 'auth' && profile.pair_id) return <LoadingGate message="Redirecting…" />;

  if (mode === 'paired' && !profile.pair_id) return <LoadingGate message="Redirecting…" />;

  return <>{children}</>;
}
