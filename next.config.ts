import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "pdf-parse", "canvas", "nodemailer"],
  outputFileTracingIncludes: {
    "/*": ["./public/vercel-empty.db", "./prisma/vercel-empty.db"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
