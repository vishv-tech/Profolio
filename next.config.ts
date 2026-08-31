import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF.js resolves its Node fake worker relative to the installed package.
  // Keeping the package external preserves that supported module boundary in
  // both Turbopack development and production server builds.
  serverExternalPackages: ["pdfjs-dist"],
  experimental: {
    serverActions: {
      // The Storage bucket enforces 10 MB. Multipart bodies need a small
      // allowance beyond the file itself for field and boundary overhead.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
