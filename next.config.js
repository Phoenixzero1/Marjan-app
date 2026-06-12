/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "archiver",
    "pg",
    "@prisma/adapter-pg",
    "sharp",
    "bcryptjs",
  ],
  turbopack: {},
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
