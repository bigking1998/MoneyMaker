const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/],
  publicExcludes: ['!robots.txt'],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    typedRoutes: true,
  },
  env: {
    FREQTRADE_API_URL: process.env.FREQTRADE_API_URL || 'http://localhost:8080/api/v1',
  },
};

module.exports = withPWA(nextConfig);