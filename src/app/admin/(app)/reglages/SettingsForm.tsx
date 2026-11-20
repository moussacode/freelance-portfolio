'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ExternalLink, ImageUp, RotateCcw } from 'lucide-react';
import type { Locale } from '@/content/i18n';
import type { Settings, WaContext } from '@/content/model';
import { buildWhatsAppLink } from '@/lib/contact';
import { settingsFormSchema } from '@/lib/validation';
import { PageHeader } from '@/components/admin/PageHeader';
import { LangTabs } from '@/components/admin/LangTabs';
import { Switch } from '@/components/admin/Switch';
import { useToast } from '@/components/admin/Toasts';
import { removePhoto, saveSettings, uploadPhoto } from './actions';

type Msg = { fr: string; en: string };
export type SettingsValues = {
  email: string;
  whatsapp_number: string;
  whatsapp_messages: Record<WaContext, Msg>;
  is_available: boolean;
  socials: { linkedin: string; github: string; instagram: string; tiktok: string };
};

type Status = 'saved' | 'pending' | 'saving' | 'invalid' | 'error';

const SAVE_DELAY = 700;
const MAX_PHOTO = 2 * 1024 * 1024;

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
 * Réglages du site, enregistrés automatiquement : chaque modification valide est envoyée
 * au serveur après une courte pause. Les champs invalides sont signalés et ne sont pas envoyés.
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
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<Status>('saved');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<Locale>('fr');
  const [photo, setPhoto] = useState(photoUrl);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastSaved = useRef(JSON.stringify(initial));
  const version = useRef(0);

  // Enregistrement automatique.
  useEffect(() => {
    const snapshot = JSON.stringify(values);
    if (snapshot === lastSaved.current) {
      // Retour exact à la version enregistrée (par exemple un champ invalide vidé) : rien à envoyer.
      version.current++;
      setErrors({});
      setStatus('saved');
      return;
    }
    setStatus('pending');
    const timer = window.setTimeout(async () => {
      const parsed = settingsFormSchema.safeParse(values);
      if (!parsed.success) {
        const map: Record<string, string> = {};
        for (const issue of parsed.error.issues) map[issue.path.join('.')] ??= issue.message;
        setErrors(map);
        setStatus('invalid');
        return;
      }
      setErrors({});
      setStatus('saving');
      const mine = ++version.current;
      try {
        const res = await saveSettings(values);
        if (mine !== version.current) return; // une sauvegarde plus récente est partie
        if (res.ok) {
          lastSaved.current = snapshot;
          setStatus('saved');
        } else {
          setErrors(res.fields ?? {});
          setStatus(res.fields ? 'invalid' : 'error');
        }
      } catch {
        if (mine === version.current) setStatus('error');
      }
    }, SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [values]);

  // Prévenir avant de quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    if (status === 'saved') return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

  const set = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const setMessage = (key: WaContext, text: string) =>
    setValues((v) => ({ ...v, whatsapp_messages: { ...v.whatsapp_messages, [key]: { ...v.whatsapp_messages[key], [lang]: text } } }));
  // Relance l'enregistrement des valeurs actuelles.
  const retry = () => {
    lastSaved.current = '';
    setValues((v) => ({ ...v }));
  };

  // Réglages tels qu'ils seraient sur le site, pour le bouton « Tester ».
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

  const toggleAvailable = (next: boolean) => {
    set('is_available', next);
    toast({
      message: next ? 'Badge « Disponible » affiché sur le site.' : 'Badge « Disponible » masqué sur le site.',
      undo: () => set('is_available', !next),
    });
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_PHOTO) return toast({ message: 'Image trop lourde : 2 Mo maximum.', tone: 'error' });
    setPhotoBusy(true);
    try {
      const data = new FormData();
      data.set('photo', file);
      const res = await uploadPhoto(data);
      if (res.ok) {
        setPhoto(res.url);
        toast({ message: 'Photo mise à jour.' });
      } else toast({ message: res.error, tone: 'error' });
    } catch {
      toast({ message: 'Envoi impossible. Réessayez.', tone: 'error' });
    } finally {
      setPhotoBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const onRemovePhoto = async () => {
    setPhotoBusy(true);
    const res = await removePhoto().catch(() => null);
    setPhotoBusy(false);
    if (res?.ok) {
      setPhoto(null);
      toast({ message: 'Photo retirée : le site reprend la photo par défaut.' });
    } else toast({ message: 'Impossible de retirer la photo. Réessayez.', tone: 'error' });
  };

  const err = (path: string) => errors[path];
  const missingLangs = (['fr', 'en'] as Locale[]).filter((l) =>
    messageFields.some((m) => !values.whatsapp_messages[m.key][l].trim()),
  );

  return (
    <>
      <PageHeader eyebrow="Les changements s’enregistrent tout seuls" title="Réglages">
        <SaveStatus status={status} onRetry={retry} />
      </PageHeader>

      <div className="adm-settings">
        {/* ---------- Contact ---------- */}
        <section className="adm-panel card" aria-labelledby="set-contact">
          <header className="adm-panel__head">
            <h2 id="set-contact">Contact</h2>
            <p className="adm-muted">Utilisé par tous les boutons du site. Rien n’est enregistré côté visiteur.</p>
          </header>

          <Field label="E-mail" error={err('email')} hint="Vide : les liens e-mail disparaissent du site.">
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
            return (
              <div key={m.key} className={`adm-msg${err(path) ? ' adm-msg--error' : ''}`}>
                <div className="adm-row">
                  <label className="label" htmlFor={`msg-${m.key}`}>
                    {m.title}
                  </label>
                  {link ? (
                    <a className="adm-test" href={link} target="_blank" rel="noopener noreferrer">
                      Tester <ExternalLink aria-hidden="true" />
                      <span className="sr"> (ouvre WhatsApp dans un nouvel onglet)</span>
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
                    <>
                      {' '}Exemple : « {text.replaceAll('{service}', sampleService[lang])} »
                    </>
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
              <img src={photo ?? defaultPhoto} alt="Photo actuelle" width={72} height={72} />
              <div className="adm-photo__actions">
                <button type="button" className="btn btn--small" onClick={() => fileInput.current?.click()} disabled={photoBusy}>
                  <ImageUp aria-hidden="true" />
                  {photoBusy ? 'Envoi…' : 'Changer la photo'}
                </button>
                {photo && (
                  <button type="button" className="tlink" onClick={onRemovePhoto} disabled={photoBusy}>
                    Reprendre la photo par défaut
                  </button>
                )}
                <p className="adm-help">PNG, JPEG ou WebP, 2 Mo maximum.</p>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
            </div>
            <div className="adm-toggle">
              <div>
                <p id="set-available" className="adm-toggle__title">
                  Disponible pour de nouvelles missions
                </p>
                <p className="adm-help">Affiche le point vert à côté de votre nom, en haut du site.</p>
              </div>
              <Switch checked={values.is_available} onChange={toggleAvailable} label="Disponible pour de nouvelles missions" />
            </div>
          </section>

          {/* ---------- Réseaux ---------- */}
          <section className="adm-panel card" aria-labelledby="set-socials">
            <header className="adm-panel__head">
              <h2 id="set-socials">Réseaux</h2>
              <p className="adm-muted">Affichés dans le pied de page du site. Vide : le lien n’apparaît pas.</p>
            </header>
            {networks.map((n) => (
              <Field key={n.key} label={n.label} error={err(`socials.${n.key}`)} inline>
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
    </>
  );
}

/** Champ avec libellé, aide et erreur reliés au contrôle (aria-describedby). */
function Field({
  label,
  hint,
  error,
  inline,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  inline?: boolean;
  children: (id: string, describedBy: string) => ReactNode;
}) {
  const id = `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className={`field${inline ? ' adm-field--inline' : ''}`}>
      <label htmlFor={id}>
        <span>{label}</span>
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

/** Indicateur d'enregistrement, annoncé aux lecteurs d'écran. */
function SaveStatus({ status, onRetry }: { status: Status; onRetry: () => void }) {
  const text: Record<Status, string> = {
    saved: 'Enregistré',
    pending: 'Modifications en cours…',
    saving: 'Enregistrement…',
    invalid: 'À corriger',
    error: 'Non enregistré',
  };
  return (
    <div className="adm-save" data-status={status}>
      <span role="status" aria-live="polite" className="adm-save__pill">
        <span className="adm-save__dot" aria-hidden="true" />
        {text[status]}
      </span>
      {status === 'error' && (
        <button type="button" className="btn btn--small" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          Réessayer
        </button>
      )}
    </div>
  );
}
