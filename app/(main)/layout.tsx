'use client';

import { AuthGate } from '@/components/auth-gate';
import { ScreenEnter } from '@/components/ScreenEnter';
import { MVP_MODE } from '@/lib/mvp';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate mode="paired">
      {MVP_MODE ? children : <ScreenEnter>{children}</ScreenEnter>}
    </AuthGate>
  );
}
