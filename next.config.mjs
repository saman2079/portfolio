/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" bundles a minimal server + only the deps that are actually
  // used, which keeps the final Docker image small (see Dockerfile).
  output: "standalone",
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
