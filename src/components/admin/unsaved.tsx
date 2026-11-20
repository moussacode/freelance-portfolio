'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

type Ctx = {
  /** Une page déclare son nombre de modifications non enregistrées (0 = rien en attente). */
  report: (count: number) => void;
  /** Exécute `go` tout de suite, ou après confirmation s'il reste des modifications non enregistrées. */
  guard: (go: () => void) => void;
  /** Vrai s'il reste des modifications non enregistrées. */
  blocked: () => boolean;
};

const UnsavedCtx = createContext<Ctx | null>(null);

const useCtx = () => {
  const ctx = useContext(UnsavedCtx);
  if (!ctx) throw new Error('À utiliser dans <UnsavedProvider>');
  return ctx;
};

/**
 * Garde contre la perte de modifications :
 * - changement de section (menu, recherche, déconnexion) → confirmation ;
 * - fermeture ou rechargement de l'onglet → alerte du navigateur.
 */
export function UnsavedProvider({ children }: { children: ReactNode }) {
  const count = useRef(0);
  const [pending, setPending] = useState<{ go: () => void; n: number } | null>(null);

  const report = useCallback((n: number) => {
    count.current = n;
  }, []);

  const guard = useCallback((go: () => void) => {
    if (count.current > 0) setPending({ go, n: count.current });
    else go();
  }, []);
  const blocked = useCallback(() => count.current > 0, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (count.current > 0) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  return (
    <UnsavedCtx.Provider value={{ report, guard, blocked }}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        title="Modifications non enregistrées"
        confirmLabel="Quitter sans enregistrer"
        cancelLabel="Rester sur la page"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const go = pending?.go;
          count.current = 0;
          setPending(null);
          go?.();
        }}
      >
        <p>
          {pending?.n === 1
            ? 'Une modification n’est pas enregistrée. Si vous quittez cette page, elle sera perdue.'
            : `${pending?.n} modifications ne sont pas enregistrées. Si vous quittez cette page, elles seront perdues.`}
        </p>
      </ConfirmDialog>
    </UnsavedCtx.Provider>
  );
}

/** Déclare les modifications en attente de la page (et les retire en quittant la page). */
export function useUnsavedChanges(count: number) {
  const { report } = useCtx();
  useEffect(() => {
    report(count);
  }, [count, report]);
  useEffect(() => () => report(0), [report]);
}

/** Pour la navigation : `guard(go)` passe par la confirmation si nécessaire, `blocked()` dit s'il le faudra. */
export const useLeaveGuard = () => {
  const { guard, blocked } = useCtx();
  return { guard, blocked };
};

/**
 * Lien interne de l'admin protégé : avec des modifications en attente, le clic ouvre la confirmation
 * au lieu de naviguer. Ctrl/⌘/Maj+clic (nouvel onglet) ne sont pas interceptés.
 */
export function useGuardedClick(href: string, navigate: (href: string) => void) {
  const { guard, blocked } = useLeaveGuard();
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!blocked()) return;
    e.preventDefault();
    guard(() => navigate(href));
  };
}
