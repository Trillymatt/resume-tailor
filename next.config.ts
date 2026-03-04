import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/tailor": ["./data/**/*"],
    "/api/tailor/download": ["./data/**/*"],
    "/api/cover-letter": ["./data/**/*"],
    "/api/master-data": ["./data/**/*"],
  },
};

export default nextConfig;
