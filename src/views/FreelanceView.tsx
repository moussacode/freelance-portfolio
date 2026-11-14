'use client';

import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { faq, mailLink, person, reasons, services, steps, testimonials, waLink, works } from '@/content/site';
import { tr } from '@/content/i18n';
import { useApp } from '@/components/AppContext';
import { TLink } from '@/components/TLink';
import { Accented } from '@/components/Accented';
import { Poster } from '@/components/Cover';
import { Arrow, Chat, Check, External, Mail } from '@/components/Icons';
import { gsap, motionOK, SplitText, useGSAP } from '@/lib/gsap';
import { useReveals } from '@/lib/useReveals';

export function FreelanceView() {
  const root = useRef<HTMLDivElement>(null);
  useReveals(root);
  return (
    <div ref={root}>
      <Hero />
      <Reasons />
      <Services />
      <Works />
      <Method />
      {testimonials.length > 0 && <Testimonials />}
      <Faq />
      <Contact />
    </div>
  );
}

/* ---------- Accueil : la promesse, l'action, le visage ---------- */
function Hero() {
  const { locale, dict } = useApp();
  const root = useRef<HTMLElement>(null);

  // Une seule séquence à l'arrivée : le disque s'ouvre, la photo monte, le titre se pose.
  useGSAP(
    () => {
      if (!motionOK()) return;
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.fhero__disc', { scale: 0.4, duration: 1.2 }, 0)
        .from('.fhero__photo', { yPercent: 12, duration: 1.2 }, 0.05)
        .from('.fhero__card', { y: 24, autoAlpha: 0, duration: 0.8 }, 0.5);
      document.fonts.ready.then(() => {
        const title = root.current?.querySelector<HTMLElement>('.fhero__title');
        if (!title) return;
        SplitText.create(title, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 105, duration: 1, ease: 'expo.out', stagger: 0.08 }),
        });
      });
    },
    { scope: root },
  );

  const hasWa = Boolean(person.whatsapp);
  return (
    <section className="fhero" ref={root}>
      <div className="fhero__text">
        <p className="tag">{dict.hero.tag}</p>
        <h1 className="fhero__title">
          <Accented text={dict.hero.title} />
        </h1>
        <p className="fhero__lead">{dict.hero.lead}</p>
        <div className="fhero__cta">
          {hasWa ? (
            <a className="btn btn--wa btn--big" href={waLink(dict.hero.waHello)} target="_blank" rel="noopener noreferrer">
              <Chat />
              {dict.hero.primary}
              <span className="sr">({dict.a11y.newTab})</span>
            </a>
          ) : (
            <TLink className="btn btn--solid btn--big" href={`/${locale}#contact`}>
              {dict.hero.primaryNoWa}
            </TLink>
          )}
          <TLink className="btn btn--big" href={`/${locale}#realisations`}>
            {dict.hero.secondary}
          </TLink>
        </div>
      </div>

      <div className="fhero__visual">
        <div className="fhero__stage">
          <span className="fhero__disc" aria-hidden="true" />
          <Image
            className="fhero__photo"
            src="/img/moussa-cutout.webp"
            alt={dict.hero.photoAlt}
            width={820}
            height={1513}
            sizes="(min-width: 900px) 42vw, 90vw"
            priority
          />
        </div>
        <div className="fhero__card card">
          <p className="label">{dict.hero.cardLabel}</p>
          <ul>
            {services.slice(0, 3).map((s) => (
              <li key={s.id}>
                <span className="tick">
                  <Check />
                </span>
                {tr(s.name, locale)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Trois raisons, en une ligne ---------- */
function Reasons() {
  const { locale, dict } = useApp();
  return (
    <section className="sec sec--tight" aria-labelledby="reasons-title">
      <h2 id="reasons-title" className="sr">
        {dict.reasons.title.replace(/[[\]]/g, '')}
      </h2>
      <ul className="reasons" data-rows>
        {reasons.map((r) => (
          <li key={r.title.fr}>
            <h3>{tr(r.title, locale)}</h3>
            <p>{tr(r.text, locale)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Services ---------- */
function Services() {
  const { locale, dict } = useApp();
  return (
    <section id="services" className="sec">
      <header className="sec__head">
        <h2 className="sec__title" data-split>
          <Accented text={dict.services.title} />
        </h2>
        <p className="sec__intro">{dict.services.intro}</p>
      </header>
      <ul className="services" data-rows>
        {services.map((s) => {
          const name = tr(s.name, locale);
          const href = person.whatsapp ? waLink(`${dict.services.waService} ${name}.`) : `/${locale}#contact`;
          return (
            <li key={s.id} className="service card">
              <h3 className="service__name">{name}</h3>
              <p className="service__pitch">{tr(s.pitch, locale)}</p>
              <p className="label">{dict.services.includes}</p>
              <ul className="service__points">
                {s.points.map((p) => (
                  <li key={p.fr}>
                    <span className="tick">
                      <Check />
                    </span>
                    {tr(p, locale)}
                  </li>
                ))}
              </ul>
              <a
                className="service__ask"
                href={href}
                target={person.whatsapp ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label={`${dict.services.ask} : ${name}`}
              >
                {dict.services.ask}
                <span className="round round--small" aria-hidden="true">
                  <Arrow />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- Réalisations ---------- */
function Works() {
  const { locale, dict } = useApp();
  return (
    <section id="realisations" className="sec">
      <header className="sec__head">
        <h2 className="sec__title" data-split>
          <Accented text={dict.works.title} />
        </h2>
        <p className="sec__intro">{dict.works.intro}</p>
      </header>
      <ul className="works" data-rows>
        {works.map((w) => (
          <li key={w.name.fr} className="work">
            <div className="work__cover">
              <Poster id={w.cover} />
            </div>
            <p className="tag">{tr(w.kind, locale)}</p>
            <h3 className="work__name">{tr(w.name, locale)}</h3>
            <p className="work__text">{tr(w.text, locale)}</p>
            <p className="work__frame">{tr(w.frame, locale)}</p>
          </li>
        ))}
      </ul>
      {/* {person.portfolio && (
        <p className="works__all">
          <a className="tlink" href={person.portfolio} target="_blank" rel="noopener noreferrer">
            {dict.works.all}
            <External />
            <span className="sr">({dict.a11y.newTab})</span>
          </a>
        </p>
      )} */}
    </section>
  );
}

/* ---------- Méthode : une vraie suite d'étapes, donc numérotée ---------- */
function Method() {
  const { locale, dict } = useApp();
  return (
    <section id="methode" className="sec">
      <header className="sec__head">
        <h2 className="sec__title" data-split>
          <Accented text={dict.method.title} />
        </h2>
        <p className="sec__intro">{dict.method.intro}</p>
      </header>
      <ol className="steps" data-rows>
        {steps.map((s, i) => (
          <li key={s.title.fr} className="fstep">
            <p className="fstep__n">
              <span className="sr">{dict.method.step} </span>
              {i + 1}
            </p>
            <h3>{tr(s.title, locale)}</h3>
            <p>{tr(s.text, locale)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- Avis clients (affichés seulement s'il y en a de vrais) ---------- */
function Testimonials() {
  const { locale, dict } = useApp();
  return (
    <section className="sec">
      <header className="sec__head">
        <h2 className="sec__title" data-split>
          <Accented text={dict.testimonials.title} />
        </h2>
      </header>
      <ul className="quotes">
        {testimonials.map((t) => (
          <li key={t.author} className="card quote">
            <blockquote>{tr(t.quote, locale)}</blockquote>
            <p className="label">{t.author}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Questions fréquentes ---------- */
function Faq() {
  const { locale, dict } = useApp();
  return (
    <section id="questions" className="sec">
      <header className="sec__head">
        <h2 className="sec__title" data-split>
          <Accented text={dict.faq.title} />
        </h2>
      </header>
      <div className="faq">
        {faq.map((f) => (
          <details key={f.q.fr} className="faq__item card">
            <summary>
              {tr(f.q, locale)}
              <span className="faq__plus" aria-hidden="true" />
            </summary>
            <p>{tr(f.a, locale)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------- Contact : un mini-brief qui part sur WhatsApp ou par e-mail ---------- */
function Contact() {
  const { locale, dict } = useApp();
  const c = dict.contact;
  const [name, setName] = useState('');
  const [type, setType] = useState(tr(services[0].name, locale));
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const hasWa = Boolean(person.whatsapp);

  const compose = () =>
    [c.intro, name.trim() && `${c.iAm} ${name.trim()}.`, `${c.need} ${type}.`, message.trim()].filter(Boolean).join('\n');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    window.open(hasWa ? waLink(compose()) : mailLink(c.subject, compose()), hasWa ? '_blank' : '_self', 'noopener');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.location.href = `mailto:${person.email}`;
    }
  };

  return (
    <section id="contact" className="fcontact">
      <div className="fcontact__in">
        <div className="fcontact__text">
          <h2 className="fcontact__title" data-split>
            <Accented text={c.title} />
          </h2>
          <p className="fcontact__lead">{c.lead}</p>
          <div className="fcontact__direct">
            <p className="label">{c.direct}</p>
            <a className="fcontact__mail" href={`mailto:${person.email}`}>
              {person.email}
            </a>
            <button type="button" className="tlink" onClick={copy}>
              {copied ? c.copied : c.copy}
            </button>
            <span className="sr" role="status">
              {copied ? c.copied : ''}
            </span>
          </div>
        </div>

        <form className="brief card" onSubmit={submit}>
          <label className="field">
            <span>{c.name}</span>
            <input type="text" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>{c.type}</span>
            <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
              {services.map((s) => (
                <option key={s.id}>{tr(s.name, locale)}</option>
              ))}
              <option>{c.other}</option>
            </select>
          </label>
          <label className="field">
            <span>{c.message}</span>
            <textarea
              name="message"
              rows={4}
              required
              placeholder={c.messageHint}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <div className="brief__actions">
            <button type="submit" className={hasWa ? 'btn btn--wa btn--big' : 'btn btn--solid btn--big'}>
              {hasWa ? <Chat /> : <Mail />}
              {hasWa ? c.sendWa : c.sendMail}
            </button>
            {hasWa && (
              <a className="btn btn--big" href={mailLink(c.subject, compose())}>
                <Mail />
                {c.sendMail}
              </a>
            )}
          </div>
          <p className="brief__note">{c.note}</p>
        </form>
      </div>
    </section>
  );
}
