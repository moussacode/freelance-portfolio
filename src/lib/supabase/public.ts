import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import { CONTENT_REVALIDATE, CONTENT_TAG } from '@/lib/cache-tags';

/** Délai maximum des lectures du site public. Au-delà : données de repli ou dernière version en cache. */
export const PUBLIC_TIMEOUT_MS = 3000;

/**
 * Les lectures passent par le cache de données de Next, sous le tag CONTENT_TAG :
 * la page reste statique (ISR) et l'admin la rafraîchit avec revalidateTag / updateTag.
 * Pas d'AbortSignal ici : Next le traite à part pendant les revalidations. Le délai est géré
 * par lib/content.ts.
 */
const cachedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'force-cache', next: { revalidate: CONTENT_REVALIDATE, tags: [CONTENT_TAG] } });

let client: SupabaseClient | null = null;

/**
 * Client du site public : clé publique, aucun cookie, aucune session.
 * Les règles RLS ne laissent lire que le contenu visible.
 */
export function publicClient(): SupabaseClient {
  if (client) return client;
  const { url, publishableKey } = publicEnv();
  client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: cachedFetch },
  });
  return client;
}
