'use client';

import { AuthGate } from '@/components/auth-gate';
import { AuthScreen } from '@/screens/AuthScreen';

export default function LoginPage() {
  return (
    <AuthGate mode="guest">
      <AuthScreen />
    </AuthGate>
  );
}
