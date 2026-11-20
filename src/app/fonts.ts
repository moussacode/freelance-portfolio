import localFont from 'next/font/local';

// Polices du design system « Studio clair » : Bricolage Grotesque pour les titres, Inter pour le texte.
// Partagées par le site ([locale]/layout) et l'admin (admin/layout).
export const bricolage = localFont({
  src: '../fonts/Bricolage-latin.woff2',
  variable: '--font-bricolage',
  weight: '200 800',
  display: 'swap',
});
export const inter = localFont({
  src: '../fonts/Inter-latin.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
});
