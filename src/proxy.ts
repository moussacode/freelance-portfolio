import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import { checkAdmin } from '@/lib/auth-check';

/**
 * Proxy (ex-middleware, Next 16) : garde de /admin.
 * - Rafraîchit la session Supabase (cookies) à chaque requête admin.
 * - /admin/login : libre ; un admin déjà connecté en aal2 est renvoyé vers /admin.
 * - Tout le reste de /admin : getUser + aal2 + is_admin(), sinon redirection vers /admin/login.
 * Ce n'est qu'une première barrière : chaque page et action admin appelle aussi requireAdmin().
 * Le site public n'est pas concerné (voir matcher) : il reste statique, sans cookies, et / → /fr est intact.
 */
export async function proxy(request: NextRequest) {
  const { url, publishableKey } = publicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
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

  if (onLogin) return check.ok ? redirectTo('/admin') : noStore(response);
  if (!check.ok) return redirectTo('/admin/login');
  return noStore(response);
}

/** Les pages admin ne doivent jamais être mises en cache (navigateur, CDN). */
function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  // Seulement /admin et ses sous-pages. Les fichiers statiques (/_next/static, images, polices, favicon)
  // et tout le site public sont exclus : le proxy ne s'exécute jamais pour eux.
  matcher: ['/admin', '/admin/:path*'],
};
