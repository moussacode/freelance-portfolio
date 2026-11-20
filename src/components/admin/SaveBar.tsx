'use client';

import { useEffect, useRef } from 'react';
import { useUnsavedChanges } from './unsaved';

/**
 * Barre collante en bas de page dès qu'il y a des modifications :
 * « Modifications non enregistrées (n) », Annuler (retour à la version enregistrée), Enregistrer.
 * Ctrl+S (⌘S) enregistre aussi. Déclare les modifications à la garde de navigation.
 */
export function SaveBar({
  count,
  saving,
  onCancel,
  onSave,
}: {
  count: number;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  useUnsavedChanges(count);
  const save = useRef(onSave);
  save.current = onSave;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault(); // jamais la boîte « Enregistrer la page » du navigateur
        if (count > 0 && !saving) save.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, saving]);

  return (
    <div className="adm-savebar glass" data-show={count > 0 || saving} inert={count === 0 && !saving}>
      <p className="adm-savebar__text" role="status" aria-live="polite">
        <span className="adm-savebar__dot" aria-hidden="true" />
        {saving
          ? 'Enregistrement…'
          : count > 0
            ? `Modifications non enregistrées (${count})`
            : ''}
      </p>
      <div className="adm-savebar__actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Annuler
        </button>
        <button type="button" className="btn btn--solid" onClick={onSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
