import type { NextConfig } from "next";

const rawBackend =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://backend:8000";

const backendUrl = rawBackend.startsWith("http")
  ? rawBackend.replace(/\/$/, "")
  : `https://${rawBackend.replace(/\/$/, "")}`;

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
