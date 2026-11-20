'use client';

import { CollectionEditor, type PanelProps } from '@/components/admin/CollectionEditor';
import { Field, describe } from '@/components/admin/Field';
import { LangTabs } from '@/components/admin/LangTabs';
import { uniqueSlug } from '@/lib/slug';
import { faqSchema } from '@/lib/validation';
import { saveFaq } from './actions';
import { faqToInput, type FaqDraft } from './shared';

const blank = (): FaqDraft => ({
  key: `new-${crypto.randomUUID()}`,
  id: null,
  slug: '',
  question_fr: '',
  question_en: '',
  answer_fr: '',
  answer_en: '',
  visible: true,
});

const missingEn = (f: FaqDraft) => !f.question_en.trim() || !f.answer_en.trim();

function validate(f: FaqDraft) {
  const parsed = faqSchema.safeParse({ ...faqToInput(f), slug: f.slug || 'nouveau' });
  if (parsed.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) errors[issue.path.join('.')] ??= issue.message;
  return errors;
}

export function QuestionsEditor({ initial }: { initial: FaqDraft[] }) {
  return (
    <CollectionEditor<FaqDraft>
      eyebrow="Questions fréquentes du site"
      title="Questions"
      noun={{ none: 'Aucune question pour l’instant', new: 'Nouvelle question', edit: 'Modifier la question', add: 'Ajouter une question' }}
      initial={initial}
      blank={blank}
      titleOf={(f) => f.question_fr || 'Sans titre'}
      metaOf={(f) => (missingEn(f) ? ['EN à traduire'] : [])}
      validate={validate}
      finalize={(f, all, isNew) => (isNew ? { ...f, slug: uniqueSlug(f.question_fr, all.map((i) => i.slug)) } : f)}
      Panel={QuestionPanel}
      save={saveFaq}
      emptyText="Les questions rassurent avant la prise de contact : prix, délais, suivi."
    />
  );
}

function QuestionPanel({ draft, set, errors, lang, setLang }: PanelProps<FaqDraft>) {
  const L = lang === 'fr' ? 'fr' : 'en';
  const q = draft[`question_${L}`];
  const a = draft[`answer_${L}`];
  const err = (k: string) => errors[k];
  const shownQ = q || (L === 'en' ? draft.question_fr : '') || 'Votre question';
  const shownA = a || (L === 'en' ? draft.answer_fr : '') || 'La réponse, en deux ou trois phrases.';

  return (
    <>
      <div className="adm-row">
        <p className="adm-help">{L === 'fr' ? 'Français (obligatoire)' : 'Anglais (facultatif : vide = français affiché)'}</p>
        <LangTabs value={lang} onChange={setLang} missing={missingEn(draft) ? ['en'] : []} label="Langue de la question" />
      </div>
      <Field id="faq-q" label="Question" error={err(`question_${L}`)}>
        <input
          {...describe('faq-q', err(`question_${L}`))}
          type="text"
          lang={L}
          maxLength={160}
          autoFocus
          value={q}
          onChange={(e) => set({ [`question_${L}`]: e.target.value } as Partial<FaqDraft>)}
        />
      </Field>
      <Field id="faq-a" label="Réponse" error={err(`answer_${L}`)} hint="Courte et concrète. Pas de prix sans votre accord.">
        <textarea
          {...describe('faq-a', err(`answer_${L}`), true)}
          rows={5}
          lang={L}
          maxLength={800}
          value={a}
          onChange={(e) => set({ [`answer_${L}`]: e.target.value } as Partial<FaqDraft>)}
        />
      </Field>
      <div className="adm-preview" aria-label="Aperçu sur le site">
        <p className="label">Aperçu sur le site ({L.toUpperCase()})</p>
        <details className="faq__item card" open aria-hidden="true">
          <summary tabIndex={-1}>
            {shownQ}
            <span className="faq__plus" aria-hidden="true" />
          </summary>
          <p>{shownA}</p>
        </details>
      </div>
    </>
  );
}
