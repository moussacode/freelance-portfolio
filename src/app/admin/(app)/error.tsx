'use client';

import { useEffect } from 'react';

/** Erreur claire, avec une action pour réessayer. Le détail technique reste dans la console. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="adm-empty card" role="alert">
      <h1 className="adm-empty__title">
        <span className="adm-error__badge" aria-hidden="true" /> Cette page n’a pas pu se charger
      </h1>
      <p className="adm-muted">
        La connexion à la base de données a peut-être échoué. Vos données ne sont pas perdues.
        {error.digest && <> Référence : {error.digest}.</>}
      </p>
      <div className="adm-actions">
        <button type="button" className="btn btn--solid" onClick={reset}>
          Réessayer
        </button>
        <a className="tlink" href="/admin">
          Retour à la vue d’ensemble
        </a>
      </div>
    </div>
  );
}
