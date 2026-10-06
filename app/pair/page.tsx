'use client';

import { AuthGate } from '@/components/auth-gate';
import { PairScreen } from '@/screens/PairScreen';

export default function PairPage() {
  return (
    <AuthGate mode="auth">
      <PairScreen />
    </AuthGate>
  );
}
