import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { person } from '@/content/site';
import { Suspense } from 'react';
import { Overview, type Change, type Todo } from './Overview';
import { VisitsCard } from './VisitsCard';

export const metadata: Metadata = { title: 'Vue d’ensemble' };

/** « à l’instant », « il y a 2 h », « hier », « lun. 16 nov. ». */
function relative(iso: string, now: number) {
  const diff = (now - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  if (diff < 60) return 'à l’instant';
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  if (diff < 2 * 86400) return 'hier';
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Vue d'ensemble : l'état du site en un coup d'œil, et ce qui reste à finir.
 * Lecture seule ; chaque élément mène à la page où le continuer.
 */
export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const [services, works, faq, testimonials, settings] = await Promise.all([
    supabase.from('freelance_services').select('slug,name_fr,name_en,pitch_en,points_en,visible,updated_at').order('position'),
    supabase.from('freelance_works').select('slug,name_fr,name_en,kind_en,frame_en,text_en,visible,updated_at').order('position'),
    supabase.from('freelance_faq').select('slug,question_fr,question_en,answer_en,visible,updated_at').order('position'),
    supabase.from('freelance_testimonials').select('id,author,quote_en,consent_at,visible,updated_at').order('position'),
    supabase.from('freelance_settings').select('updated_at').eq('id', 1).single(),
  ]);
  if (services.error || works.error || faq.error || testimonials.error) throw new Error('Lecture impossible.');

  const S = services.data ?? [];
  const W = works.data ?? [];
  const F = faq.data ?? [];
  const T = testimonials.data ?? [];
  const now = Date.now();

  // ---------- À finir ----------
  const todos: Todo[] = [];
  for (const s of S) {
    const href = `/admin/services#${s.slug}`;
    if (!s.visible) todos.push({ label: s.name_fr, reason: 'Masqué sur le site', kind: 'Service', href });
    if (!s.name_en || !s.pitch_en || !s.points_en) todos.push({ label: s.name_fr, reason: 'Anglais à compléter', kind: 'Service', href });
  }
  for (const w of W) {
    const href = `/admin/realisations#${w.slug}`;
    if (!w.visible) todos.push({ label: w.name_fr, reason: 'Masquée sur le site', kind: 'Réalisation', href });
    if (!w.name_en || !w.kind_en || !w.frame_en || !w.text_en) todos.push({ label: w.name_fr, reason: 'Anglais à compléter', kind: 'Réalisation', href });
  }
  for (const f of F) {
    const href = `/admin/questions#${f.slug}`;
    if (!f.visible) todos.push({ label: f.question_fr, reason: 'Masquée sur le site', kind: 'Question', href });
    if (!f.question_en || !f.answer_en) todos.push({ label: f.question_fr, reason: 'Anglais à compléter', kind: 'Question', href });
  }
  for (const t of T) {
    const href = `/admin/avis#${t.id}`;
    if (!t.consent_at) todos.push({ label: t.author, reason: 'Accord écrit manquant : ne peut pas être publié', kind: 'Avis', href });
    else if (!t.visible) todos.push({ label: t.author, reason: 'Masqué sur le site', kind: 'Avis', href });
    if (!t.quote_en) todos.push({ label: t.author, reason: 'Anglais à compléter', kind: 'Avis', href });
  }

  // ---------- Dernières modifications ----------
  const changes: Change[] = [
    ...S.map((s) => ({ label: s.name_fr, section: 'Service', state: s.visible ? 'Visible' : 'Masqué', at: s.updated_at, href: `/admin/services#${s.slug}` })),
    ...W.map((w) => ({ label: w.name_fr, section: 'Réalisation', state: w.visible ? 'Visible' : 'Masquée', at: w.updated_at, href: `/admin/realisations#${w.slug}` })),
    ...F.map((f) => ({ label: f.question_fr, section: 'Question', state: f.visible ? 'Visible' : 'Masquée', at: f.updated_at, href: `/admin/questions#${f.slug}` })),
    ...T.map((t) => ({ label: t.author, section: 'Avis', state: t.visible ? 'Publié' : 'Masqué', at: t.updated_at, href: `/admin/avis#${t.id}` })),
    ...(settings.data ? [{ label: 'Réglages', section: 'Contact, profil, réseaux', state: '', at: settings.data.updated_at, href: '/admin/reglages' }] : []),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const last = changes[0];

  const count = (list: { visible: boolean }[]) => list.filter((i) => i.visible).length;
  const stats = [
    { label: 'Services visibles', value: count(S), total: S.length, href: '/admin/services', warn: count(S) === 0 },
    { label: 'Réalisations visibles', value: count(W), total: W.length, href: '/admin/realisations' },
    { label: 'Questions visibles', value: count(F), total: F.length, href: '/admin/questions' },
    { label: 'Avis publiés', value: count(T), total: T.length, href: '/admin/avis' },
  ];
  const domain = new URL(person.site).host;

  return (
    <Overview
      firstName={person.name.split(' ')[0]}
      domain={domain}
      lastChange={last ? `Dernière modification ${relative(last.at, now)}` : 'Aucune modification pour l’instant'}
      stats={stats}
      todos={todos}
      changes={changes.slice(0, 5).map((c) => ({ ...c, when: relative(c.at, now) }))}
      visits={
        <Suspense
          fallback={
            <section className="adm-panel card adm-visits" aria-busy="true" aria-label="Visites : chargement">
              <span className="adm-skel adm-skel--line" style={{ width: 160 }} />
              <span className="adm-skel adm-skel--card" />
            </section>
          }
        >
          <VisitsCard />
        </Suspense>
      }
    />
  );
}
