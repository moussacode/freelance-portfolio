'use client';

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Eye, Plus, Search, type LucideIcon } from 'lucide-react';
import { mainNav, settingsNav } from './nav';
import { useModalDialog } from './useModalDialog';

/** Un contenu trouvable par la recherche (service, réalisation, question, avis). */
export type SearchItem = { label: string; hint: string; href: string };

type Command = { id: string; label: string; hint: string; href: string; icon?: LucideIcon; external?: boolean };

const Ctx = createContext<{ open: (query?: string) => void } | null>(null);

export const usePalette = () => {
  const palette = useContext(Ctx);
  if (!palette) throw new Error('usePalette doit être utilisé dans <PaletteProvider>');
  return palette;
};

/** Minuscules, sans accents : « Réalisation » se trouve en tapant « realisation ». */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * Recherche ⌘K (Ctrl K sous Windows) : aller à une page, ajouter un élément, retrouver un contenu.
 * Flèches pour choisir, Entrée pour valider, Échap pour fermer.
 */
export function PaletteProvider({ items, children }: { items: SearchItem[]; children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const dialog = useModalDialog(isOpen, () => setOpen(false));

  const open = useCallback((q = '') => {
    setQuery(q);
    setActive(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) dialog.ref.current?.close();
        else open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, open, dialog.ref]);

  const commands = useMemo<Command[]>(
    () => [
      ...[...mainNav, settingsNav].map((n) => ({ id: n.href, label: n.label, hint: 'Page', href: n.href, icon: n.icon })),
      { id: 'site', label: 'Voir le site', hint: 'Nouvel onglet', href: '/fr', icon: Eye, external: true },
      ...mainNav
        .filter((n) => n.add)
        .map((n) => ({ id: `${n.href}-new`, label: n.add!, hint: 'Ajouter', href: `${n.href}?nouveau=1`, icon: Plus })),
      ...items.map((it) => ({ id: `${it.href}-${it.label}`, ...it })),
    ],
    [items],
  );

  const results = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return commands.slice(0, 12);
    return commands.filter((c) => {
      const text = normalize(`${c.label} ${c.hint}`);
      return words.every((w) => text.includes(w));
    });
  }, [commands, query]);

  const go = (c: Command | undefined) => {
    if (!c) return;
    dialog.ref.current?.close();
    if (c.external) window.open(c.href, '_blank', 'noopener');
    else router.push(c.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <dialog {...dialog} className="adm-palette glass" aria-label="Rechercher">
        {isOpen && (
          <div className="adm-palette__in">
            <div className="adm-palette__field">
              <Search aria-hidden="true" />
              <input
                autoFocus
                type="text"
                role="combobox"
                aria-label="Rechercher une page ou un contenu"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
                aria-autocomplete="list"
                placeholder="Rechercher une page, un service, une question…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
              />
            </div>
            <ul id={listId} role="listbox" className="adm-palette__list" aria-label="Résultats">
              {results.map((c, i) => {
                const Icon = c.icon;
                return (
                  <li
                    key={c.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className="adm-palette__opt"
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(c)}
                  >
                    <span className="adm-palette__icon" aria-hidden="true">
                      {Icon ? <Icon /> : <CornerDownLeft />}
                    </span>
                    <span className="adm-palette__label">{c.label}</span>
                    <span className="adm-palette__hint">{c.hint}</span>
                  </li>
                );
              })}
              {results.length === 0 && <li className="adm-palette__empty">Aucun résultat pour « {query} ».</li>}
            </ul>
            <p className="adm-palette__help" aria-hidden="true">
              <kbd className="adm-kbd">↑</kbd> <kbd className="adm-kbd">↓</kbd> choisir · <kbd className="adm-kbd">Entrée</kbd>{' '}
              valider · <kbd className="adm-kbd">Échap</kbd> fermer
            </p>
          </div>
        )}
      </dialog>
    </Ctx.Provider>
  );
}
