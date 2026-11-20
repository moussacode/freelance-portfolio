/** Hôte Supabase, autorisé pour next/image (images du bucket freelance-images). */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname;
  } catch {
    return null;
  }
})();
const supabaseOrigin = supabaseHost ? `https://${supabaseHost}` : '';
const isDev = process.env.NODE_ENV !== 'production';

/**
 * CSP du site public (pages statiques en cache, ISR).
 * Pas de nonce ici : un nonce change à chaque requête et rendrait toutes les pages dynamiques.
 * Next insère des scripts en ligne (données de la page) qui changent à chaque build : 'unsafe-inline'
 * est donc nécessaire pour script-src. Tout le reste est fermé ou limité à ce qui sert vraiment.
 * L'admin, lui, est dynamique : sa CSP stricte avec nonce est posée par src/proxy.ts.
 */
const siteCsp = [
  "default-src 'self'",
  // Script de thème (en ligne), JS du site et de GSAP (fichiers du site), Vercel Analytics
  // (/_vercel/insights en production ; va.vercel-scripts.com en développement).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com`,
  // Styles du site, attributs style de React et de GSAP.
  "style-src 'self' 'unsafe-inline'",
  // Images : site et optimiseur next/image (self), images Supabase, data: et blob: (SVG en ligne, aperçus).
  `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
  "font-src 'self'",
  // Statistiques Vercel (même origine en production).
  `connect-src 'self' https://va.vercel-scripts.com${isDev ? ' ws: wss:' : ''}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

/** En-têtes de sécurité communs à toutes les réponses. */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()',
  },
  // HTTPS obligatoire pendant 2 ans (sans « preload », qui engage durablement le domaine).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le français est la langue par défaut : la racine redirige vers /fr.
  async redirects() {
    return [{ source: '/', destination: '/fr', permanent: false }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // CSP du site : partout sauf /admin (CSP avec nonce posée par proxy.ts).
      { source: '/((?!admin).*)', headers: [{ key: 'Content-Security-Policy', value: siteCsp }] },
      // Ceinture et bretelles : l'admin et l'API ne sont jamais indexés.
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/admin', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
  // Images envoyées par l'admin à l'enregistrement : jusqu'à 6 images de 2 Mo (vérifié côté serveur).
  experimental: {
    serverActions: { bodySizeLimit: '13mb' },
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/freelance-images/**' }]
      : [],
  },
};

export default nextConfig;
