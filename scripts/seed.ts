/**
 * Import initial du contenu du site freelance dans Supabase (tables freelance_*).
 *
 *   npm run seed            → aperçu, n'écrit rien
 *   npm run seed -- --write → écrit
 *
 * - Lancé à la main, en local, avec Node (`node --env-file=.env`). Jamais importé par l'application :
 *   il est hors de src/, et c'est le SEUL fichier qui lit SUPABASE_SECRET_KEY.
 * - Peut être relancé sans risque : il n'insère que ce qui manque (conflit sur `slug` → ignoré)
 *   et ne remplit les réglages que s'ils sont encore vierges. Il n'écrase jamais une modification
 *   faite dans l'admin.
 * - Services et questions : visibles. Réalisations : masquées (à afficher depuis l'admin).
 */
import { createClient } from '@supabase/supabase-js';
import { draftWorks, fallbackContent } from '../src/content/fallback.ts';

const write = process.argv.includes('--write');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY sont requis (fichier .env).');
  process.exit(1);
}
if (secret.startsWith('sb_publishable_')) {
  console.error('SUPABASE_SECRET_KEY contient une clé publique : il faut la clé secrète (sb_secret_…).');
  process.exit(1);
}

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const { services, faq, settings } = fallbackContent;

const rows = {
  freelance_services: services.map((s, i) => ({
    slug: s.id,
    name_fr: s.name.fr,
    name_en: s.name.en,
    pitch_fr: s.pitch.fr,
    pitch_en: s.pitch.en,
    points_fr: s.points.map((p) => p.fr),
    points_en: s.points.map((p) => p.en),
    visible: true,
    position: i,
  })),
  freelance_faq: faq.map((f, i) => ({
    slug: f.id,
    question_fr: f.q.fr,
    question_en: f.q.en,
    answer_fr: f.a.fr,
    answer_en: f.a.en,
    visible: true,
    position: i,
  })),
  freelance_works: draftWorks.map((w, i) => ({
    slug: w.id,
    name_fr: w.name.fr,
    name_en: w.name.en,
    kind_fr: w.kind.fr,
    kind_en: w.kind.en,
    frame_fr: w.frame.fr,
    frame_en: w.frame.en,
    text_fr: w.text.fr,
    text_en: w.text.en,
    cover_id: w.cover,
    url: w.url,
    visible: false,
    position: i,
  })),
};

const settingsRow = {
  email: settings.email,
  whatsapp_number: settings.whatsapp,
  whatsapp_messages: settings.messages,
  is_available: settings.available,
  socials: settings.socials,
};

async function main() {
  console.log(write ? 'Écriture dans Supabase…\n' : 'Aperçu (rien n’est écrit). Ajoute --write pour importer.\n');

  for (const [table, list] of Object.entries(rows)) {
    const { data: existing, error } = await db.from(table).select('slug');
    if (error) throw new Error(`${table} : ${error.message}`);
    const present = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
    const missing = list.filter((r) => !present.has(r.slug));
    console.log(`${table.padEnd(20)} ${missing.length} à ajouter, ${list.length - missing.length} déjà là`);
    if (write && missing.length) {
      const res = await db.from(table).upsert(missing, { onConflict: 'slug', ignoreDuplicates: true });
      if (res.error) throw new Error(`${table} : ${res.error.message}`);
    }
  }

  // Réglages : seulement si la ligne est encore vierge (aucun e-mail ni numéro réglé).
  const { data: current, error } = await db
    .from('freelance_settings')
    .select('email,whatsapp_number')
    .eq('id', 1)
    .single();
  if (error) throw new Error(`freelance_settings : ${error.message}`);
  const blank = !current.email && !current.whatsapp_number;
  console.log(`${'freelance_settings'.padEnd(20)} ${blank ? 'vierge → à remplir' : 'déjà réglés → inchangés'}`);
  if (write && blank) {
    const res = await db
      .from('freelance_settings')
      .update(settingsRow)
      .eq('id', 1)
      .is('email', null)
      .is('whatsapp_number', null);
    if (res.error) throw new Error(`freelance_settings : ${res.error.message}`);
  }

  console.log(write ? '\nTerminé.' : '\nAucune écriture.');
  if (write) {
    // Le seed écrit hors de Next : le cache du site (tag freelance-content) n'est pas invalidé.
    console.log(
      '\nLe site garde ses lectures en cache (tag « freelance-content », 1 h maximum). Pour voir le contenu tout de suite :\n' +
        '  - en local : supprimer .next/cache/fetch-cache, puis relancer le build ;\n' +
        '  - sur Vercel : enregistrer n’importe quel réglage dans l’admin (cela invalide le tag),\n' +
        '    ou purger le Data Cache du projet.',
    );
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
