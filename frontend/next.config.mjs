/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.STANDALONE ? 'standalone' : undefined,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Use an environment variable for deployment, fallback to localhost for dev
        destination: `${process.env.BACKEND_API_URL || 'http://localhost:5001/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
