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
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "C:/DumpStack.log.tmp",
        "C:/hiberfil.sys",
        "C:/pagefile.sys",
        "C:/swapfile.sys",
      ],
    };
    return config;
  },
};

module.exports = nextConfig;
