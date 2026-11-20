'use client';

import type { Locale } from '@/content/i18n';

const labels: Record<Locale, string> = { fr: 'FR', en: 'EN' };

/** Choix de la langue éditée (FR / EN). Un point signale une langue incomplète. */
export function LangTabs({
  value,
  onChange,
  missing = [],
  label,
}: {
  value: Locale;
  onChange: (l: Locale) => void;
  missing?: Locale[];
  /** Ce que l'on traduit, pour les lecteurs d'écran : « Langue des messages ». */
  label: string;
}) {
  return (
    <div className="adm-langs" role="group" aria-label={label}>
      {(Object.keys(labels) as Locale[]).map((l) => (
        <button key={l} type="button" aria-pressed={value === l} onClick={() => onChange(l)}>
          {labels[l]}
          {missing.includes(l) && (
            <>
              <span className="adm-langs__dot" aria-hidden="true" />
              <span className="sr"> (à compléter)</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
