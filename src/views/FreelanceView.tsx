'use client';

import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { person, reasons, steps } from '@/content/site';
import { tr } from '@/content/i18n';
import { useApp } from '@/components/AppContext';
import { useContent } from '@/components/ContentContext';
import { buildMailLink, buildWhatsAppLink } from '@/lib/contact';
import { TLink } from '@/components/TLink';
import { Accented } from '@/components/Accented';
import { Poster } from '@/components/Cover';
import { Arrow, Chat, Check, External, Mail } from '@/components/Icons';
import { gsap, motionOK, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { useReveals } from '@/lib/useReveals';
import { createLiquid, type Liquid } from '@/lib/liquidTitle';

export function FreelanceView() {
  const root = useRef<HTMLDivElement>(null);
  const { works, testimonials } = useContent();
  useReveals(root);
  return (
    <div ref={root}>
      <Hero />
      <Reasons />
      <Services />
      {works.length > 0 && <Works />}
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
  const { services, works, settings } = useContent();
  const root = useRef<HTMLElement>(null);

  // Une entrée joueuse, en moins de deux secondes :
  // le disque rebondit, Moussa surgit derrière, la carte se pose de travers puis se redresse,
  // les mots du titre sautent un à un. Ensuite, la fin du titre change, sans se presser.
  // Sur ordinateur, le titre devient liquide (lib/liquidTitle) : la souris en arrache des gouttes
  // et les fins se fondent l'une dans l'autre. Ailleurs, le fondu passe par un filtre SVG (#fhero-goo).
  // Tout est en gsap.from : sans JavaScript ou en version calme, la page est déjà complète.
  useGSAP(
    (_context, contextSafe) => {
      if (!motionOK() || !contextSafe) return;

      const tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)' } });
      tl.from('.fhero__disc', { scale: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'elastic.out(1, 0.55)' }, 0)
        .from('.fhero__photo', { yPercent: 35, duration: 0.9 }, 0.15)
        .from('.fhero__text .tag', { scale: 0.6, rotation: -8, transformOrigin: '0% 50%', duration: 0.6 }, 0.1)
        .from('.fhero__card', { y: 40, rotation: -9, scale: 0.85, autoAlpha: 0, duration: 0.8 }, 0.55)
        .from('.fhero__card .tick', { scale: 0, duration: 0.4, ease: 'back.out(3)', stagger: 0.08 }, 0.85)
        // Les boutons restent visibles : un simple rebond d'échelle, sans opacité.
        .from('.fhero__cta > *', { scale: 0.92, duration: 0.6, ease: 'elastic.out(1, 0.5)', stagger: 0.08 }, 0.6);

      let cancelled = false;
      let visible = true;
      let current = 0;
      let liquid: Liquid | null = null;
      const PAUSE = 4.6; // temps de lecture d'une fin de titre
      const stopLiquid = () => {
        liquid?.destroy();
        liquid = null;
        root.current?.querySelector('.fhero__title')?.classList.remove('is-liquid');
      };

      // Une fin de titre s'efface pendant que la suivante apparaît ; le filtre les fait fusionner.
      // On joue sur l'opacité seule : le texte reste lisible par les lecteurs d'écran.
      const morph = contextSafe(() => {
        if (cancelled) return;
        const rotor = root.current?.querySelector<HTMLElement>('.fhero__rotor');
        const ends = gsap.utils.toArray<HTMLElement>('.fhero__end', root.current);
        if (!rotor || ends.length < 2) return;
        if (!visible || document.hidden) {
          gsap.delayedCall(1, morph);
          return;
        }
        const out = ends[current];
        current = (current + 1) % ends.length;
        const inn = ends[current];
        if (liquid) {
          // Titre liquide : c'est la matière elle-même qui passe d'un texte à l'autre.
          const duration = 1.6;
          liquid.morphTo(current, duration);
          gsap.set(out, { opacity: 0 });
          gsap.set(inn, { opacity: 1 });
          gsap.delayedCall(duration + PAUSE, morph);
          return;
        }
        gsap
          .timeline({
            defaults: { duration: 1.5, ease: 'sine.inOut' },
            onComplete: () => void gsap.delayedCall(PAUSE, morph),
          })
          .set(rotor, { filter: 'url(#fhero-goo)' })
          .to(out, { opacity: 0, filter: 'blur(0.1em)' }, 0)
          .fromTo(inn, { opacity: 0, filter: 'blur(0.1em)' }, { opacity: 1, filter: 'blur(0em)' }, 0.15)
          .set([rotor, out, inn], { clearProps: 'filter' });
      });

      // Une fois l'entrée terminée (les lettres sont à leur place), le titre passe en liquide.
      const startLiquid = contextSafe(() => {
        if (cancelled) return;
        const title = root.current?.querySelector<HTMLElement>('.fhero__title');
        const canvas = root.current?.querySelector<HTMLCanvasElement>('.fhero__liquid');
        const lead = root.current?.querySelector<HTMLElement>('.fhero__title-lead');
        const ends = gsap.utils.toArray<HTMLElement>('.fhero__end', root.current);
        if (!title || !canvas || !lead || !ends.length) return;
        liquid = createLiquid({ title, canvas, lead, ends, index: current, onLost: stopLiquid });
        if (liquid) title.classList.add('is-liquid');
      });

      // Le titre attend les polices : le découpage dépend de leur largeur réelle.
      const splitTitle = contextSafe(() => {
        const lead = root.current?.querySelector<HTMLElement>('.fhero__title-lead');
        if (!lead) return;
        SplitText.create(lead, {
          type: 'lines,words',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, { yPercent: 110, rotation: 6, duration: 0.7, ease: 'back.out(2)', stagger: 0.06 }),
        });
        gsap.from('.fhero__end:first-child', {
          yPercent: 45,
          rotation: 3,
          opacity: 0,
          duration: 0.7,
          ease: 'back.out(2)',
          delay: 0.2,
        });
        // Le relais s'arrête quand l'accueil n'est plus à l'écran.
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            visible = self.isActive;
          },
        });
        gsap.delayedCall(1.8, startLiquid);
        gsap.delayedCall(PAUSE + 1, morph);
      });
      document.fonts.ready.then(() => !cancelled && splitTitle());
      return () => {
        cancelled = true;
        stopLiquid();
      };
    },
    { scope: root },
  );

  const wa = buildWhatsAppLink(settings, { context: 'contact', lang: locale });
  return (
    <section className="fhero" ref={root}>
      <div className="fhero__text">
        <p className="tag">{dict.hero.tag}</p>
        <h1 className="fhero__title">
          <span className="fhero__title-lead">{dict.hero.titleLead}</span>{' '}
          {/* Les fins sont empilées au même endroit : la plus longue réserve la place, rien ne saute. */}
          <span className="fhero__rotor accent">
            {dict.hero.titleEnds.map((end, i) => (
              <span key={end} className="fhero__end" aria-hidden={i > 0 ? true : undefined}>
                {end}
              </span>
            ))}
          </span>
          {/* Toile du titre liquide : vide et invisible tant que l'effet n'est pas lancé. */}
          <canvas className="fhero__liquid" aria-hidden="true" />
        </h1>
        {/* Filtre « encre » : il n'est branché que pendant le changement de texte. */}
        <svg className="fhero__goo" width="0" height="0" aria-hidden="true" focusable="false">
          <filter id="fhero-goo" x="-10%" y="-25%" width="120%" height="150%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
          </filter>
        </svg>
        <p className="fhero__lead">{dict.hero.lead}</p>
        <div className="fhero__cta">
          {wa ? (
            <a className="btn btn--wa btn--big" href={wa} target="_blank" rel="noopener noreferrer">
              <Chat />
              {dict.hero.primary}
              <span className="sr">({dict.a11y.newTab})</span>
            </a>
          ) : (
            <TLink className="btn btn--solid btn--big" href={`/${locale}#contact`}>
              {dict.hero.primaryNoWa}
            </TLink>
          )}
          {works.length > 0 && (
            <TLink className="btn btn--big" href={`/${locale}#realisations`}>
              {dict.hero.secondary}
            </TLink>
          )}
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
  const { services, settings } = useContent();
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
          const wa = buildWhatsAppLink(settings, { context: 'quote', lang: locale, service: name });
          return (
            <li key={s.id} className="service card">
              <h3 className="service__name">{name}</h3>
              <p className="service__pitch">{tr(s.pitch, locale)}</p>
              <p className="label">{dict.services.includes}</p>
              <ul className="service__points">
                {s.points.map((p, i) => (
                  <li key={i}>
                    <span className="tick">
                      <Check />
                    </span>
                    {tr(p, locale)}
                  </li>
                ))}
              </ul>
              <a
                className="service__ask"
                href={wa ?? `/${locale}#contact`}
                target={wa ? '_blank' : undefined}
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

/* ---------- Réalisations (affichées seulement s'il y en a au moins une visible) ---------- */
function Works() {
  const { locale, dict } = useApp();
  const { works } = useContent();
  return (
    <section id="realisations" className="sec">
      <header className="sec__head">
        <h2 className="sec__title" data-split>
          <Accented text={dict.works.title} />
        </h2>
        <p className="sec__intro">{dict.works.intro}</p>
      </header>
      {/* Mise en page selon le nombre : 1 = image et texte côte à côte ; multiple de 3 = trois colonnes ; sinon deux. */}
      <ul
        className="works"
        data-layout={works.length === 1 ? 'solo' : works.length % 3 === 0 ? 'trio' : 'duo'}
        data-rows
      >
        {works.map((w) => (
          <li key={w.id} className="work">
            <div className="work__cover">
              {w.image ? (
                <Image className="work__img" src={w.image} alt="" fill sizes="(min-width: 760px) 45vw, 90vw" />
              ) : (
                w.cover && <Poster id={w.cover} />
              )}
            </div>
            <p className="tag">{tr(w.kind, locale)}</p>
            <h3 className="work__name">{tr(w.name, locale)}</h3>
            <p className="work__text">{tr(w.text, locale)}</p>
            <p className="work__frame">{tr(w.frame, locale)}</p>
            {w.url && (
              <a className="tlink" href={w.url} target="_blank" rel="noopener noreferrer">
                {dict.works.visit} <External />
                <span className="sr">({dict.a11y.newTab})</span>
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="works__all">
        <a className="tlink" href={person.portfolio} target="_blank" rel="noopener noreferrer">
          {dict.works.all}
          <External />
          <span className="sr">({dict.a11y.newTab})</span>
        </a>
      </p>
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
  const { testimonials } = useContent();
  return (
    <section className="sec">
      <header className="sec__head">
        <h2 className="sec__title" data-split>
          <Accented text={dict.testimonials.title} />
        </h2>
      </header>
      <ul className="quotes">
        {testimonials.map((t) => (
          <li key={t.id} className="card quote">
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
  const { faq } = useContent();
  return (
    <section id="questions" className="sec">
      <header className="sec__head">
        <h2 className="sec__title" data-split>
          <Accented text={dict.faq.title} />
        </h2>
      </header>
      <div className="faq">
        {faq.map((f) => (
          <details key={f.id} className="faq__item card">
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
  const { services, settings } = useContent();
  const c = dict.contact;
  const [name, setName] = useState('');
  const [type, setType] = useState(services[0] ? tr(services[0].name, locale) : c.other);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const hasWa = Boolean(settings.whatsapp);
  const email = settings.email;

  // L'en-tête du brief vient des réglages (message « brief ») ; le reste, du formulaire.
  const body = () =>
    [name.trim() && `${c.iAm} ${name.trim()}.`, `${c.need} ${type}.`, message.trim()].filter(Boolean).join('\n');
  const compose = () => [tr(settings.messages.brief, locale), body()].filter(Boolean).join('\n');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const wa = buildWhatsAppLink(settings, { context: 'brief', lang: locale, body: body() });
    const target = wa ?? buildMailLink(settings, c.subject, compose());
    if (target) window.open(target, wa ? '_blank' : '_self', 'noopener');
  };

  const copy = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  const mailHref = buildMailLink(settings, c.subject, compose());

  return (
    <section id="contact" className="fcontact">
      <div className="fcontact__in">
        <div className="fcontact__text">
          <h2 className="fcontact__title" data-split>
            <Accented text={c.title} />
          </h2>
          <p className="fcontact__lead">{c.lead}</p>
          {email && (
            <div className="fcontact__direct">
              <p className="label">{c.direct}</p>
              <a className="fcontact__mail" href={`mailto:${email}`}>
                {email}
              </a>
              <button type="button" className="tlink" onClick={copy}>
                {copied ? c.copied : c.copy}
              </button>
              <span className="sr" role="status">
                {copied ? c.copied : ''}
              </span>
            </div>
          )}
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
            {hasWa && mailHref && (
              <a className="btn btn--big" href={mailHref}>
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
