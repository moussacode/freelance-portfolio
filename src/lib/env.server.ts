import 'server-only';

/**
 * Variables réservées au serveur. Ce fichier ne peut pas être importé par un composant client :
 * `server-only` fait échouer le build si c'est le cas.
 *
 * SUPABASE_SECRET_KEY n'est volontairement pas exposée ici : l'application n'en a pas besoin
 * (l'admin écrit avec la session de l'utilisateur, filtrée par RLS et is_admin()).
 * Seul le script scripts/seed.ts l'utilise, en local, hors du bundle Next.
 */
export function cronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('CRON_SECRET manquant ou trop court (32 caractères minimum).');
  }
  return secret;
}
