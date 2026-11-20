import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { cronSecret } from '@/lib/env.server';
import { publicEnv } from '@/lib/env';

/**
 * Évite la mise en pause du projet Supabase (offre gratuite) : une lecture légère chaque jour,
 * déclenchée par le Cron Vercel (vercel.json). Vercel envoie « Authorization: Bearer <CRON_SECRET> ».
 * Jamais en cache ; ne renvoie aucune donnée.
 */
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

/** Comparaison en temps constant : ne révèle pas, par sa durée, la partie juste du secret. */
function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  let secret: string;
  try {
    secret = cronSecret();
  } catch {
    return Response.json({ ok: false, error: 'CRON_SECRET non configuré' }, { status: 500, headers: noStore });
  }
  if (!sameSecret(request.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return Response.json({ ok: false }, { status: 401, headers: noStore });
  }

  const { url, publishableKey } = publicEnv();
  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) }) },
  });
  const { error } = await supabase.from('freelance_settings').select('id').eq('id', 1).single();
  return Response.json({ ok: !error }, { status: error ? 502 : 200, headers: noStore });
}
