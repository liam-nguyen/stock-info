/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't externalize @sparticuz/chromium - we need it bundled/included
  // The package will be installed during deployment and needs to be available
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
  // Ensure the package is included in the output
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
