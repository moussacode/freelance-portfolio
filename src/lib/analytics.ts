import 'server-only';
import { z } from 'zod';
import { analyticsToken } from '@/lib/env.server';
import type { Visits } from '@/lib/analytics-types';

export type { Visits };

/**
 * Statistiques Vercel Web Analytics pour la carte « Visites » de l'admin.
 * - Token lu côté serveur uniquement (server-only), jamais envoyé au navigateur.
 * - À appeler seulement après requireAdmin().
 * - Réponses en cache 10 minutes (cache de données de Next).
 * - En cas d'échec (token absent ou expiré, API lente ou en erreur) : null, la carte affiche
 *   « Statistiques indisponibles » sans casser la page.
 * Données de production uniquement (comportement par défaut de l'API).
 */

const API = 'https://api.vercel.com/v1/query/web-analytics/visits';
/** Équipe et projet Vercel du site (identifiants, pas des secrets). */
const SCOPE = { teamId: 'team_a13l6OqL1flMJtJR8rkZoEvP', projectId: 'moussaalimchangama' };
export const ANALYTICS_URL = 'https://vercel.com/moussas-projects-40f2cb06/moussaalimchangama/analytics?environment=all';

const CACHE_SECONDS = 600;
const TIMEOUT_MS = 6000;
const DAYS = 7;

const metrics = { pageviews: z.number(), visitors: z.number() };
const countSchema = z.object({ data: z.object(metrics) });
const rows = <T extends z.ZodRawShape>(shape: T) => z.object({ data: z.array(z.object({ ...shape, ...metrics })) });

const day = (d: Date) => d.toISOString().slice(0, 10);

async function query(path: 'count' | 'aggregate', token: string, params: Record<string, string>) {
  const url = `${API}/${path}?${new URLSearchParams({ ...SCOPE, ...params })}`;
  const request = fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: CACHE_SECONDS, tags: ['admin-analytics'] },
  }).then(async (r) => {
    if (!r.ok) throw new Error(`Vercel Analytics : HTTP ${r.status}`);
    return r.json() as Promise<unknown>;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Vercel Analytics : délai dépassé')), TIMEOUT_MS);
  });
  return Promise.race([request, timeout]).finally(() => clearTimeout(timer));
}

export async function getVisits(): Promise<Visits | null> {
  const token = analyticsToken();
  if (!token) return null;

  const today = new Date();
  const since = new Date(today.getTime() - (DAYS - 1) * 86_400_000);
  const range = { since: day(since), until: day(today) };

  try {
    const [count, byDay, byPage, bySource] = await Promise.all([
      query('count', token, range),
      query('aggregate', token, { ...range, by: 'day' }),
      query('aggregate', token, { ...range, by: 'requestPath', limit: '5' }),
      query('aggregate', token, { ...range, by: 'referrerHostname', limit: '5' }),
    ]);
    const total = countSchema.parse(count).data;
    const days = rows({ timestamp: z.string() }).parse(byDay).data;
    const pages = rows({ requestPath: z.string().nullish() }).parse(byPage).data;
    const sources = rows({ referrerHostname: z.string().nullish() }).parse(bySource).data;

    // Les jours sans visite n'apparaissent pas dans la réponse : on les complète par 0.
    const perDay = new Map(days.map((d) => [d.timestamp.slice(0, 10), d]));
    const daily = Array.from({ length: DAYS }, (_, i) => {
      const date = day(new Date(since.getTime() + i * 86_400_000));
      const found = perDay.get(date);
      return { date, pageviews: found?.pageviews ?? 0, visitors: found?.visitors ?? 0 };
    });

    return {
      visitors: total.visitors,
      pageviews: total.pageviews,
      daily,
      pages: pages
        .filter((p) => p.requestPath)
        .map((p) => ({ path: p.requestPath as string, pageviews: p.pageviews }))
        .slice(0, 5),
      sources: sources.map((s) => ({ host: s.referrerHostname || null, visitors: s.visitors })).slice(0, 5),
    };
  } catch (error) {
    // Jamais le token dans les journaux : seulement le message d'erreur.
    console.warn(`[statistiques] indisponibles : ${error instanceof Error ? error.message : 'erreur'}`);
    return null;
  }
}
