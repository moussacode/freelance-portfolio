'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/**
 * Pilote un <dialog> natif en mode modal : showModal() rend le reste de la page inerte,
 * ce qui piège le focus dans la fenêtre ; Échap la ferme. Au retour, le focus revient
 * sur l'élément qui l'avait ouverte.
 */
export function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const props = {
    ref,
    // Échap, bouton Fermer ou dialog.close() : on prévient le parent et on rend le focus.
    onClose: () => {
      closeRef.current();
      opener.current?.focus?.();
    },
    // Clic sur le voile (en dehors du contenu) : fermeture.
    onMouseDown: (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === ref.current) ref.current?.close();
    },
    // showModal() rend la page inerte, mais Tab peut encore sortir vers le navigateur :
    // on fait boucler le focus du dernier élément au premier (et l'inverse avec Maj).
    onKeyDown: (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key !== 'Tab' || !ref.current) return;
      const focusables = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0,
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !ref.current.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !ref.current.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    },
  };
  return props;
}
