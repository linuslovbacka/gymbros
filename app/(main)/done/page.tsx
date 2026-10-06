'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DoneScreen } from '@/screens/DoneScreen';
import { clearSessionDraft, loadSessionDraft } from '@/lib/session-draft';
import type { SessionDraft } from '@/screens/WorkoutScreen';
import { LoadingGate } from '@/components/loading-gate';

export default function DonePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SessionDraft | null>(null);

  useEffect(() => {
    const d = loadSessionDraft();
    if (!d) router.replace('/');
    else setDraft(d);
  }, [router]);

  if (!draft) return <LoadingGate message="Loading session…" />;

  return (
    <DoneScreen
      draft={draft}
      onClose={() => {
        clearSessionDraft();
        router.push('/');
      }}
    />
  );
}
