/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark @sparticuz/chromium as a server-side external package
  // This prevents build warnings when the package isn't installed locally
  // The package will be available at runtime in serverless environments
  serverExternalPackages: ["@sparticuz/chromium"],
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
};

module.exports = nextConfig;
