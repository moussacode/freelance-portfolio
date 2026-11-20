import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import { checkAdmin } from '@/lib/auth-check';

/**
 * Proxy (ex-middleware, Next 16) : garde de /admin.
 * - CSP stricte avec un nonce par requête (les pages admin sont dynamiques, le nonce ne casse aucun cache).
 *   Next lit la CSP dans les en-têtes de la requête et pose le nonce sur ses propres scripts ;
 *   le layout de l'admin le lit dans « x-nonce » pour ses scripts en ligne.
 * - Rafraîchit la session Supabase (cookies) à chaque requête admin.
 * - /admin/login : libre ; un admin déjà connecté en aal2 est renvoyé vers /admin.
 * - Tout le reste de /admin : getUser + aal2 + is_admin(), sinon redirection vers /admin/login.
 * Ce n'est qu'une première barrière : chaque page et action admin appelle aussi requireAdmin().
 * Le site public n'est pas concerné (voir matcher) : il reste statique, sans cookies, et / → /fr est intact.
 */
export async function proxy(request: NextRequest) {
  const { url, publishableKey } = publicEnv();
  const nonce = btoa(crypto.randomUUID());
  const csp = adminCsp(nonce, new URL(url).origin);

  /** En-têtes transmis à Next : CSP (pour qu'il pose le nonce) et nonce (pour le layout). */
  const forwarded = () => {
    const headers = new Headers(request.headers);
    headers.set('x-nonce', nonce);
    headers.set('Content-Security-Policy', csp);
    return headers;
  };
  let response = NextResponse.next({ request: { headers: forwarded() } });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: forwarded() } });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const check = await checkAdmin(supabase);
  const onLogin = request.nextUrl.pathname === '/admin/login';

  const redirectTo = (pathname: string) => {
    const target = request.nextUrl.clone();
    target.pathname = pathname;
    target.search = '';
    const redirect = NextResponse.redirect(target);
    // Garde les cookies de session éventuellement rafraîchis.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (onLogin) return check.ok ? redirectTo('/admin') : finalize(response, csp);
  if (!check.ok) return redirectTo('/admin/login');
  return finalize(response, csp);
}

/** Les pages admin ne sont jamais mises en cache, et portent leur CSP. */
function finalize(response: NextResponse, csp: string) {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

/**
 * CSP de l'admin : seuls les scripts portant le nonce (et ceux qu'ils chargent : strict-dynamic) s'exécutent.
 * connect-src : Supabase (connexion, code MFA). img-src : images Supabase, QR code (data:), aperçus (blob:).
 */
function adminCsp(nonce: string, supabaseOrigin: string) {
  const dev = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseOrigin}`,
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin}${dev ? ' ws: wss:' : ''}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export const config = {
  // Seulement /admin et ses sous-pages. Les fichiers statiques (/_next/static, images, polices, favicon)
  // et tout le site public sont exclus : le proxy ne s'exécute jamais pour eux.
  matcher: ['/admin', '/admin/:path*'],
};
