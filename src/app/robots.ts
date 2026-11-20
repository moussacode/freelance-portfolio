import type { MetadataRoute } from 'next';
import { person } from '@/content/site';

export default function robots(): MetadataRoute.Robots {
  // L'admin et les routes techniques ne doivent pas être indexés (l'admin porte aussi la balise noindex).
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${person.site}/sitemap.xml`,
  };
}
