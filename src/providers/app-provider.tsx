'use client';

import { AppProvider as StoreProvider } from '@/state/store';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
