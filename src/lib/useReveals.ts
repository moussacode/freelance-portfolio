'use client';

import type { RefObject } from 'react';
import { gsap, motionOK, ScrollTrigger, SplitText, useGSAP } from './gsap';

/**
 * Animations au défilement d'une page :
 * - [data-split] : le titre se dévoile ligne par ligne (SplitText, avec masque) ;
 * - [data-rows] : les lignes d'une liste arrivent l'une après l'autre, une seule fois.
 * Rien n'est caché en CSS : sans JavaScript ou en version calme, tout le contenu est visible.
 */
export function useReveals(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    (_context, contextSafe) => {
      if (!motionOK() || !contextSafe) return;
      const root = scope.current;
      if (!root) return;

      const setup = contextSafe(() => {
        root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
          SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 105,
                duration: 1,
                ease: 'expo.out',
                stagger: 0.09,
                scrollTrigger: { trigger: el, start: 'top 88%', once: true },
              }),
          });
        });

        root.querySelectorAll<HTMLElement>('[data-rows]').forEach((group) => {
          gsap.from(group.children, {
            y: 24,
            autoAlpha: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.07,
            scrollTrigger: { trigger: group, start: 'top 85%', once: true },
          });
        });
        ScrollTrigger.refresh();
      });

      // On attend les polices : le découpage en lignes dépend de leur largeur réelle.
      let cancelled = false;
      document.fonts.ready.then(() => !cancelled && setup());
      return () => {
        cancelled = true;
      };
    },
    { scope, dependencies: deps },
  );
}
