import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better caching
  experimental: {
    // optimizeCss: true, // Disabled for Vercel deployment compatibility
  },
  
  // Configure headers for better cache control
  async headers() {
    return [
      {
        // Cache static assets for 1 year with revalidation
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images for 1 month
        source: '/(.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, must-revalidate',
          },
        ],
      },
      {
        // Cache JavaScript and CSS files for 1 year with revalidation
        source: '/(.*\\.(?:js|css))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
      {
        // Don't cache HTML pages to ensure fresh content
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // Configure webpack for better cache busting (Vercel compatible)
  webpack: (config, { dev, isServer }) => {
    // Only apply custom webpack config in production and client-side
    if (!dev && !isServer) {
      // Ensure output directory exists
      if (!config.output) {
        config.output = {};
      }
      // Use Next.js default chunk naming with content hash
      config.output.chunkFilename = 'static/chunks/[name].[contenthash].js';
    }
    return config;
  },
  
  // Enable compression
  compress: true,
  
  // Configure build output
  output: 'standalone',
  
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
