import type { Metadata, Viewport } from 'next';
import { DotGothic16, Inter } from 'next/font/google';
import { AppProvider } from '@/providers/app-provider';
import './globals.css';

const dotGothic = DotGothic16({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dot',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'GYMBROS',
  description: 'Two bros. One rivalry. Infinite gains.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'GYMBROS',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#ececec',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dotGothic.variable} ${inter.variable} h-full`}>
      <body className="min-h-full antialiased nothing-ui">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
