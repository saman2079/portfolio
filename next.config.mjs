/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" bundles a minimal server + only the deps that are used,
  // which keeps the Docker image small (see Dockerfile).
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        // Frames and résumés never change in place: cache them hard.
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/resume/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },

  // Kept from the original setup so a deploy is never blocked by lint/type noise;
  // run `npm run type-check` and `npm run lint` locally before pushing.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
