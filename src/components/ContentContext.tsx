'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SiteContent } from '@/content/model';

/** Contenu modifiable (services, réalisations, questions, avis, réglages), chargé côté serveur par le layout. */
const Ctx = createContext<SiteContent | null>(null);

export function ContentProvider({ content, children }: { content: SiteContent; children: ReactNode }) {
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

export const useContent = () => {
  const content = useContext(Ctx);
  if (!content) throw new Error('useContent doit être utilisé dans <ContentProvider>');
  return content;
};
