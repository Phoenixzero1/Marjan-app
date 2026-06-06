/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "archiver",
      "pg",
      "@prisma/adapter-pg",
      "sharp",
      "bcryptjs",
    ],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
