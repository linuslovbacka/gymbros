'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/state/store';
import { UpdatePasswordScreen } from '@/screens/UpdatePasswordScreen';
import { LlPlayLoadingGate } from '@/components/LlPlayLoadingGate';

function UpdatePasswordContent() {
  const { ready, user, passwordRecovery } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRecoveryLink = searchParams.get('recovery') === '1';

  const allowReset = passwordRecovery || fromRecoveryLink;

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (!allowReset) router.replace('/');
  }, [ready, user, allowReset, router]);

  const blocking = !ready || !user || !allowReset;
  const message = ready ? 'Redirecting…' : undefined;

  return (
    <LlPlayLoadingGate blocking={blocking} message={message}>
      <UpdatePasswordScreen />
    </LlPlayLoadingGate>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <LlPlayLoadingGate blocking message={undefined}>
          {null}
        </LlPlayLoadingGate>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}
