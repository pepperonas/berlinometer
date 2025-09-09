/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: '/Users/martin/WebstormProjects/mrx3k1/zauberkoch/zauberkoch-react',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3002', '127.0.0.1:3000', '127.0.0.1:3002', 'zauberkoch.local'],
    },
  },
  // PWA configuration
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/_next/static/sw.js',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
};

export default nextConfig;