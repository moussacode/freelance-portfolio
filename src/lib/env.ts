/**
 * Variables publiques (lisibles dans le navigateur). Rien de secret ici.
 * Les noms sont écrits en entier : Next ne remplace process.env.NEXT_PUBLIC_* que sous cette forme.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Vrai si Supabase est configuré. Sinon le site public tourne sur les données de repli. */
export const supabaseConfigured = Boolean(url && publishableKey);

export function publicEnv() {
  if (!url || !publishableKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY manquant.');
  }
  return { url, publishableKey };
}
