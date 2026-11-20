import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { htmlLang, isLocale, locales } from '@/content/i18n';
import { getDict } from '@/content/ui';
import { person } from '@/content/site';
import { bootScript } from '@/lib/boot';
import { getSiteContent } from '@/lib/content';
import { Analytics } from '@vercel/analytics/next';
import { bricolage, inter } from '../fonts';
import '../globals.css';

// ISR : voir page.tsx. Valeur littérale exigée par Next (= CONTENT_REVALIDATE).
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => locales.map((locale) => ({ locale }));

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDict(locale);
  return {
    metadataBase: new URL(person.site),
    title: { default: dict.meta.title, template: `%s | ${person.handle}` },
    description: dict.meta.description,
    authors: [{ name: person.name, url: person.site }],
    alternates: {
      canonical: `/${locale}`,
      languages: { fr: '/fr', en: '/en' },
    },
    openGraph: {
      type: 'website',
      siteName: person.handle,
      title: dict.meta.title,
      description: dict.meta.description,
      url: `/${locale}`,
      locale: locale === 'en' ? 'en_US' : 'fr_FR',
      // Fichier src/app/opengraph-image.png. À déclarer ici : ce bloc openGraph remplace celui hérité de app/.
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: dict.meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.meta.title,
      description: dict.meta.description,
      images: [{ url: '/twitter-image.png', width: 1200, height: 630, alt: dict.meta.title }],
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f2ec' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1f2a' },
  ],
};

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDict(locale);
  const content = await getSiteContent();
  const { email, socials } = content.settings;
  // Données structurées : un prestataire de services, pour le référencement local.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: person.handle,
    description: dict.meta.description,
    url: person.site,
    email: email ?? undefined,
    founder: { '@type': 'Person', name: person.name },
    address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
    areaServed: 'SN',
    sameAs: [socials.github, socials.linkedin, socials.instagram, socials.tiktok].filter(Boolean),
  };


  return (
    <html lang={htmlLang[locale]} className={`${bricolage.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        {/* « < » échappé : une valeur venue de la base ne peut pas fermer la balise et injecter un script. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      </head>
      <body>
        <Shell locale={locale} content={content}>
          {children}
        </Shell>
        {/* Vercel Web Analytics : pages vues anonymes, sans cookie. Pas de suivi maison. */}
        <Analytics />
      </body>
    </html>
  );
}
