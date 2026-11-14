import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { routerStore } from './router';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; scroll?: boolean };

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, onClick, prefetch: _p, scroll: _s, ...rest }, ref) {
  // Dans l'aperçu, l'URL reste celle de l'artifact : on garde seulement l'ancre pour le clic droit.
  const hash = href.includes('#') ? '#' + href.split('#')[1] : '#';
  return (
    <a
      ref={ref}
      href={hash}
      data-href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        const [p, h] = href.split('#');
        if (p && p !== routerStore.get()) {
          routerStore.set(p);
          if (h) requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView());
          else window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (h) document.getElementById(h)?.scrollIntoView({ behavior: 'smooth' });
      }}
      {...rest}
    />
  );
});
export default Link;
