import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { signOut } from './actions';

export const metadata: Metadata = { title: 'Vue d’ensemble' };

/** Page provisoire : la vraie vue d'ensemble arrive à l'étape 10, la barre latérale à l'étape 6. */
export default async function AdminHome() {
  const { email } = await requireAdmin();
  return (
    <main className="adm-center">
      <div className="adm-card card">
        <p className="tag">Admin</p>
        <h1 className="adm-title">Vue d’ensemble</h1>
        <p className="adm-muted">Connecté en tant que {email}.</p>
        <form action={signOut}>
          <button type="submit" className="btn">
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
