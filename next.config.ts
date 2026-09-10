import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "187.77.114.147",
        port: "9981",
        pathname: "/statics/qrcode/**",
      },
    ],
  },
};

export default nextConfig;
