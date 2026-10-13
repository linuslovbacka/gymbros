import type { Viewport } from 'next';
import { LlPlayRoot } from '@/components/LlPlayRoot';

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <LlPlayRoot>{children}</LlPlayRoot>;
}
