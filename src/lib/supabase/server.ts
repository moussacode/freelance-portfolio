import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';

/**
 * Client de l'admin côté serveur (composants serveur, server actions) : session lue dans les cookies.
 * À n'utiliser que sous /admin. Toujours vérifier l'utilisateur avec auth.getUser(), jamais getSession() seul.
 */
export async function serverClient() {
  const { url, publishableKey } = publicEnv();
  const store = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Appel depuis un composant serveur : les cookies sont en lecture seule.
          // proxy.ts rafraîchit la session, ce n'est donc pas un problème.
        }
      },
    },
  });
}
