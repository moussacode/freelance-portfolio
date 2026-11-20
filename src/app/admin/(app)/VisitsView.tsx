import { ExternalLink } from 'lucide-react';
import type { Visits } from '@/lib/analytics-types';

const nf = new Intl.NumberFormat('fr-FR');
const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

/** Affichage de la carte « Visites » (données déjà chargées, ou null si indisponibles). */
export function VisitsView({ visits, analyticsUrl }: { visits: Visits | null; analyticsUrl: string }) {
  return (
    <section className="adm-panel card adm-visits" aria-labelledby="visits-title">
      <header className="adm-row">
        <h2 id="visits-title" className="adm-subtitle">
          Visites <span className="adm-muted adm-small">· 7 derniers jours, production</span>
        </h2>
        <a className="adm-test" href={analyticsUrl} target="_blank" rel="noopener noreferrer">
          Voir plus sur Vercel <ExternalLink aria-hidden="true" />
          <span className="sr"> (nouvel onglet)</span>
        </a>
      </header>
      {visits ? <VisitsBody v={visits} /> : <Unavailable />}
    </section>
  );
}

function Unavailable() {
  return (
    <p className="adm-muted" role="status">
      <span className="adm-error adm-error--inline">
        <span className="adm-error__badge" aria-hidden="true" />
        Statistiques indisponibles
      </span>{' '}
      pour le moment. Elles restent consultables sur Vercel.
    </p>
  );
}

function VisitsBody({ v }: { v: Visits }) {
  if (v.pageviews === 0) {
    return <p className="adm-muted">Pas encore de visite enregistrée sur les 7 derniers jours.</p>;
  }
  return (
    <div className="adm-visits__grid">
      <div className="adm-visits__totals">
        <p>
          <span className="adm-stat__value">{nf.format(v.visitors)}</span>
          <span className="adm-stat__label">visiteurs</span>
        </p>
        <p>
          <span className="adm-stat__value">{nf.format(v.pageviews)}</span>
          <span className="adm-stat__label">pages vues</span>
        </p>
        <Sparkline daily={v.daily} />
      </div>
      <TopList title="Pages les plus vues" rows={v.pages.map((p) => ({ label: p.path, value: p.pageviews, unit: 'vues' }))} />
      <TopList
        title="Principales sources"
        rows={v.sources.map((s) => ({ label: s.host ?? 'Accès direct', value: s.visitors, unit: 'visiteurs' }))}
      />
    </div>
  );
}

/** Mini-courbe des pages vues par jour, avec un tableau équivalent pour les lecteurs d'écran. */
function Sparkline({ daily }: { daily: Visits['daily'] }) {
  const W = 168;
  const H = 44;
  const max = Math.max(1, ...daily.map((d) => d.pageviews));
  const x = (i: number) => (i / (daily.length - 1)) * (W - 8) + 4;
  const y = (n: number) => H - 4 - (n / max) * (H - 8);
  const points = daily.map((d, i) => `${x(i).toFixed(1)},${y(d.pageviews).toFixed(1)}`).join(' ');
  const last = daily.at(-1)!;
  return (
    <figure className="adm-spark">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" focusable="false">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(daily.length - 1)} cy={y(last.pageviews)} r="3" fill="currentColor" />
      </svg>
      <figcaption className="adm-help">
        {weekday(daily[0].date)} → {weekday(last.date)}
      </figcaption>
      <table className="sr">
        <caption>Pages vues par jour</caption>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}>
              <th scope="row">{weekday(d.date)}</th>
              <td>{d.pageviews} pages vues</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function TopList({ title, rows }: { title: string; rows: { label: string; value: number; unit: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="adm-rank">
      <h3 className="label">{title}</h3>
      {rows.length === 0 ? (
        <p className="adm-help">Pas encore de données.</p>
      ) : (
        <ol>
          {rows.map((r) => (
            <li key={r.label}>
              <span className="adm-rank__bar" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden="true" />
              <span className="adm-rank__label">{r.label}</span>
              <span className="adm-rank__value">
                {nf.format(r.value)}
                <span className="sr"> {r.unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
