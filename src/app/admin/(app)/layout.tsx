import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth';
import { person } from '@/content/site';
import { AdminShell } from '@/components/admin/AdminShell';
import type { SearchItem } from '@/components/admin/CommandPalette';

/**
 * Cadre des pages de l'admin (tout sauf /admin/login).
 * requireAdmin() ici ET dans chaque page : un layout n'est pas rejoué à chaque navigation.
 * Les compteurs et l'index de recherche couvrent aussi les éléments masqués (l'admin voit tout, via RLS).
 */
export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const { supabase } = await requireAdmin();

  const [services, works, faq, testimonials] = await Promise.all([
    supabase.from('freelance_services').select('slug,name_fr,visible').order('position'),
    supabase.from('freelance_works').select('slug,name_fr,visible').order('position'),
    supabase.from('freelance_faq').select('slug,question_fr,visible').order('position'),
    supabase.from('freelance_testimonials').select('id,author,visible').order('position'),
  ]);

  const hidden = (visible: boolean) => (visible ? '' : ' · masqué');
  const items: SearchItem[] = [
    ...(services.data ?? []).map((s) => ({
      label: s.name_fr,
      hint: `Service${hidden(s.visible)}`,
      href: `/admin/services#${s.slug}`,
    })),
    ...(works.data ?? []).map((w) => ({
      label: w.name_fr,
      hint: `Réalisation${hidden(w.visible)}`,
      href: `/admin/realisations#${w.slug}`,
    })),
    ...(faq.data ?? []).map((f) => ({
      label: f.question_fr,
      hint: `Question${hidden(f.visible)}`,
      href: `/admin/questions#${f.slug}`,
    })),
    ...(testimonials.data ?? []).map((t) => ({
      label: t.author,
      hint: `Avis${hidden(t.visible)}`,
      href: `/admin/avis#${t.id}`,
    })),
  ];

  return (
    <AdminShell
      counts={{
        services: services.data?.length,
        works: works.data?.length,
        faq: faq.data?.length,
        testimonials: testimonials.data?.length,
      }}
      items={items}
      userName={person.name.split(' ')[0]}
    >
      {children}
    </AdminShell>
  );
}
