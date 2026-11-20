'use client';

import { CollectionEditor, type PanelProps, type SaveListResult } from '@/components/admin/CollectionEditor';
import { Field, describe } from '@/components/admin/Field';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { LangTabs } from '@/components/admin/LangTabs';
import { Poster, type CoverId } from '@/components/Cover';
import { uniqueSlug } from '@/lib/slug';
import { publicImageUrl } from '@/lib/storage-url';
import { coverIds, workSchema } from '@/lib/validation';
import { saveWorks } from './actions';
import { MAX_NEW_IMAGES, workToInput, type WorkDraft } from './shared';

const blank = (): WorkDraft => ({
  key: `new-${crypto.randomUUID()}`,
  id: null,
  slug: '',
  name_fr: '',
  name_en: '',
  kind_fr: '',
  kind_en: '',
  frame_fr: '',
  frame_en: '',
  text_fr: '',
  text_en: '',
  cover_id: 'shop',
  image_path: null,
  url: '',
  visible: false,
  newImage: null,
  preview: null,
});

const coverNames: Record<CoverId, string> = {
  shop: 'Boutique',
  jappo: 'Plateforme',
  eco: 'Tableau de bord',
  teranga: 'Application',
  smart: 'Outil',
};

const imageOf = (w: WorkDraft) => w.preview ?? (w.image_path ? publicImageUrl(w.image_path) : null);
const missingEn = (w: WorkDraft) => !w.name_en.trim() || !w.kind_en.trim() || !w.frame_en.trim() || !w.text_en.trim();

function validate(w: WorkDraft) {
  const input = workToInput(w);
  const parsed = workSchema.safeParse({
    ...input,
    slug: w.slug || 'nouveau',
    // Image choisie mais pas encore envoyée : elle compte comme couverture.
    image_path: w.newImage ? 'en-attente.png' : input.image_path,
  });
  if (parsed.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) errors[issue.path.join('.')] ??= issue.message;
  return errors;
}

/** Envoie la liste et les nouvelles images en un seul appel (FormData). */
async function save(items: WorkDraft[], deleted: string[]): Promise<SaveListResult<WorkDraft>> {
  const fresh = items.filter((i) => i.newImage);
  if (fresh.length > MAX_NEW_IMAGES) {
    return { ok: false, error: `${MAX_NEW_IMAGES} nouvelles images au plus par enregistrement : enregistrez en plusieurs fois.` };
  }
  const form = new FormData();
  form.set('data', JSON.stringify({ items: items.map(workToInput), deleted }));
  for (const i of fresh) form.set(`image:${i.key}`, i.newImage as File);
  const res = await saveWorks(form);
  // Les aperçus locaux ne servent plus : on libère la mémoire.
  if (res.ok) for (const i of fresh) if (i.preview) URL.revokeObjectURL(i.preview);
  return res;
}

export function WorksEditor({ initial }: { initial: WorkDraft[] }) {
  return (
    <CollectionEditor<WorkDraft>
      eyebrow="Projets montrés sur le site"
      title="Réalisations"
      noun={{ none: 'Aucune réalisation pour l’instant', new: 'Nouvelle réalisation', edit: 'Modifier la réalisation', add: 'Ajouter une réalisation' }}
      initial={initial}
      blank={blank}
      titleOf={(w) => w.name_fr || 'Sans nom'}
      metaOf={(w) => [w.kind_fr, ...(missingEn(w) ? ['EN à traduire'] : [])].filter(Boolean)}
      validate={validate}
      finalize={(w, all, isNew) => (isNew ? { ...w, slug: uniqueSlug(w.name_fr, all.map((i) => i.slug)) } : w)}
      Panel={WorkPanel}
      save={save}
      tabs
      canFeature
      renderCover={(w) => {
        const img = imageOf(w);
        // eslint-disable-next-line @next/next/no-img-element
        return img ? <img src={img} alt="" /> : w.cover_id ? <Poster id={w.cover_id} /> : null;
      }}
      emptyText="Montrez une mission ou un projet. La section « Réalisations » apparaît sur le site dès qu’une réalisation est visible."
    />
  );
}

function WorkPanel({ draft, set, errors, lang, setLang }: PanelProps<WorkDraft>) {
  const L = lang === 'fr' ? 'fr' : 'en';
  const err = (k: string) => errors[k];
  const text = (field: 'name' | 'kind' | 'frame' | 'text') => draft[`${field}_${L}`];
  const setText = (field: 'name' | 'kind' | 'frame' | 'text', value: string) =>
    set({ [`${field}_${L}`]: value } as Partial<WorkDraft>);
  const img = imageOf(draft);

  return (
    <>
      <fieldset className="adm-fieldset">
        <legend>Couverture</legend>
        <ImagePicker
          preview={img}
          label="Image de la réalisation"
          // L'affiche choisie reste en réserve : le serveur l'efface dès qu'une image est enregistrée.
          onPick={(file, preview) => set({ newImage: file, preview })}
        />
        <p className="adm-help">Ou une affiche dessinée aux couleurs du site :</p>
        <div className="adm-covers" role="radiogroup" aria-label="Affiche dessinée">
          {coverIds.map((id) => {
            const checked = !img && draft.cover_id === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={checked}
                className="adm-cover-opt"
                onClick={() => set({ cover_id: id, newImage: null, preview: null, image_path: null })}
              >
                <span className="adm-cover-opt__img" aria-hidden="true">
                  <Poster id={id} />
                </span>
                <span>{coverNames[id]}</span>
              </button>
            );
          })}
        </div>
        {err('cover_id') && (
          <p className="adm-help">
            <span className="adm-error adm-error--inline">
              <span className="adm-error__badge" aria-hidden="true" />
              {err('cover_id')}
            </span>
          </p>
        )}
      </fieldset>

      <div className="adm-row">
        <p className="adm-help">{L === 'fr' ? 'Français (obligatoire)' : 'Anglais (facultatif : vide = français affiché)'}</p>
        <LangTabs value={lang} onChange={setLang} missing={missingEn(draft) ? ['en'] : []} label="Langue de la réalisation" />
      </div>
      <p className="adm-note">Pas de nom de client sans son accord écrit.</p>

      <Field id="work-name" label="Nom du projet" error={err(`name_${L}`)}>
        <input {...describe('work-name', err(`name_${L}`))} lang={L} maxLength={80} value={text('name')} onChange={(e) => setText('name', e.target.value)} />
      </Field>
      <Field id="work-kind" label="Type" error={err(`kind_${L}`)} hint="Ex. Boutique en ligne, Application mobile.">
        <input {...describe('work-kind', err(`kind_${L}`), true)} lang={L} maxLength={40} value={text('kind')} onChange={(e) => setText('kind', e.target.value)} />
      </Field>
      <Field id="work-frame" label="Cadre" error={err(`frame_${L}`)} hint="Ex. Mission freelance, client anonyme.">
        <input {...describe('work-frame', err(`frame_${L}`), true)} lang={L} maxLength={80} value={text('frame')} onChange={(e) => setText('frame', e.target.value)} />
      </Field>
      <Field id="work-text" label="Ce que vous avez fait" error={err(`text_${L}`)}>
        <textarea {...describe('work-text', err(`text_${L}`))} rows={4} lang={L} maxLength={300} value={text('text')} onChange={(e) => setText('text', e.target.value)} />
      </Field>
      <Field id="work-url" label="Lien (facultatif)" error={err('url')} hint="Adresse https:// du projet en ligne.">
        <input {...describe('work-url', err('url'), true)} type="url" inputMode="url" placeholder="https://…" value={draft.url} onChange={(e) => set({ url: e.target.value.trim() })} />
      </Field>
    </>
  );
}
