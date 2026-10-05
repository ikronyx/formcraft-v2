/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Set in .env.production (build time) and .env (runtime), e.g. /formcraft
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};
export default nextConfig;
