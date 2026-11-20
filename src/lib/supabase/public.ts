import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';

/** Délai maximum d'une requête à Supabase pour le site public. Au-delà : données de repli. */
export const PUBLIC_TIMEOUT_MS = 3000;

const fetchWithTimeout: typeof fetch = (input, init) =>
  fetch(input, { ...init, signal: AbortSignal.timeout(PUBLIC_TIMEOUT_MS) });

let client: SupabaseClient | null = null;

/**
 * Client du site public : clé publique, aucun cookie, aucune session.
 * La page reste ainsi statique et en cache (ISR). Les règles RLS ne laissent lire que le visible.
 */
export function publicClient(): SupabaseClient {
  if (client) return client;
  const { url, publishableKey } = publicEnv();
  client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetchWithTimeout },
  });
  return client;
}
