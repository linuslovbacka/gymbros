'use client';

import { AuthGate } from '@/components/auth-gate';
import { ScreenEnter } from '@/components/ScreenEnter';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate mode="paired">
      <ScreenEnter>{children}</ScreenEnter>
    </AuthGate>
  );
}
