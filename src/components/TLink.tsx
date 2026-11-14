'use client';

import Link from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';
import { useApp } from './AppContext';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  /** Élément qui se transforme en visuel de la page d'arrivée (view transition). */
  morph?: () => HTMLElement | null;
  morphName?: string;
};

/** Lien interne : même comportement que next/link, avec une transition de page quand le navigateur le permet. */
export function TLink({ href, morph, morphName = 'cover', onClick, children, ...rest }: Props) {
  const { navigate } = useApp();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(href, morph ? { el: morph(), name: morphName } : undefined);
  };
  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
