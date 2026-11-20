'use client';

import { CollectionEditor, type PanelProps } from '@/components/admin/CollectionEditor';
import { Field, describe } from '@/components/admin/Field';
import { LangTabs } from '@/components/admin/LangTabs';
import { testimonialSchema } from '@/lib/validation';
import { saveTestimonials } from './actions';
import { NO_CONSENT, testimonialToInput, type TestimonialDraft } from './shared';

const blank = (): TestimonialDraft => ({
  key: `new-${crypto.randomUUID()}`,
  id: null,
  quote_fr: '',
  quote_en: '',
  author: '',
  consent: false,
  consent_at: null,
  visible: false,
});

const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function validate(t: TestimonialDraft) {
  const parsed = testimonialSchema.safeParse(testimonialToInput(t));
  if (parsed.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) errors[issue.path.join('.')] ??= issue.message;
  return errors;
}

export function TestimonialsEditor({ initial }: { initial: TestimonialDraft[] }) {
  return (
    <CollectionEditor<TestimonialDraft>
      eyebrow="Avis clients, publiés avec accord"
      title="Avis"
      noun={{ none: 'Aucun avis pour l’instant', new: 'Nouvel avis', edit: 'Modifier l’avis', add: 'Ajouter un avis' }}
      initial={initial}
      blank={blank}
      titleOf={(t) => t.author || 'Sans auteur'}
      metaOf={(t) => [
        t.consent ? (t.consent_at ? `Accord du ${date(t.consent_at)}` : 'Accord coché') : 'Sans accord écrit',
        ...(!t.quote_en.trim() ? ['EN à traduire'] : []),
      ]}
      validate={validate}
      blockVisible={(t) => (t.consent ? null : NO_CONSENT)}
      Panel={TestimonialPanel}
      save={saveTestimonials}
      emptyText="Ajoutez seulement de vrais avis, avec l’accord écrit de la personne. La section n’apparaît sur le site qu’à partir d’un avis publié."
    />
  );
}

function TestimonialPanel({ draft, set, errors, lang, setLang }: PanelProps<TestimonialDraft>) {
  const L = lang === 'fr' ? 'fr' : 'en';
  const err = (k: string) => errors[k];
  return (
    <>
      <div className="adm-row">
        <p className="adm-help">{L === 'fr' ? 'Français (obligatoire)' : 'Anglais (facultatif : vide = français affiché)'}</p>
        <LangTabs value={lang} onChange={setLang} missing={!draft.quote_en.trim() ? ['en'] : []} label="Langue de l’avis" />
      </div>
      <Field id="tst-quote" label="Citation" error={err(`quote_${L}`)} hint="Les mots de la personne, sans les embellir.">
        <textarea
          {...describe('tst-quote', err(`quote_${L}`), true)}
          rows={5}
          lang={L}
          maxLength={500}
          autoFocus
          value={draft[`quote_${L}`]}
          onChange={(e) => set({ [`quote_${L}`]: e.target.value } as Partial<TestimonialDraft>)}
        />
      </Field>
      <Field id="tst-author" label="Auteur" error={err('author')} hint="Prénom et rôle, ex. « Awa, gérante d’une boutique ». Pas de nom d’entreprise sans accord.">
        <input
          {...describe('tst-author', err('author'), true)}
          maxLength={80}
          value={draft.author}
          onChange={(e) => set({ author: e.target.value })}
        />
      </Field>
      <label className="adm-check">
        <input
          type="checkbox"
          checked={draft.consent}
          onChange={(e) => set({ consent: e.target.checked, visible: e.target.checked ? draft.visible : false })}
        />
        <span>
          <strong>J’ai l’accord écrit de cette personne</strong>
          <span className="adm-help">
            {draft.consent_at && draft.consent
              ? `Accord enregistré le ${date(draft.consent_at)}.`
              : 'Obligatoire pour publier. La date est enregistrée avec l’avis. Décocher masque l’avis.'}
          </span>
        </span>
      </label>
    </>
  );
}
