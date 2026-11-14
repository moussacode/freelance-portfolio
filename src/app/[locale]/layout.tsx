import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { htmlLang, isLocale, locales } from '@/content/i18n';
import { getDict } from '@/content/ui';
import { person } from '@/content/site';
import { bootScript } from '@/lib/boot';
import '../globals.css';

// Polices du design system « Studio clair » : Bricolage Grotesque pour les titres, Inter pour le texte.
const bricolage = localFont({
  src: '../../fonts/Bricolage-latin.woff2',
  variable: '--font-bricolage',
  weight: '200 800',
  display: 'swap',
});
const inter = localFont({
  src: '../../fonts/Inter-latin.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
});

export const dynamicParams = false;
export const generateStaticParams = () => locales.map((locale) => ({ locale }));

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDict(locale);
  return {
    metadataBase: new URL(person.site),
    title: { default: dict.meta.title, template: `%s · ${person.handle}` },
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
  // Données structurées : un prestataire de services, pour le référencement local.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: person.handle,
    description: dict.meta.description,
    url: person.site,
    email: person.email,
    founder: { '@type': 'Person', name: person.name },
    address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
    areaServed: 'SN',
    sameAs: [person.github, person.linkedin],
  };


  return (
    <html lang={htmlLang[locale]} className={`${bricolage.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <Shell locale={locale}>{children}</Shell>
      </body>
    </html>
  );
}
