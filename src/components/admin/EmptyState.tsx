import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

/** État vide : ce qui manque, et l'action pour le remplir. */
export function EmptyState({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="adm-empty card">
      <span className="adm-empty__icon" aria-hidden="true">
        <Inbox />
      </span>
      <h2 className="adm-empty__title">{title}</h2>
      {text && <p className="adm-muted">{text}</p>}
      {children && <div className="adm-actions">{children}</div>}
    </div>
  );
}
