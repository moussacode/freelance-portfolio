'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Plus, Search } from 'lucide-react';
import { usePalette } from './CommandPalette';

/** En-tête d'une page de l'admin : surtitre, titre, recherche ⌘K et actions de la page. */
export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  const palette = usePalette();
  // « ⌘ K » sur Mac, « Ctrl K » ailleurs. Décidé après le montage pour éviter un écart d'hydratation.
  const [shortcut, setShortcut] = useState('Ctrl K');
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setShortcut('⌘ K');
  }, []);

  return (
    <header className="adm-head">
      <div>
        {eyebrow && <p className="adm-eyebrow">{eyebrow}</p>}
        <h1 className="adm-h1">{title}</h1>
      </div>
      <div className="adm-head__actions">
        <button type="button" className="adm-search" onClick={() => palette.open()}>
          <Search aria-hidden="true" />
          <span>Rechercher…</span>
          <kbd className="adm-kbd" aria-label={`Raccourci ${shortcut}`}>
            {shortcut}
          </kbd>
        </button>
        {children}
      </div>
    </header>
  );
}

/** Bouton « Nouveau » de la vue d'ensemble : ouvre la recherche sur les actions d'ajout. */
export function NewButton() {
  const palette = usePalette();
  return (
    <button type="button" className="btn btn--solid" onClick={() => palette.open('Ajouter')}>
      <Plus aria-hidden="true" />
      Nouveau
    </button>
  );
}
