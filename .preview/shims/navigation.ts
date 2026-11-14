import { routerStore, usePath } from './router';

export const usePathname = () => usePath();
export function useRouter() {
  return {
    push(href: string) {
      const [p, hash] = href.split('#');
      if (p) {
        routerStore.set(p);
        if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    replace(href: string) {
      this.push(href);
    },
    back() {},
    forward() {},
    refresh() {},
    prefetch() {},
  };
}
export function notFound(): never {
  throw new Error('not found');
}
