'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ToastInput = {
  message: string;
  /** Si présent, le toast propose « Annuler ». */
  undo?: () => void | Promise<void>;
  tone?: 'info' | 'error';
};
type Toast = ToastInput & { id: number };

const Ctx = createContext<((t: ToastInput) => void) | null>(null);

/** Affiche un toast discret après une action : useToast()({ message, undo }). */
export const useToast = () => {
  const toast = useContext(Ctx);
  if (!toast) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return toast;
};

const DURATION = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const toast = useCallback((t: ToastInput) => {
    const id = next.current++;
    // Trois toasts au plus à l'écran.
    setToasts((list) => [...list.slice(-2), { ...t, id }]);
  }, []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => dismiss(t.id)} onUndone={() => toast({ message: 'Action annulée.' })} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onDone, onUndone }: { toast: Toast; onDone: () => void; onUndone: () => void }) {
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  // Disparaît seul, sauf pendant le survol ou si le focus est dedans.
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => done.current(), DURATION);
    return () => window.clearTimeout(timer);
  }, [paused]);

  const undo = async () => {
    if (!toast.undo) return;
    setBusy(true);
    try {
      await toast.undo();
      onDone();
      onUndone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`adm-toast glass${toast.tone === 'error' ? ' adm-toast--error' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {toast.tone === 'error' && <span className="adm-error__badge" aria-hidden="true" />}
      <p className="adm-toast__msg">{toast.message}</p>
      {toast.undo && (
        <button type="button" className="adm-toast__undo" onClick={undo} disabled={busy}>
          Annuler
        </button>
      )}
      <button type="button" className="adm-icon-btn adm-icon-btn--small" onClick={onDone} aria-label="Fermer la notification">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
