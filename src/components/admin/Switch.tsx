'use client';

/** Interrupteur accessible (role="switch"), cible de 44 px. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Nom lu par les lecteurs d'écran si aucun libellé visible n'est associé. */
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="adm-switch"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="adm-switch__track" aria-hidden="true">
        <span className="adm-switch__thumb" />
      </span>
    </button>
  );
}
