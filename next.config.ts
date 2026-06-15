import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores stray lockfiles in parent dirs.
  turbopack: {
    root: __dirname,
  },
  // Allow remote hackathon thumbnails (Devpost / MLH CDNs) if we add next/image.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
