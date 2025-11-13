/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com", // ✅ habilita Imgur
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net", // si usás íconos o assets externos
      },
    ],
  },
  typescript: {
    
    ignoreBuildErrors: true,
  },
   eslint: {
    
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
