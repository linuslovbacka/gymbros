'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/state/store';
import { LlPlayLoadingGate } from '@/components/LlPlayLoadingGate';

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

  const { blocking, message } = useMemo(() => {
    if (!ready) return { blocking: true, message: undefined as string | undefined };

    if (passwordRecovery && mode !== 'guest') {
      return { blocking: true, message: 'Redirecting…' };
    }

    if (mode === 'guest') {
      if (user) return { blocking: true, message: 'Redirecting…' };
      return { blocking: false, message: undefined };
    }

    if (!user) return { blocking: true, message: 'Redirecting…' };
    if (!profile) return { blocking: true, message: 'Loading your locker…' };
    if (mode === 'auth' && profile.pair_id) return { blocking: true, message: 'Redirecting…' };
    if (mode === 'paired' && !profile.pair_id) return { blocking: true, message: 'Redirecting…' };

    return { blocking: false, message: undefined };
  }, [ready, user, profile, passwordRecovery, mode]);

  return (
    <LlPlayLoadingGate blocking={blocking} message={message}>
      {children}
    </LlPlayLoadingGate>
  );
}
