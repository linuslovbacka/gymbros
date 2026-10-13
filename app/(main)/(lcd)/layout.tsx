'use client';

import { LlPlayLcdFrame } from '@/components/LlPlayLcdFrame';

export default function LcdLayout({ children }: { children: React.ReactNode }) {
  return <LlPlayLcdFrame>{children}</LlPlayLcdFrame>;
}
