/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  compiler: {
    // Disable SWC entirely and use Babel
    styledComponents: false,
  },
  experimental: {
    // Maintain compatibility with App Router if needed
    forceSwcTransforms: false,
    esmExternals: 'loose'
  },
  webpack: (config, { dev, isServer }) => {
    // Force use of Babel instead of SWC
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  }
};

module.exports = nextConfig;
