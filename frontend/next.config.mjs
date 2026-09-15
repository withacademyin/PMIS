/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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
