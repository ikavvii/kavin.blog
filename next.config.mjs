/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: import.meta.dirname,
  experimental: {
    // Allow uploads up to ~25MB through server actions/route handlers if needed.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
