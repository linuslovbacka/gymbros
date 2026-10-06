'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkoutScreen } from '@/screens/WorkoutScreen';
import { saveSessionDraft } from '@/lib/session-draft';
import { useApp } from '@/state/store';
import { LoadingGate } from '@/components/loading-gate';

export default function WorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routineParam = searchParams.get('routine');
  const { ready, habitsToday } = useApp();

  useEffect(() => {
    if (!ready) return;
    if (habitsToday?.sick) router.replace('/');
  }, [ready, habitsToday?.sick, router]);

  if (!ready) return <LoadingGate />;
  if (habitsToday?.sick) return <LoadingGate message="Rest day…" />;

  return (
    <WorkoutScreen
      initialRoutineParam={routineParam}
      onFinish={(draft) => {
        saveSessionDraft(draft);
        router.push('/done');
      }}
      onCancel={() => router.push('/')}
    />
  );
}
