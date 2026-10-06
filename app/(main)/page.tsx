'use client';

import { useRouter } from 'next/navigation';
import { StartScreen } from '@/screens/StartScreen';
import { MVP_MODE } from '@/lib/mvp';

export default function HomePage() {
  const router = useRouter();

  return (
    <StartScreen
      onTrain={() => router.push('/workout')}
      onLocker={MVP_MODE ? undefined : () => router.push('/locker')}
      onSchedule={() => router.push('/schedule')}
    />
  );
}
