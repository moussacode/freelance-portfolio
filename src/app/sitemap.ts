import type { MetadataRoute } from 'next';
import { locales } from '@/content/i18n';
import { person } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({ url: `${person.site}/${locale}`, priority: 1 }));
}
