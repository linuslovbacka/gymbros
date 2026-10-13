'use client';

import localFont from 'next/font/local';

const helveticaNeueLlPlay = localFont({
  src: [
    {
      path: '../../public/fonts/helvetica-neue/HelveticaNeue-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/helvetica-neue/HelveticaNeue-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/helvetica-neue/HelveticaNeue-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-llplay',
});

export function LlPlayRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className={`auth-llplay-root ${helveticaNeueLlPlay.variable} ${helveticaNeueLlPlay.className}`}>
      {children}
    </div>
  );
}
