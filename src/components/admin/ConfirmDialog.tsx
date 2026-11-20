'use client';

import type { ReactNode } from 'react';
import { Dialog } from './Dialog';

/**
 * Confirmation avant une action importante (suppression, changement de contact, sortie sans enregistrer).
 * Le bouton « annuler » reçoit le focus : Entrée par réflexe ne déclenche pas l'action.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Annuler',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Action destructive (suppression, perte de modifications). */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button type="button" className="btn" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className={`btn btn--solid${danger ? ' adm-btn--danger' : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="adm-confirm">{children}</div>
    </Dialog>
  );
}
