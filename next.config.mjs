/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.base44.com" },
    ],
  },
  experimental: {
    // Allow survey PDF/image uploads in App Router route handlers
    serverActions: {
      bodySizeLimit: "14mb",
    },
  },
};

export default nextConfig;
