import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { publicEnv } from '@/lib/env';
import { IMAGE_BUCKET } from '@/lib/images';
import { fallbackContent } from '@/content/fallback';
import type { WaContext } from '@/content/model';
import { SettingsForm, type SettingsValues } from './SettingsForm';

export const metadata: Metadata = { title: 'Réglages' };

type Msg = { fr?: string; en?: string };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [settings, firstService] = await Promise.all([
    supabase
      .from('freelance_settings')
      .select('email,whatsapp_number,whatsapp_messages,is_available,socials,photo_path')
      .eq('id', 1)
      .single(),
    supabase.from('freelance_services').select('name_fr,name_en').order('position').limit(1).maybeSingle(),
  ]);
  if (settings.error || !settings.data) throw new Error('Réglages introuvables.');
  const s = settings.data;

  // Messages pas encore réglés : le texte par défaut, celui que le site affiche déjà.
  const fb = fallbackContent.settings.messages;
  const stored = (s.whatsapp_messages ?? {}) as Partial<Record<WaContext, Msg>>;
  const msg = (k: WaContext) => ({ fr: stored[k]?.fr ?? fb[k].fr, en: stored[k]?.en ?? fb[k].en });
  const socials = (s.socials ?? {}) as Record<string, string | undefined>;

  const initial: SettingsValues = {
    email: s.email ?? '',
    whatsapp_number: s.whatsapp_number ?? '',
    whatsapp_messages: { contact: msg('contact'), quote: msg('quote'), brief: msg('brief') },
    is_available: s.is_available,
    socials: {
      linkedin: socials.linkedin ?? '',
      github: socials.github ?? '',
      instagram: socials.instagram ?? '',
      tiktok: socials.tiktok ?? '',
    },
  };

  const service = firstService.data;
  return (
    <SettingsForm
      initial={initial}
      photoUrl={s.photo_path ? `${publicEnv().url}/storage/v1/object/public/${IMAGE_BUCKET}/${s.photo_path}` : null}
      defaultPhoto={fallbackContent.settings.avatar}
      sampleService={{
        fr: service?.name_fr ?? 'Site vitrine',
        en: service?.name_en ?? service?.name_fr ?? 'Business website',
      }}
    />
  );
}
