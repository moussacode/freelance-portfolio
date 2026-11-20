'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';

let client: SupabaseClient | null = null;

/** Client navigateur de l'admin (connexion, code MFA). Clé publique uniquement. */
export function browserClient(): SupabaseClient {
  if (client) return client;
  const { url, publishableKey } = publicEnv();
  client = createBrowserClient(url, publishableKey);
  return client;
}
