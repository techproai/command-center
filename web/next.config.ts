import type { NextConfig } from "next";

const standalone = process.env.NEXT_STANDALONE === "true";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: standalone ? "standalone" : undefined,
};

export default nextConfig;

