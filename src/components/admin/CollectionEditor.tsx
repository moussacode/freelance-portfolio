'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Locale } from '@/content/i18n';
import { Dialog } from './Dialog';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';
import { SaveBar } from './SaveBar';
import { SortableList } from './SortableList';
import { Switch } from './Switch';
import { useToast } from './Toasts';
import { useCollectionDraft, type DraftItem } from './useCollectionDraft';

/** « 1 visible », « 3 visibles ». */
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

export type SaveListResult<T> = { ok: true; items: T[] } | { ok: false; error: string };

export type PanelProps<T> = {
  draft: T;
  set: (patch: Partial<T>) => void;
  errors: Record<string, string>;
  lang: Locale;
  setLang: (l: Locale) => void;
};

type Config<T extends DraftItem> = {
  eyebrow: string;
  title: string;
  /** « service », « question » : pour les textes de l'interface. */
  noun: { none: string; new: string; edit: string; add: string };
  initial: T[];
  blank: () => T;
  titleOf: (item: T) => string;
  /** Petites indications sous le titre (« EN à traduire »…). */
  metaOf?: (item: T) => string[];
  /** Validation du panneau : erreurs par champ, ou null si tout est bon. */
  validate: (item: T) => Record<string, string> | null;
  /** Prépare un élément validé avant de l'ajouter au brouillon (slug d'un nouvel élément…). */
  finalize?: (item: T, all: T[], isNew: boolean) => T;
  Panel: (props: PanelProps<T>) => ReactNode;
  save: (items: T[], deleted: string[]) => Promise<SaveListResult<T>>;
  /** Message si plus aucun élément n'est visible (ex. « Le site n'aura plus aucun service. »). */
  lastVisibleWarning?: string;
  emptyText: string;
};

/**
 * Page de gestion d'une liste (services, questions) :
 * lignes réordonnables, interrupteur Visible, modification dans un panneau latéral, suppression confirmée.
 * Tout reste en attente jusqu'à « Enregistrer » (barre du bas ou Ctrl+S).
 */
export function CollectionEditor<T extends DraftItem>(c: Config<T>) {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const draft = useCollectionDraft(c.initial);
  const [saving, setSaving] = useState(false);
  const [panel, setPanel] = useState<{ value: T; isNew: boolean } | null>(null);
  const [panelErrors, setPanelErrors] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<Locale>('fr');
  const [confirm, setConfirm] = useState<{ title: string; body: ReactNode; label: string; run: () => void } | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const opened = useRef(false);

  // ?nouveau=1 (depuis la recherche ⌘K) : ouvre directement le panneau d'ajout.
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    if (params.get('nouveau') === '1') {
      openNew();
      router.replace(window.location.pathname, { scroll: false });
    }
    // #adresse (depuis la recherche) : met la ligne en évidence.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash) {
      setHighlight(hash);
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'center' }));
      window.setTimeout(() => setHighlight(null), 2500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleCount = (list: T[]) => list.filter((i) => i.visible).length;
  /** Demande confirmation si le changement fait disparaître le dernier élément visible. */
  const guardLastVisible = (next: T[], run: () => void, title: string) => {
    if (c.lastVisibleWarning && visibleCount(draft.items) > 0 && visibleCount(next) === 0) {
      setConfirm({ title, body: <p>{c.lastVisibleWarning} Continuer ?</p>, label: 'Continuer', run });
    } else run();
  };

  const toggleVisible = (item: T, visible: boolean) => {
    const next = draft.items.map((i) => (i.key === item.key ? { ...i, visible } : i));
    guardLastVisible(next, () => draft.update(item.key, { visible } as Partial<T>), `Masquer « ${c.titleOf(item)} » ?`);
  };

  function openNew() {
    setLang('fr');
    setPanelErrors({});
    setPanel({ value: c.blank(), isNew: true });
  }
  const openEdit = (item: T) => {
    setLang('fr');
    setPanelErrors({});
    setPanel({ value: { ...item }, isNew: false });
  };

  const applyPanel = () => {
    if (!panel) return;
    const errors = c.validate(panel.value);
    if (errors) {
      setPanelErrors(errors);
      // Bascule sur la langue de la première erreur.
      const first = Object.keys(errors)[0] ?? '';
      if (first.endsWith('_en') || first.includes('_en.')) setLang('en');
      else if (first.endsWith('_fr') || first.includes('_fr.')) setLang('fr');
      return;
    }
    const value = c.finalize ? c.finalize(panel.value, draft.items, panel.isNew) : panel.value;
    const run = () => {
      if (panel.isNew) draft.add(value);
      else draft.update(value.key, value);
      setPanel(null); // la pastille « modifié » et la barre du bas signalent le changement en attente
    };
    const next = panel.isNew ? [...draft.items, value] : draft.items.map((i) => (i.key === value.key ? value : i));
    guardLastVisible(next, run, `Masquer « ${c.titleOf(value)} » ?`);
  };

  const askDelete = (item: T) => {
    const next = draft.items.filter((i) => i.key !== item.key);
    const last = c.lastVisibleWarning && item.visible && visibleCount(next) === 0;
    setConfirm({
      title: `Supprimer « ${c.titleOf(item)} » ?`,
      body: (
        <>
          <p>
            {draft.isNew(item.key)
              ? 'Pas encore enregistré : l’élément disparaît simplement de la liste.'
              : 'L’élément disparaîtra du site quand vous enregistrerez. D’ici là, « Annuler » dans la barre du bas le remet.'}
          </p>
          {last && <p>{c.lastVisibleWarning}</p>}
        </>
      ),
      label: 'Supprimer',
      run: () => {
        const { item: removed, index } = draft.remove(item.key);
        toast({ message: `« ${c.titleOf(removed)} » retiré de la liste.`, undo: () => draft.restore(removed, index) });
      },
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await c.save(draft.items, draft.deletedIds);
      if (res.ok) {
        draft.commit(res.items);
        toast({ message: 'Enregistré. Le site est à jour.' });
        router.refresh(); // compteurs de la barre latérale
      } else toast({ message: res.error, tone: 'error' });
    } catch {
      toast({ message: 'Enregistrement impossible. Vérifiez la connexion et réessayez.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const savedVisible = new Map(draft.saved.map((s) => [s.key, s]));
  const hidden = draft.items.filter((i) => !i.visible).length;

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title}>
        <button type="button" className="btn btn--solid" onClick={openNew}>
          <Plus aria-hidden="true" />
          {c.noun.add}
        </button>
      </PageHeader>

      {draft.items.length === 0 ? (
        <EmptyState title={c.noun.none} text={c.emptyText}>
          <button type="button" className="btn btn--solid" onClick={openNew}>
            <Plus aria-hidden="true" />
            {c.noun.add}
          </button>
        </EmptyState>
      ) : (
        <>
          <p className="adm-help adm-list-help">
            {draft.items.length} au total · {plural(draft.items.length - hidden, 'visible')} sur le site
            {hidden > 0 && ` · ${plural(hidden, 'masqué')}`}. Glissez une ligne pour changer l’ordre sur le site.
          </p>
          <SortableList
            className="adm-list"
            items={draft.items}
            labelOf={c.titleOf}
            onMove={draft.move}
            renderItem={(item, handle) => {
              const before = savedVisible.get(item.key);
              const pending = !before || JSON.stringify(before) !== JSON.stringify(item);
              const meta = c.metaOf?.(item) ?? [];
              return (
                <div
                  className="adm-item card"
                  data-hidden={!item.visible || undefined}
                  data-highlight={highlight === item.key || undefined}
                >
                  {handle}
                  <div className="adm-item__main">
                    <button type="button" className="adm-item__title" onClick={() => openEdit(item)}>
                      {c.titleOf(item)}
                      {pending && (
                        <span className="adm-changed" title="Modifié, pas encore enregistré">
                          <span className="sr"> (modifié, pas encore enregistré)</span>
                        </span>
                      )}
                    </button>
                    <p className="adm-item__meta">
                      {!before && <span className="adm-chip">Nouveau</span>}
                      {!item.visible && <span className="adm-chip">Masqué</span>}
                      {meta.map((m) => (
                        <span key={m} className="adm-chip adm-chip--soft">
                          {m}
                        </span>
                      ))}
                    </p>
                  </div>
                  <label className="adm-item__visible">
                    <span className="adm-item__visible-label">Visible sur le site</span>
                    <Switch
                      checked={item.visible}
                      onChange={(v) => toggleVisible(item, v)}
                      label={`Visible sur le site : ${c.titleOf(item)}`}
                    />
                  </label>
                  <div className="adm-item__actions">
                    <button type="button" className="adm-icon-btn" onClick={() => openEdit(item)} aria-label={`Modifier « ${c.titleOf(item)} »`}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <button type="button" className="adm-icon-btn" onClick={() => askDelete(item)} aria-label={`Supprimer « ${c.titleOf(item)} »`}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            }}
          />
        </>
      )}

      <Dialog
        open={panel !== null}
        onClose={() => setPanel(null)}
        variant="panel"
        title={panel?.isNew ? c.noun.new : c.noun.edit}
        description="Rien n’est publié avant « Enregistrer », dans la barre du bas."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setPanel(null)}>
              Annuler
            </button>
            <button type="button" className="btn btn--solid" onClick={applyPanel}>
              {panel?.isNew ? 'Ajouter à la liste' : 'Valider'}
            </button>
          </>
        }
      >
        {panel && (
          <form
            className="adm-panel-form"
            onSubmit={(e) => {
              e.preventDefault();
              applyPanel();
            }}
          >
            <c.Panel
              draft={panel.value}
              set={(patch) => setPanel((p) => (p ? { ...p, value: { ...p.value, ...patch } } : p))}
              errors={panelErrors}
              lang={lang}
              setLang={setLang}
            />
            <div className="adm-toggle">
              <div>
                <p className="adm-toggle__title">Visible sur le site</p>
                <p className="adm-help">Masqué : gardé dans l’admin, absent du site.</p>
              </div>
              <Switch
                checked={panel.value.visible}
                onChange={(v) => setPanel((p) => (p ? { ...p, value: { ...p.value, visible: v } } : p))}
                label="Visible sur le site"
              />
            </div>
            {/* Entrée valide le panneau. */}
            <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ''}
        confirmLabel={confirm?.label ?? 'Continuer'}
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.run();
          setConfirm(null);
        }}
      >
        {confirm?.body}
      </ConfirmDialog>

      <SaveBar count={draft.changes} saving={saving} onCancel={draft.reset} onSave={save} />
    </>
  );
}
