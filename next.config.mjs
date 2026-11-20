/** Hôte Supabase, autorisé pour next/image (images du bucket freelance-images). */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le français est la langue par défaut : la racine redirige vers /fr.
  async redirects() {
    return [{ source: '/', destination: '/fr', permanent: false }];
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/freelance-images/**' }]
      : [],
  },
};

export default nextConfig;
