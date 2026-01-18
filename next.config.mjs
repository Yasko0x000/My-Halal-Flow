/** @type {import('next').NextConfig} */
const nextConfig = {
  // C'est cette ligne qui sauve la mise :
  optimizeFonts: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
