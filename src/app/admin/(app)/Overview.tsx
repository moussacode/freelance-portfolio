import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { NewButton, PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';

export type Todo = { label: string; reason: string; kind: string; href: string };
export type Change = { label: string; section: string; state: string; at: string; href: string };
type Stat = { label: string; value: number; total: number; href: string; warn?: boolean };

/** Affichage de la vue d'ensemble (données calculées par page.tsx). */
export function Overview({
  firstName,
  domain,
  lastChange,
  stats,
  todos,
  changes,
}: {
  firstName: string;
  domain: string;
  lastChange: string;
  stats: Stat[];
  todos: Todo[];
  changes: (Change & { when: string })[];
}) {
  return (
    <>
      <PageHeader eyebrow={`Bonjour ${firstName}`} title="Vue d’ensemble">
        <NewButton />
      </PageHeader>

      <div className="adm-overview">
        <a className="adm-online" href="/fr" target="_blank" rel="noopener noreferrer">
          <span className="adm-online__status">
            <span className="adm-online__dot" aria-hidden="true" />
            En ligne
          </span>
          <strong className="adm-online__domain">{domain}</strong>
          <span className="adm-online__meta">
            {lastChange}
          </span>
          <span className="sr"> (ouvre le site dans un nouvel onglet)</span>
        </a>

        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="adm-stat card">
            <span className="adm-stat__label">{s.label}</span>
            <span className="adm-stat__value">
              {s.value}
              <span className="adm-stat__total"> / {s.total}</span>
            </span>
            <span className="adm-stat__meta">
              {s.warn ? (
                <span className="adm-error adm-error--inline">
                  <span className="adm-error__badge" aria-hidden="true" />
                  Le site n’affiche aucun service
                </span>
              ) : s.total === 0 ? (
                'Aucun pour l’instant'
              ) : s.total - s.value > 0 ? (
                `${s.total - s.value} masqué${s.total - s.value > 1 ? 's' : ''}`
              ) : (
                'Tout est visible'
              )}
            </span>
          </Link>
        ))}
      </div>

      <div className="adm-overview-cols">
        <section className="adm-panel card" aria-labelledby="todo-title">
          <header className="adm-row">
            <h2 id="todo-title" className="adm-subtitle">À finir</h2>
            <span className="adm-count">{todos.length}</span>
          </header>
          {todos.length === 0 ? (
            <p className="adm-muted">Rien à finir : tout est visible et traduit.</p>
          ) : (
            <ul className="adm-todo">
              {todos.slice(0, 8).map((t, i) => (
                <li key={`${t.href}-${t.reason}-${i}`}>
                  <span className="adm-chip adm-chip--soft">{t.kind}</span>
                  <span className="adm-todo__text">
                    <strong>{t.label}</strong>
                    <span>
                      <span className="adm-todo__kind">{t.kind} · </span>
                      {t.reason}
                    </span>
                  </span>
                  <Link href={t.href} className="adm-todo__go" aria-label={`Continuer : ${t.label} (${t.reason})`}>
                    Continuer <ArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {todos.length > 8 && <p className="adm-help">Et {todos.length - 8} autres, dans chaque section.</p>}
        </section>

        <section className="adm-panel card" aria-labelledby="changes-title">
          <h2 id="changes-title" className="adm-subtitle">
            Dernières modifications
          </h2>
          {changes.length === 0 ? (
            <EmptyState title="Rien pour l’instant" />
          ) : (
            <ul className="adm-changes">
              {changes.map((c) => (
                <li key={`${c.href}-${c.at}`}>
                  <Link href={c.href}>
                    <strong>{c.label}</strong>
                    <span>
                      {c.section}
                      {c.state && ` · ${c.state}`}
                    </span>
                  </Link>
                  <time dateTime={c.at}>{c.when}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="adm-panel card adm-visits" aria-labelledby="visits-title">
        <div>
          <h2 id="visits-title" className="adm-subtitle">
            Vos visites
          </h2>
          <p className="adm-muted">Visiteurs, pages vues et provenance sont dans Vercel Analytics. Aucun suivi n’est fait par le site lui-même.</p>
        </div>
        <a className="btn" href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
          Ouvrir les statistiques <ExternalLink aria-hidden="true" />
          <span className="sr"> (nouvel onglet)</span>
        </a>
      </section>
    </>
  );
}
