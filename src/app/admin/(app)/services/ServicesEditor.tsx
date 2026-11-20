'use client';

import { CollectionEditor, type PanelProps } from '@/components/admin/CollectionEditor';
import { Field, describe } from '@/components/admin/Field';
import { LangTabs } from '@/components/admin/LangTabs';
import { Check } from '@/components/Icons';
import { getDict } from '@/content/ui';
import { uniqueSlug } from '@/lib/slug';
import { serviceSchema } from '@/lib/validation';
import { saveServices } from './actions';
import { serviceToInput, type ServiceDraft } from './shared';

const blank = (): ServiceDraft => ({
  key: `new-${crypto.randomUUID()}`,
  id: null,
  slug: '',
  name_fr: '',
  name_en: '',
  pitch_fr: '',
  pitch_en: '',
  points_fr: ['', '', ''],
  points_en: ['', '', ''],
  visible: true,
});

const missingEn = (s: ServiceDraft) => !s.name_en.trim() || !s.pitch_en.trim() || s.points_en.some((p) => !p.trim());

function validate(s: ServiceDraft) {
  const errors: Record<string, string> = {};
  const parsed = serviceSchema.safeParse({ ...serviceToInput(s), slug: s.slug || 'nouveau' });
  if (!parsed.success) for (const issue of parsed.error.issues) errors[issue.path.join('.')] ??= issue.message;
  // Points anglais : les trois ou aucun.
  const filled = s.points_en.filter((p) => p.trim()).length;
  if (filled > 0 && filled < 3) errors['points_en'] = 'Remplissez les trois points en anglais, ou aucun.';
  return Object.keys(errors).length ? errors : null;
}

export function ServicesEditor({ initial }: { initial: ServiceDraft[] }) {
  return (
    <CollectionEditor<ServiceDraft>
      eyebrow="Ce que vous proposez sur le site"
      title="Services"
      noun={{ none: 'Aucun service pour l’instant', new: 'Nouveau service', edit: 'Modifier le service', add: 'Ajouter un service' }}
      initial={initial}
      blank={blank}
      titleOf={(s) => s.name_fr || 'Sans nom'}
      metaOf={(s) => (missingEn(s) ? ['EN à traduire'] : [])}
      validate={validate}
      finalize={(s, all, isNew) =>
        isNew ? { ...s, slug: uniqueSlug(s.name_fr, all.map((i) => i.slug)), key: s.key } : s
      }
      Panel={ServicePanel}
      save={saveServices}
      lastVisibleWarning="Le site n’aura plus aucun service."
      emptyText="Les services sont le cœur du site : chaque carte mène à une demande de devis."
    />
  );
}

function ServicePanel({ draft, set, errors, lang, setLang }: PanelProps<ServiceDraft>) {
  const L = lang === 'fr' ? 'fr' : 'en';
  const name = draft[`name_${L}`];
  const pitch = draft[`pitch_${L}`];
  const points = draft[`points_${L}`];
  const setPoint = (i: number, value: string) => {
    const next = [...points] as [string, string, string];
    next[i] = value;
    set({ [`points_${L}`]: next } as Partial<ServiceDraft>);
  };
  const err = (k: string) => errors[k];
  const pointsError = err(`points_${L}`);

  // Aperçu : comme sur le site, l'anglais manquant est remplacé par le français.
  const shown = {
    name: name || (L === 'en' ? draft.name_fr : '') || 'Nom du service',
    pitch: pitch || (L === 'en' ? draft.pitch_fr : '') || 'Une phrase pour dire à qui sert ce service.',
    points: points.map((p, i) => p || (L === 'en' ? draft.points_fr[i] : '') || `Point ${i + 1}`),
  };

  return (
    <>
      <div className="adm-row">
        <p className="adm-help">{L === 'fr' ? 'Français (obligatoire)' : 'Anglais (facultatif : vide = français affiché)'}</p>
        <LangTabs value={lang} onChange={setLang} missing={missingEn(draft) ? ['en'] : []} label="Langue du service" />
      </div>

      <Field id="svc-name" label="Nom du service" error={err(`name_${L}`)}>
        <input
          {...describe('svc-name', err(`name_${L}`))}
          type="text"
          lang={L}
          maxLength={60}
          autoFocus
          value={name}
          onChange={(e) => set({ [`name_${L}`]: e.target.value } as Partial<ServiceDraft>)}
        />
      </Field>

      <Field id="svc-pitch" label="En une phrase" error={err(`pitch_${L}`)} hint="Affichée sous le nom, sur la carte.">
        <textarea
          {...describe('svc-pitch', err(`pitch_${L}`), true)}
          rows={2}
          lang={L}
          maxLength={200}
          value={pitch}
          onChange={(e) => set({ [`pitch_${L}`]: e.target.value } as Partial<ServiceDraft>)}
        />
      </Field>

      <fieldset className="adm-fieldset">
        <legend>Ce que le client reçoit (3 points, 120 caractères maximum)</legend>
        {points.map((p, i) => {
          const e = err(`points_${L}.${i}`);
          return (
            <Field key={i} id={`svc-point-${i}`} label={`Point ${i + 1}`} error={e}>
              <input
                {...describe(`svc-point-${i}`, e)}
                type="text"
                lang={L}
                maxLength={120}
                value={p}
                onChange={(ev) => setPoint(i, ev.target.value)}
              />
            </Field>
          );
        })}
        {pointsError && (
          <p className="adm-help">
            <span className="adm-error adm-error--inline">
              <span className="adm-error__badge" aria-hidden="true" />
              {pointsError}
            </span>
          </p>
        )}
      </fieldset>

      <div className="adm-preview" aria-label="Aperçu de la carte sur le site">
        <p className="label">Aperçu sur le site ({L.toUpperCase()})</p>
        <div className="service card" aria-hidden="true">
          <h3 className="service__name">{shown.name}</h3>
          <p className="service__pitch">{shown.pitch}</p>
          <p className="label">{getDict(L).services.includes}</p>
          <ul className="service__points">
            {shown.points.map((p, i) => (
              <li key={i}>
                <span className="tick">
                  <Check />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
