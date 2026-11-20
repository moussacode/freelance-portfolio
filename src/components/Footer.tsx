'use client';

import Image from 'next/image';
import { person } from '@/content/site';
import type { Socials } from '@/content/model';
import { useApp } from './AppContext';
import { useContent } from './ContentContext';
import { LogoMark, LogoWord } from './Logo';
import { External } from './Icons';

/** Réseaux affichés dans le pied de page, dans cet ordre, s'ils sont réglés dans l'admin. */
const networks: { key: keyof Socials; label: string }[] = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
];

export function Footer() {
  const { dict, calm, setCalm, navigate } = useApp();
  const { settings } = useContent();
  return (
    <footer className="ftr">
      <div className="ftr__logo" aria-hidden="true">
        <LogoMark />
        <LogoWord />
      </div>
      <p className="sig">
        <span className="sig__avatar">
          <Image src={settings.avatar} alt="" width={48} height={48} />
        </span>
        {person.social}
      </p>
      <div className="ftr__row">
        {networks.map(({ key, label }) => {
          const href = settings.socials[key];
          return (
            href && (
              <a key={key} className="tlink" href={href} target="_blank" rel="noopener noreferrer">
                {`${label} `}
                <External />
                <span className="sr">({dict.a11y.newTab})</span>
              </a>
            )
          );
        })}
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
