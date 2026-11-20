'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ExternalLink, ImageUp } from 'lucide-react';
import type { Locale } from '@/content/i18n';
import type { Settings, WaContext } from '@/content/model';
import { buildWhatsAppLink } from '@/lib/contact';
import { countChanges } from '@/lib/diff';
import { settingsFormSchema } from '@/lib/validation';
import { PageHeader } from '@/components/admin/PageHeader';
import { LangTabs } from '@/components/admin/LangTabs';
import { Switch } from '@/components/admin/Switch';
import { SaveBar } from '@/components/admin/SaveBar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toasts';
import { saveSettings } from './actions';

type Msg = { fr: string; en: string };
export type SettingsValues = {
  email: string;
  whatsapp_number: string;
  whatsapp_messages: Record<WaContext, Msg>;
  is_available: boolean;
  socials: { linkedin: string; github: string; instagram: string; tiktok: string };
};

/** Photo en attente : nouvelle image (aperçu local, pas encore envoyée) ou retrait. */
type PendingPhoto = { kind: 'new'; file: File; preview: string } | { kind: 'remove' } | null;

const MAX_PHOTO = 2 * 1024 * 1024;
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const messageFields: { key: WaContext; title: string; where: string; hint?: string }[] = [
  { key: 'contact', title: 'Bouton « Discuter sur WhatsApp »', where: 'Accueil et barre du bas, sur mobile.' },
  {
    key: 'quote',
    title: 'Boutons « Demander un devis »',
    where: 'Un par service.',
    hint: 'Écrivez {service} là où le nom du service cliqué doit apparaître.',
  },
  {
    key: 'brief',
    title: 'Formulaire « Parlons de votre projet »',
    where: 'Première ligne du message ; le nom, le besoin et le texte du visiteur suivent.',
  },
];

const networks: { key: keyof SettingsValues['socials']; label: string; placeholder: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/…' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/…' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/…' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@…' },
];

/**
 * Réglages du site. Rien ne part sur le site avant « Enregistrer » (bouton ou Ctrl+S) :
 * les champs, l'interrupteur et la photo restent en attente, comptés dans la barre du bas.
 */
export function SettingsForm({
  initial,
  photoUrl,
  defaultPhoto,
  sampleService,
}: {
  initial: SettingsValues;
  photoUrl: string | null;
  defaultPhoto: string;
  sampleService: Msg;
}) {
  const toast = useToast();
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [savedPhoto, setSavedPhoto] = useState(photoUrl);
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [confirmContact, setConfirmContact] = useState(false);
  const [lang, setLang] = useState<Locale>('fr');
  const fileInput = useRef<HTMLInputElement>(null);

  const changes = countChanges(saved, values) + (pendingPhoto ? 1 : 0);

  // Erreurs affichées après une première tentative d'enregistrement, puis mises à jour à chaque frappe.
  const errors = useMemo(() => {
    if (!showErrors) return serverErrors;
    const parsed = settingsFormSchema.safeParse(values);
    const map: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) map[issue.path.join('.')] ??= issue.message;
    return { ...serverErrors, ...map };
  }, [showErrors, values, serverErrors]);

  // L'aperçu local de la photo est libéré quand il n'est plus utilisé.
  useEffect(() => {
    if (pendingPhoto?.kind !== 'new') return;
    const url = pendingPhoto.preview;
    return () => URL.revokeObjectURL(url);
  }, [pendingPhoto]);

  const set = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const setMessage = (key: WaContext, text: string) =>
    setValues((v) => ({ ...v, whatsapp_messages: { ...v.whatsapp_messages, [key]: { ...v.whatsapp_messages[key], [lang]: text } } }));

  /** Changements de coordonnées à confirmer (ancienne → nouvelle valeur). */
  const contactChanges = [
    { label: 'E-mail', before: saved.email, after: values.email, empty: 'vide : liens e-mail masqués' },
    { label: 'Numéro WhatsApp', before: saved.whatsapp_number, after: values.whatsapp_number, empty: 'vide : WhatsApp masqué' },
  ].filter((c) => c.before !== c.after);

  const requestSave = () => {
    if (!changes || saving) return;
    setShowErrors(true);
    setServerErrors({});
    if (!settingsFormSchema.safeParse(values).success) {
      toast({ message: 'Certains champs sont à corriger avant d’enregistrer.', tone: 'error' });
      return;
    }
    if (contactChanges.length) setConfirmContact(true);
    else void save();
  };

  const save = async () => {
    setConfirmContact(false);
    setSaving(true);
    try {
      const form = new FormData();
      form.set('data', JSON.stringify(values));
      if (pendingPhoto?.kind === 'new') form.set('photo', pendingPhoto.file);
      if (pendingPhoto?.kind === 'remove') form.set('removePhoto', '1');
      const res = await saveSettings(form);
      if (res.ok) {
        setSaved(values);
        setSavedPhoto(res.photoUrl);
        setPendingPhoto(null);
        setShowErrors(false);
        toast({ message: 'Enregistré. Le site est à jour.' });
      } else {
        setServerErrors(res.fields ?? {});
        toast({ message: res.error, tone: 'error' });
      }
    } catch {
      toast({ message: 'Enregistrement impossible. Vérifiez la connexion et réessayez.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /** Annuler : retour exact à ce qui est enregistré. Rien n'est envoyé ni supprimé. */
  const cancel = () => {
    setValues(saved);
    setPendingPhoto(null);
    setShowErrors(false);
    setServerErrors({});
    if (fileInput.current) fileInput.current.value = '';
  };

  const choosePhoto = (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) return toast({ message: 'PNG, JPEG ou WebP uniquement.', tone: 'error' });
    if (file.size > MAX_PHOTO) return toast({ message: 'Image trop lourde : 2 Mo maximum.', tone: 'error' });
    setPendingPhoto({ kind: 'new', file, preview: URL.createObjectURL(file) });
  };

  // Réglages tels qu'ils seraient après enregistrement, pour le bouton « Tester ».
  const preview: Settings = {
    email: values.email || null,
    whatsapp: values.whatsapp_number || null,
    messages: values.whatsapp_messages,
    available: values.is_available,
    socials: {},
    avatar: '',
  };
  const testLink = (context: WaContext) =>
    buildWhatsAppLink(preview, { context, lang, service: sampleService[lang], body: context === 'brief' ? '…' : undefined });

  const shownPhoto =
    pendingPhoto?.kind === 'new' ? pendingPhoto.preview : pendingPhoto?.kind === 'remove' ? defaultPhoto : (savedPhoto ?? defaultPhoto);

  const err = (path: string) => errors[path];
  const missingLangs = (['fr', 'en'] as Locale[]).filter((l) =>
    messageFields.some((m) => !values.whatsapp_messages[m.key][l].trim()),
  );

  return (
    <>
      <PageHeader eyebrow="Rien n’est publié tant que vous n’avez pas cliqué sur Enregistrer" title="Réglages" />

      <div className="adm-settings">
        {/* ---------- Contact ---------- */}
        <section className="adm-panel card" aria-labelledby="set-contact">
          <header className="adm-panel__head">
            <h2 id="set-contact">Contact</h2>
            <p className="adm-muted">Utilisé par tous les boutons du site. Rien n’est enregistré côté visiteur.</p>
          </header>

          <Field label="E-mail" error={err('email')} hint="Vide : les liens e-mail disparaissent du site." changed={saved.email !== values.email}>
            {(id, describedBy) => (
              <input
                id={id}
                type="email"
                autoComplete="email"
                aria-describedby={describedBy}
                aria-invalid={Boolean(err('email'))}
                value={values.email}
                onChange={(e) => set('email', e.target.value.trim())}
              />
            )}
          </Field>

          <Field
            label="Numéro WhatsApp"
            error={err('whatsapp_number')}
            changed={saved.whatsapp_number !== values.whatsapp_number}
            hint={
              values.whatsapp_number
                ? 'Chiffres seuls, avec l’indicatif (221 pour le Sénégal), sans + ni espaces.'
                : 'Vide : WhatsApp est masqué partout sur le site, l’e-mail prend le relais.'
            }
          >
            {(id, describedBy) => (
              <input
                id={id}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                aria-describedby={describedBy}
                aria-invalid={Boolean(err('whatsapp_number'))}
                value={values.whatsapp_number}
                onChange={(e) => set('whatsapp_number', e.target.value.replace(/\D/g, ''))}
              />
            )}
          </Field>

          <div className="adm-row">
            <h3 className="adm-subtitle">Messages déjà écrits</h3>
            <LangTabs value={lang} onChange={setLang} missing={missingLangs} label="Langue des messages" />
          </div>

          {messageFields.map((m) => {
            const path = `whatsapp_messages.${m.key}.${lang}`;
            const link = testLink(m.key);
            const text = values.whatsapp_messages[m.key][lang];
            const changed = text !== saved.whatsapp_messages[m.key][lang];
            return (
              <div key={m.key} className={`adm-msg${err(path) ? ' adm-msg--error' : ''}`} data-changed={changed || undefined}>
                <div className="adm-row">
                  <label className="label" htmlFor={`msg-${m.key}`}>
                    {m.title}
                    {changed && <ChangedMark />}
                  </label>
                  {link ? (
                    <a className="adm-test" href={link} target="_blank" rel="noopener noreferrer">
                      Tester <ExternalLink aria-hidden="true" />
                      <span className="sr"> (ouvre WhatsApp dans un nouvel onglet, avec le texte affiché ici)</span>
                    </a>
                  ) : (
                    <span className="adm-muted adm-small">Ajoutez un numéro pour tester</span>
                  )}
                </div>
                <textarea
                  id={`msg-${m.key}`}
                  className="adm-msg__text"
                  rows={3}
                  lang={lang}
                  aria-describedby={`msg-${m.key}-help`}
                  aria-invalid={Boolean(err(path))}
                  value={text}
                  onChange={(e) => setMessage(m.key, e.target.value)}
                />
                <p id={`msg-${m.key}-help`} className="adm-help">
                  {err(path) ? <FieldError text={err(path)!} /> : (m.hint ?? m.where)}
                  {m.key === 'quote' && !err(path) && text.includes('{service}') && (
                    <> Exemple : « {text.replaceAll('{service}', sampleService[lang])} »</>
                  )}
                </p>
              </div>
            );
          })}
        </section>

        <div className="adm-stack">
          {/* ---------- Profil ---------- */}
          <section className="adm-panel card" aria-labelledby="set-profile">
            <header className="adm-panel__head">
              <h2 id="set-profile">Profil</h2>
              <p className="adm-muted">Photo ronde de la barre et du pied de page.</p>
            </header>
            <div className="adm-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shownPhoto} alt={pendingPhoto ? 'Aperçu de la nouvelle photo' : 'Photo actuelle'} width={72} height={72} />
              <div className="adm-photo__actions">
                {pendingPhoto && (
                  <p className="adm-pending">
                    <ChangedMark />
                    {pendingPhoto.kind === 'new' ? 'Aperçu : envoyée au moment d’enregistrer' : 'Photo par défaut après enregistrement'}
                  </p>
                )}
                <button type="button" className="btn btn--small" onClick={() => fileInput.current?.click()} disabled={saving}>
                  <ImageUp aria-hidden="true" />
                  {pendingPhoto?.kind === 'new' ? 'Choisir une autre photo' : 'Changer la photo'}
                </button>
                {pendingPhoto ? (
                  <button type="button" className="tlink" onClick={() => setPendingPhoto(null)} disabled={saving}>
                    Garder la photo actuelle
                  </button>
                ) : (
                  savedPhoto && (
                    <button type="button" className="tlink" onClick={() => setPendingPhoto({ kind: 'remove' })} disabled={saving}>
                      Reprendre la photo par défaut
                    </button>
                  )
                )}
                <p className="adm-help">{err('photo') ? <FieldError text={err('photo')!} /> : 'PNG, JPEG ou WebP, 2 Mo maximum.'}</p>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => choosePhoto(e.target.files?.[0])}
              />
            </div>
            <div className="adm-toggle">
              <div>
                <p className="adm-toggle__title">
                  Disponible pour de nouvelles missions
                  {saved.is_available !== values.is_available && <ChangedMark />}
                </p>
                <p className="adm-help">Affiche le point vert à côté de votre nom, en haut du site.</p>
              </div>
              <Switch
                checked={values.is_available}
                onChange={(next) => set('is_available', next)}
                label="Disponible pour de nouvelles missions"
              />
            </div>
          </section>

          {/* ---------- Réseaux ---------- */}
          <section className="adm-panel card" aria-labelledby="set-socials">
            <header className="adm-panel__head">
              <h2 id="set-socials">Réseaux</h2>
              <p className="adm-muted">Affichés dans le pied de page du site. Vide : le lien n’apparaît pas.</p>
            </header>
            {networks.map((n) => (
              <Field
                key={n.key}
                label={n.label}
                error={err(`socials.${n.key}`)}
                changed={saved.socials[n.key] !== values.socials[n.key]}
                inline
              >
                {(id, describedBy) => (
                  <input
                    id={id}
                    type="url"
                    inputMode="url"
                    placeholder={n.placeholder}
                    aria-describedby={describedBy}
                    aria-invalid={Boolean(err(`socials.${n.key}`))}
                    value={values.socials[n.key]}
                    onChange={(e) => set('socials', { ...values.socials, [n.key]: e.target.value.trim() })}
                  />
                )}
              </Field>
            ))}
          </section>
        </div>
      </div>

      <SaveBar count={changes} saving={saving} onCancel={cancel} onSave={requestSave} />

      <ConfirmDialog
        open={confirmContact}
        title="Confirmer le changement de coordonnées"
        confirmLabel="Enregistrer"
        onCancel={() => setConfirmContact(false)}
        onConfirm={() => void save()}
      >
        <p>Tous les boutons de contact du site utiliseront ces coordonnées.</p>
        <dl className="adm-compare">
          {contactChanges.map((c) => (
            <div key={c.label}>
              <dt>{c.label}</dt>
              <dd>
                <span className="adm-compare__old">
                  <span className="sr">Ancien : </span>
                  {c.before || `(${c.empty})`}
                </span>
                <span aria-hidden="true">→</span>
                <span className="adm-compare__new">
                  <span className="sr">Nouveau : </span>
                  {c.after || `(${c.empty})`}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </ConfirmDialog>
    </>
  );
}

/** Pastille « modifié, pas encore enregistré ». */
function ChangedMark() {
  return (
    <span className="adm-changed" title="Modifié, pas encore enregistré">
      <span className="sr"> (modifié, pas encore enregistré)</span>
    </span>
  );
}

/** Champ avec libellé, aide et erreur reliés au contrôle (aria-describedby). */
function Field({
  label,
  hint,
  error,
  inline,
  changed,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  inline?: boolean;
  changed?: boolean;
  children: (id: string, describedBy: string) => ReactNode;
}) {
  const id = `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className={`field${inline ? ' adm-field--inline' : ''}`}>
      <label htmlFor={id}>
        <span>
          {label}
          {changed && <ChangedMark />}
        </span>
      </label>
      {children(id, `${id}-help`)}
      <p id={`${id}-help`} className="adm-help">
        {error ? <FieldError text={error} /> : hint}
      </p>
    </div>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <span className="adm-error adm-error--inline">
      <span className="adm-error__badge" aria-hidden="true" />
      {text}
    </span>
  );
}
