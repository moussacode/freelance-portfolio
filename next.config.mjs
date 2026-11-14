/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le français est la langue par défaut : la racine redirige vers /fr.
  async redirects() {
    return [{ source: '/', destination: '/fr', permanent: false }];
  },
};

export default nextConfig;
