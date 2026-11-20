import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { bootScript } from '@/lib/boot';
import { bricolage, inter } from '../fonts';
import '../globals.css';
import '../../styles/admin.css';

// Mise en page racine de l'admin : mêmes polices, jetons et thème que le site, mais hors de [locale].
// L'admin est en français seulement, jamais indexé, jamais mis en cache.
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin MoussaCode' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f2ec' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1f2a' },
  ],
};

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="adm">{children}</body>
    </html>
  );
}
