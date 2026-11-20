'use client';

import type { ReactNode } from 'react';
import type { Locale } from '@/content/i18n';
import type { SiteContent } from '@/content/model';
import { ContentProvider } from './ContentContext';
import { AppProvider, useApp } from './AppContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { StickyCta } from './StickyCta';
import { Cursor } from './Cursor';

export function Shell({ locale, content, children }: { locale: Locale; content: SiteContent; children: ReactNode }) {
  return (
    <AppProvider locale={locale}>
      <ContentProvider content={content}>
        <Frame>{children}</Frame>
      </ContentProvider>
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
      <Cursor />
    </>
  );
}
