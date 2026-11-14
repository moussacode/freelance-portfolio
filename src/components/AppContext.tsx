'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/content/i18n';
import { getDict, type Dict } from '@/content/ui';
import { motionOK } from '@/lib/gsap';

export type Theme = 'light' | 'dark';

type Morph = { el: HTMLElement | null; name: string };

type App = {
  locale: Locale;
  dict: Dict;
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  calm: boolean;
  setCalm: (calm: boolean) => void;
  /** Change de clé quand le niveau d'animation change : la page se remonte et relance ses animations. */
  epoch: number;
  navigate: (href: string, morph?: Morph) => void;
};

const Ctx = createContext<App | null>(null);

export const useApp = () => {
  const app = useContext(Ctx);
  if (!app) throw new Error('useApp doit être utilisé dans <AppProvider>');
  return app;
};

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type VTDocument = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { ready: Promise<void>; finished: Promise<void> };
};

export function AppProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dict = useMemo(() => getDict(locale), [locale]);

  /* ---------- Thème ---------- */
  const [theme, setTheme] = useState<Theme>('light');
  useIsoLayoutEffect(() => {
    const read = (): Theme => {
      const forced = document.documentElement.dataset.theme;
      if (forced === 'light' || forced === 'dark') return forced;
      return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    setTheme(read());
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTheme(read());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const root = document.documentElement;
      const next: Theme = theme === 'dark' ? 'light' : 'dark';
      const apply = () => {
        root.dataset.theme = next;
        try {
          localStorage.setItem('mc-theme', next);
        } catch {}
        flushSync(() => setTheme(next));
      };
      const doc = document as VTDocument;
      if (!doc.startViewTransition || !motionOK()) return apply();

      // Le nouveau thème s'ouvre en cercle depuis le bouton.
      const x = origin?.x ?? innerWidth - 80;
      const y = origin?.y ?? 40;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('vt-theme');
      const vt = doc.startViewTransition(apply);
      vt.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 700, easing: 'cubic-bezier(.65,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
          );
        })
        .catch(() => {});
      vt.finished.finally(() => root.classList.remove('vt-theme'));
    },
    [theme],
  );

  /* ---------- Animations réduites ---------- */
  const [calm, setCalmState] = useState(false);
  const [epoch, setEpoch] = useState(0);
  useIsoLayoutEffect(() => setCalmState(document.documentElement.dataset.motion === 'calm'), []);
  const setCalm = useCallback((value: boolean) => {
    document.documentElement.dataset.motion = value ? 'calm' : 'full';
    try {
      localStorage.setItem('mc-motion', value ? 'calm' : 'full');
    } catch {}
    setCalmState(value);
    setEpoch((n) => n + 1);
  }, []);

  /* ---------- Navigation avec transition ---------- */
  const pending = useRef<(() => void) | null>(null);
  const pendingHash = useRef<string | null>(null);

  useIsoLayoutEffect(() => {
    pending.current?.();
    pending.current = null;
    const hash = pendingHash.current;
    pendingHash.current = null;
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
  }, [pathname]);

  const navigate = useCallback(
    (href: string, morph?: Morph) => {
      const [path, hash] = href.split('#');
      const here = pathname.replace(/\/$/, '') || '/';

      // Même page : on fait seulement défiler jusqu'à la section.
      if (path === here || path === '') {
        const target = hash ? document.getElementById(hash) : null;
        if (target) target.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto' });
        else window.scrollTo({ top: 0, behavior: motionOK() ? 'smooth' : 'auto' });
        return;
      }

      pendingHash.current = hash || null;
      const doc = document as VTDocument;
      if (!doc.startViewTransition || !motionOK()) {
        router.push(path);
        return;
      }

      // Si un visuel est fourni, il se transforme en visuel de la page d'arrivée.
      if (morph?.el) morph.el.style.setProperty('view-transition-name', morph.name);
      const root = document.documentElement;
      root.classList.add('vt-nav');
      const vt = doc.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            pending.current = resolve;
            router.push(path);
            window.setTimeout(resolve, 1500); // filet de sécurité
          }),
      );
      vt.finished.finally(() => {
        root.classList.remove('vt-nav');
        morph?.el?.style.removeProperty('view-transition-name');
      });
    },
    [pathname, router],
  );

  const value = useMemo<App>(
    () => ({ locale, dict, theme, toggleTheme, calm, setCalm, epoch, navigate }),
    [locale, dict, theme, toggleTheme, calm, setCalm, epoch, navigate],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
