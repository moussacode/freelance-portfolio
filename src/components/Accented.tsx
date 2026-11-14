import { Fragment } from 'react';

/**
 * Affiche un titre avec un seul passage en teal, comme sur les slides.
 * Le passage est marqué entre crochets dans le texte : « Ce que je [sais faire] ».
 */
export function Accented({ text }: { text: string }) {
  const parts = text.split(/\[([^\]]+)\]/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="accent">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
