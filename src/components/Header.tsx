'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/content/i18n';
import { person } from '@/content/site';
import { useApp } from './AppContext';
import { TLink } from './TLink';
import { Moon, Sun } from './Icons';

/**
 * Barre de navigation « pilule dynamique » :
 * - en haut de page : une seule pilule de verre sur toute la largeur (identité, liens, réglages) ;
 * - au défilement : elle se resserre au centre (photo, nom, trois points) ;
 * - en descendant vite : elle s'efface, et revient dès qu'on remonte ;
 * - survol, focus clavier ou clic sur les points : elle se redéploie.
 */
type Mode = 'full' | 'compact' | 'hidden';

const DESKTOP = '(min-width: 820px)';

export function Header() {
  const { locale, dict, theme, toggleTheme } = useApp();
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>('full');
  const [open, setOpen] = useState(false); // déployée à la demande (survol, focus, clic)
  const [menu, setMenu] = useState(false); // panneau du menu sur mobile
  const bar = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef(0);

  /* État selon le défilement */
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (y < 80) return setMode('full');
      if (dy > 6 && y > window.innerHeight * 0.8) return setMode('hidden');
      if (dy < -6) return setMode('compact');
      setMode((m) => (m === 'full' ? 'compact' : m));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* On referme tout en changeant de page */
  useEffect(() => {
    setMenu(false);
    setOpen(false);
  }, [pathname]);

  /* Échap referme */
  useEffect(() => {
    if (!menu && !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenu(false);
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu, open]);

  /* Un clic ailleurs referme la pilule déployée */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!bar.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const enter = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !matchMedia(DESKTOP).matches) return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpen(true), 90); // petite intention, pour éviter les déploiements accidentels
  }, []);
  const leave = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(hoverTimer.current);
    if (bar.current?.contains(document.activeElement) && document.activeElement?.matches(':focus-visible')) return;
    hoverTimer.current = window.setTimeout(() => setOpen(false), 260);
  }, []);

  const expanded = mode === 'full' || open;
  const hidden = mode === 'hidden' && !open && !menu;

  const links = [
    { id: 'services', label: dict.nav.services },
    // { id: 'realisations', label: dict.nav.works },
    { id: 'methode', label: dict.nav.method },
    { id: 'questions', label: dict.nav.faq },
  ];
  const pathFor = (l: Locale) => pathname.replace(/^\/(fr|en)(?=\/|$)/, `/${l}`);

  const langs = (
    <ul className="langs" aria-label={dict.a11y.language}>
      {locales.map((l) => (
        <li key={l}>
          <TLink href={pathFor(l)} hrefLang={l} aria-current={l === locale ? 'true' : undefined} title={localeNames[l]}>
            {l.toUpperCase()}
          </TLink>
        </li>
      ))}
    </ul>
  );

  return (
    <header className="hdr" data-state={expanded ? 'full' : 'compact'} data-hidden={hidden}>
      <div
        className="hdr__bar glass"
        ref={bar}
        onPointerEnter={enter}
        onPointerLeave={leave}
        onFocus={(e) => {
          // Au clavier, la pilule se déploie pour que chaque lien soit visible.
          if (matchMedia(DESKTOP).matches && (e.target as HTMLElement).matches(':focus-visible')) setOpen(true);
        }}
        onBlur={(e) => {
          if (!bar.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        <TLink href={`/${locale}`} className="hdr__id" aria-label={dict.a11y.home}>
          <span className="hdr__avatar">
            <Image src="/img/avatar.webp" alt="" width={36} height={36} priority />
            {person.available && <i className="hdr__status" title={dict.a11y.available} />}
          </span>
          <span className="hdr__name">{person.handle}</span>
          {person.available && <span className="sr">, {dict.a11y.available}</span>}
        </TLink>

        <div className="hdr__more" inert={!expanded}>
          <div className="hdr__more-in">
            <nav className="hdr__nav" aria-label={dict.a11y.mainNav}>
              {links.map((l) => (
                <TLink key={l.id} href={`/${locale}#${l.id}`}>
                  {l.label}
                </TLink>
              ))}
            </nav>
            <span className="hdr__sep" aria-hidden="true" />
            <div className="hdr__langs">{langs}</div>
            <button
              type="button"
              className="tool"
              aria-label={theme === 'dark' ? dict.a11y.toLight : dict.a11y.toDark}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
              }}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <TLink className="btn btn--solid btn--small hdr__cta" href={`/${locale}#contact`}>
              {dict.nav.quote}
            </TLink>
          </div>
        </div>

        <button
          type="button"
          className="hdr__dots"
          aria-expanded={menu || open}
          aria-controls="menu"
          aria-label={menu || open ? dict.a11y.close : dict.a11y.menu}
          onClick={() => {
            if (matchMedia(DESKTOP).matches) setOpen((v) => !v);
            else setMenu((v) => !v);
          }}
        >
          <i />
          <i />
          <i />
        </button>
      </div>

      <div id="menu" className="hdr__sheet glass" hidden={!menu}>
        <nav aria-label={dict.a11y.mainNav}>
          {links.map((l) => (
            <TLink key={l.id} href={`/${locale}#${l.id}`} onClick={() => setMenu(false)}>
              {l.label}
            </TLink>
          ))}
        </nav>
        <TLink className="btn btn--solid" href={`/${locale}#contact`} onClick={() => setMenu(false)}>
          {dict.nav.quote}
        </TLink>
        {langs}
      </div>
    </header>
  );
}
