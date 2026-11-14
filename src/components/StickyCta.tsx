'use client';

import { useEffect, useState } from 'react';
import { person, waLink } from '@/content/site';
import { useApp } from './AppContext';
import { Chat } from './Icons';

/**
 * Sur téléphone : un bouton WhatsApp reste en bas de l'écran une fois l'accueil passé,
 * et s'efface quand la section contact est visible (elle a déjà ses propres boutons).
 */
export function StickyCta() {
  const { dict, locale } = useApp();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('.fhero');
    const contact = document.getElementById('contact');
    if (!hero || !contact) return;
    let pastHero = false;
    let atContact = false;
    const update = () => setShow(pastHero && !atContact);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) pastHero = !e.isIntersecting;
        else atContact = e.isIntersecting;
      }
      update();
    });
    io.observe(hero);
    io.observe(contact);
    return () => io.disconnect();
  }, [locale]);

  const href = person.whatsapp ? waLink(dict.hero.waHello) : `#contact`;
  return (
    <div className="sticky" data-show={show} inert={!show}>
      <a className="btn btn--wa" href={href} target={person.whatsapp ? '_blank' : undefined} rel="noopener noreferrer">
        <Chat />
        {person.whatsapp ? dict.sticky : dict.nav.quote}
      </a>
    </div>
  );
}
