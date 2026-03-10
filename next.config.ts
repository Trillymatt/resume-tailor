import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/tailor": ["./data/**/*"],
    "/api/tailor/download": ["./data/**/*"],
    "/api/tailor/download-pdf": ["./data/**/*"],
    "/api/cover-letter": ["./data/**/*"],
    "/api/master-data": ["./data/**/*"],
    "/api/applications": ["./data/**/*"],
    "/api/keyword-analysis": ["./data/**/*"],
  },
};

export default nextConfig;
