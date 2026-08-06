import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone is for Docker/self-host; Vercel uses its own output
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
