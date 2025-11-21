import type { NextConfig } from "next";

// Force set PRISMA_CLIENT_ENGINE_TYPE before any Prisma imports
process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
