'use client';

import type { ReactNode } from 'react';
import type { Locale } from '@/content/i18n';
import { AppProvider, useApp } from './AppContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { StickyCta } from './StickyCta';

export function Shell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <AppProvider locale={locale}>
      <Frame>{children}</Frame>
    </AppProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { dict, epoch } = useApp();
  return (
    <>
      <a className="skip" href="#main">
        {dict.a11y.skip}
      </a>
      <Header />
      <main id="main" key={epoch}>
        {children}
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
