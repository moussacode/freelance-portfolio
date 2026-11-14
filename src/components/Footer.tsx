'use client';

import Image from 'next/image';
import { person } from '@/content/site';
import { useApp } from './AppContext';
import { LogoMark, LogoWord } from './Logo';
import { External } from './Icons';

export function Footer() {
  const { dict, calm, setCalm, navigate } = useApp();
  return (
    <footer className="ftr">
      <div className="ftr__logo" aria-hidden="true">
        <LogoMark />
        <LogoWord />
      </div>
      <p className="sig">
        <span className="sig__avatar">
          <Image src="/img/avatar.webp" alt="" width={48} height={48} />
        </span>
        {person.social}
      </p>
      <div className="ftr__row">
        <a className="tlink" href={person.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn <External />
          <span className="sr">({dict.a11y.newTab})</span>
        </a>
        <a className="tlink" href={person.github} target="_blank" rel="noopener noreferrer">
          GitHub <External />
          <span className="sr">({dict.a11y.newTab})</span>
        </a>
        <button type="button" className="tlink" role="switch" aria-checked={!calm} onClick={() => setCalm(!calm)}>
          {dict.footer.motion} : {calm ? dict.footer.motionOff : dict.footer.motionOn}
        </button>
        <button type="button" className="tlink" onClick={() => navigate('#')}>
          {dict.footer.top}
        </button>
      </div>
      <p className="ftr__rights">© {new Date().getFullYear()} {dict.footer.rights}</p>
    </footer>
  );
}
