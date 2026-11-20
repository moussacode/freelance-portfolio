'use client';

import { useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useModalDialog } from './useModalDialog';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** modal : petite fenêtre centrée ; panel : panneau latéral à droite. Jamais de long formulaire dans une modale. */
  variant?: 'modal' | 'panel';
  children: ReactNode;
  footer?: ReactNode;
};

/** Fenêtre ou panneau flottant (verre), focus piégé, Échap pour fermer. */
export function Dialog({ open, onClose, title, description, variant = 'modal', children, footer }: Props) {
  const id = useId();
  const dialog = useModalDialog(open, onClose);
  return (
    <dialog
      {...dialog}
      className={`adm-dialog adm-dialog--${variant} glass`}
      aria-labelledby={`${id}-t`}
      aria-describedby={description ? `${id}-d` : undefined}
    >
      {open && (
        <div className="adm-dialog__in">
          <header className="adm-dialog__head">
            <div>
              <h2 id={`${id}-t`} className="adm-dialog__title">
                {title}
              </h2>
              {description && (
                <p id={`${id}-d`} className="adm-muted">
                  {description}
                </p>
              )}
            </div>
            <button type="button" className="adm-icon-btn" onClick={() => dialog.ref.current?.close()} aria-label="Fermer">
              <X aria-hidden="true" />
            </button>
          </header>
          <div className="adm-dialog__body">{children}</div>
          {footer && <footer className="adm-dialog__foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
