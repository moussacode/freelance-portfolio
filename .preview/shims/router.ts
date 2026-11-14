// Remplace le routeur Next.js dans l'aperçu : la page courante est gardée en mémoire,
// le hash de l'URL ne sert qu'aux ancres de section (#projets, #contact…).
import { useSyncExternalStore } from 'react';

let path = '/fr';
const subs = new Set<() => void>();
export const routerStore = {
  get: () => path,
  set(next: string) {
    if (next === path) return;
    path = next;
    subs.forEach((s) => s());
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};
export const usePath = () => useSyncExternalStore(routerStore.subscribe, routerStore.get, routerStore.get);
