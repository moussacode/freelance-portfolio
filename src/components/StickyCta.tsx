'use client';

import { useEffect, useState } from 'react';
import { buildWhatsAppLink } from '@/lib/contact';
import { useApp } from './AppContext';
import { useContent } from './ContentContext';
import { Chat } from './Icons';

/**
 * Sur téléphone : un bouton WhatsApp reste en bas de l'écran une fois l'accueil passé,
 * et s'efface quand la section contact est visible (elle a déjà ses propres boutons).
 */
export function StickyCta() {
  const { dict, locale } = useApp();
  const { settings } = useContent();
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

  const wa = buildWhatsAppLink(settings, { context: 'contact', lang: locale });
  return (
    <div className="sticky" data-show={show} inert={!show}>
      <a className="btn btn--wa" href={wa ?? '#contact'} target={wa ? '_blank' : undefined} rel="noopener noreferrer">
        <Chat />
        {wa ? dict.sticky : dict.nav.quote}
      </a>
    </div>
  );
}
