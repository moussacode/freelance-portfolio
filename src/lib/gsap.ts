'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

/**
 * Vrai si les animations sont autorisées.
 * data-motion est posé avant le premier rendu par le script de démarrage (voir lib/boot.ts) :
 * "calm" si la personne a réduit les animations dans son système ou dans le pied de page.
 */
export const motionOK = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.motion !== 'calm';

export { gsap, ScrollTrigger, SplitText, useGSAP };
