'use client';

import { useMemo, useState } from 'react';
import { countChanges } from '@/lib/diff';

/** Élément d'une liste éditable : `key` stable côté écran, `id` en base (null tant qu'il n'est pas enregistré). */
export type DraftItem = { key: string; id: string | null; visible: boolean };

/**
 * Brouillon d'une liste (services, questions…). Tout reste en attente jusqu'à « Enregistrer » :
 * ajouts, modifications, suppressions, interrupteur Visible et ordre.
 */
export function useCollectionDraft<T extends DraftItem>(initial: T[]) {
  const [saved, setSaved] = useState(initial);
  const [items, setItems] = useState(initial);

  const changes = useMemo(() => {
    const before = new Map(saved.map((s) => [s.key, s]));
    const now = new Set(items.map((i) => i.key));
    let n = 0;
    for (const item of items) {
      const prev = before.get(item.key);
      n += prev ? countChanges(prev, item) : 1; // ajout = 1
    }
    for (const s of saved) if (!now.has(s.key)) n += 1; // suppression = 1
    // Nouvel ordre parmi les éléments existants = 1.
    const order = (list: T[]) => list.filter((i) => before.has(i.key) && now.has(i.key)).map((i) => i.key).join('|');
    if (order(items) !== order(saved)) n += 1;
    return n;
  }, [saved, items]);

  const deletedIds = useMemo(() => {
    const now = new Set(items.map((i) => i.key));
    return saved.filter((s) => !now.has(s.key) && s.id).map((s) => s.id as string);
  }, [saved, items]);

  return {
    saved,
    items,
    changes,
    deletedIds,
    isNew: (key: string) => !saved.some((s) => s.key === key),
    update: (key: string, patch: Partial<T>) =>
      setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i))),
    add: (item: T) => setItems((list) => [...list, item]),
    /** Retire un élément ; renvoie de quoi le remettre à sa place (Annuler du toast). */
    remove: (key: string) => {
      const index = items.findIndex((i) => i.key === key);
      const item = items[index];
      setItems((list) => list.filter((i) => i.key !== key));
      return { item, index };
    },
    restore: (item: T, index: number) =>
      setItems((list) => (list.some((i) => i.key === item.key) ? list : [...list.slice(0, index), item, ...list.slice(index)])),
    move: (from: number, to: number) =>
      setItems((list) => {
        const next = [...list];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      }),
    /** Annuler : retour exact à la version enregistrée. */
    reset: () => setItems(saved),
    /** Après un enregistrement réussi : la version du serveur devient la référence. */
    commit: (fresh: T[]) => {
      setSaved(fresh);
      setItems(fresh);
    },
  };
}
