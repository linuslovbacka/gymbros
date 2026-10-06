'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/state/store';
import { UpdatePasswordScreen } from '@/screens/UpdatePasswordScreen';
import { LoadingGate } from '@/components/loading-gate';

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

  if (!ready) return <LoadingGate />;
  if (!user || !allowReset) return <LoadingGate message="Redirecting…" />;

  return <UpdatePasswordScreen />;
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<LoadingGate />}>
      <UpdatePasswordContent />
    </Suspense>
  );
}
