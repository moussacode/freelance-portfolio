import type { ReactNode } from 'react';

/** Champ de formulaire de l'admin : libellé, contrôle, aide ou erreur (reliés par aria-describedby). */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
      </label>
      {children}
      {(error || hint) && (
        <p id={`${id}-help`} className="adm-help">
          {error ? <FieldError text={error} /> : hint}
        </p>
      )}
    </div>
  );
}

export function FieldError({ text }: { text: string }) {
  return (
    <span className="adm-error adm-error--inline">
      <span className="adm-error__badge" aria-hidden="true" />
      {text}
    </span>
  );
}

/** Attributs d'accessibilité d'un contrôle relié à son aide ou son erreur. */
export const describe = (id: string, error?: string, hasHint = false) => ({
  id,
  'aria-invalid': Boolean(error) || undefined,
  'aria-describedby': error || hasHint ? `${id}-help` : undefined,
});
