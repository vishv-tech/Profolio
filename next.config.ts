import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // The Storage bucket enforces 10 MB. Multipart bodies need a small
      // allowance beyond the file itself for field and boundary overhead.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
