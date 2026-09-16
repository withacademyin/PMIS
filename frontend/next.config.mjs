/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.STANDALONE ? 'standalone' : undefined,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Use an environment variable for deployment, fallback to localhost for dev
        destination: `${process.env.BACKEND_API_URL || 'https://backend-production-f7e35.up.railway.app/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
